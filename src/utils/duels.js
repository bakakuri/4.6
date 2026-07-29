import { supabase } from '../lib/supabase.js'

export async function getActiveDuel(userId) {
  const { data, error } = await supabase
    .from('duels')
    .select('*')
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('getActiveDuel', error)
    return null
  }

  return data?.[0] || null
}

export async function createDuel(challengerId, opponentId, challengerName, opponentName, lang, words) {
  const payload = {
    challenger_id: challengerId,
    opponent_id: opponentId,
    challenger_name: challengerName,
    opponent_name: opponentName,
    lang,
    words,
    status: 'pending',
    ch_score: 0,
    op_score: 0,
    ch_done: false,
    op_done: false,
    winner_id: null,
  }

  const { data, error } = await supabase
    .from('duels')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('createDuel', error)
    throw error
  }

  return data
}

export async function respondDuel(duelId, accept) {
  const patch = {
    status: accept ? 'active' : 'declined',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('duels')
    .update(patch)
    .eq('id', duelId)
    .select('*')
    .single()

  if (error) {
    console.error('respondDuel', error)
    throw error
  }

  return data
}

export async function submitDuelScore(duelId, isChallenger, score, done) {
  const { data: duel, error: readError } = await supabase
    .from('duels')
    .select('*')
    .eq('id', duelId)
    .single()

  if (readError) {
    console.error('submitDuelScore(read)', readError)
    throw readError
  }

  const next = {
    ch_score: isChallenger ? score : (duel.ch_score || 0),
    op_score: isChallenger ? (duel.op_score || 0) : score,
    ch_done: isChallenger ? done : Boolean(duel.ch_done),
    op_done: isChallenger ? Boolean(duel.op_done) : done,
    updated_at: new Date().toISOString(),
  }

  const bothDone = next.ch_done && next.op_done
  if (bothDone) {
    if (next.ch_score > next.op_score) next.winner_id = duel.challenger_id
    else if (next.op_score > next.ch_score) next.winner_id = duel.opponent_id
    else next.winner_id = null
    next.status = 'done'
  } else {
    next.status = duel.status === 'declined' ? 'declined' : 'active'
  }

  const { data, error } = await supabase
    .from('duels')
    .update(next)
    .eq('id', duelId)
    .select('*')
    .single()

  if (error) {
    console.error('submitDuelScore(write)', error)
    throw error
  }

  return data
}
