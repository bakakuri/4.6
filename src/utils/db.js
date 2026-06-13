import { supabase } from '../lib/supabase.js'
import { allWords } from '../data/words.js'

const weekStart = () => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

// ── Word Progress ──────────────────────────────────────────────
export const getProgress = async (userId, lang) => {
  const { data, error } = await supabase
    .from('word_progress').select('word_id,mastery,updated_at')
    .eq('user_id', userId).eq('lang', lang)
  if (error) { console.error(error); return {} }
  return Object.fromEntries(
    (data||[]).map(r => [r.word_id, { mastery: r.mastery, ts: new Date(r.updated_at).getTime() }])
  )
}

export const saveProgress = async (userId, lang, wordId, mastery) => {
  const { error } = await supabase.from('word_progress')
    .upsert({ user_id: userId, lang, word_id: wordId, mastery, updated_at: new Date().toISOString() },
             { onConflict: 'user_id,word_id,lang' })
  if (error) console.error(error)
}

export const nextCardFromProgress = (progMap, lang) => {
  const ws = allWords(lang)
  const unseen = ws.filter(w => !progMap[w.id])
  if (unseen.length) return unseen[0]
  const candidates = ws
    .filter(w => (progMap[w.id]?.mastery || 0) < 100)
    .sort((a, b) => {
      const pa = progMap[a.id] || { mastery: 0, ts: 0 }
      const pb = progMap[b.id] || { mastery: 0, ts: 0 }
      if (pa.mastery !== pb.mastery) return pa.mastery - pb.mastery
      return (pa.ts || 0) - (pb.ts || 0)
    })
  return candidates[0] || null
}

// ── Stats ──────────────────────────────────────────────────────
export const getStats = async (userId, lang) => {
  const ws = allWords(lang)
  const [{ data: prog }, { data: prof }, { data: acts }] = await Promise.all([
    supabase.from('word_progress').select('mastery').eq('user_id', userId).eq('lang', lang),
    supabase.from('profiles').select('sessions,streak,chat_correct,chat_total').eq('id', userId).single(),
    supabase.from('activity').select('day_of_week,value').eq('user_id', userId).eq('week_start', weekStart()),
  ])
  const p       = prof || {}
  const learned = (prog||[]).filter(r => r.mastery >= 100).length
  const inProg  = (prog||[]).filter(r => r.mastery > 0 && r.mastery < 100).length
  const chatOk  = p.chat_correct || 0
  const chatTot = p.chat_total   || 0
  const activity = Array.from({ length: 7 }, (_, i) =>
    (acts||[]).find(r => r.day_of_week === i)?.value || 0)
  return {
    learned, inProg, total: ws.length,
    sessions: p.sessions || 0,
    streak:   p.streak   || 0,
    chatCorrect: chatOk,
    totalAns:    chatTot,
    accuracy: chatTot ? Math.round((chatOk / chatTot) * 100) : null,
    activity,
  }
}

// ── Profile ────────────────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  if (error) { console.error(error); return null }
  return data
}

export const updateProfile = async (userId, updates) => {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) console.error(error)
}

// ── Session (no RPC – direct update) ──────────────────────────
export const bumpSession = async (userId) => {
  try {
    const { data } = await supabase
      .from('profiles').select('sessions').eq('id', userId).single()
    await supabase.from('profiles')
      .update({ sessions: (data?.sessions || 0) + 1 })
      .eq('id', userId)
  } catch(e) { console.error('bumpSession', e) }
}

// ── Activity (no RPC – select then upsert) ─────────────────────
export const bumpActivity = async (userId) => {
  try {
    const day  = new Date().getDay()
    const week = weekStart()
    const { data } = await supabase
      .from('activity').select('value')
      .eq('user_id', userId).eq('day_of_week', day).eq('week_start', week)
      .maybeSingle()
    if (data) {
      await supabase.from('activity')
        .update({ value: Math.min(100, (data.value || 0) + 10) })
        .eq('user_id', userId).eq('day_of_week', day).eq('week_start', week)
    } else {
      await supabase.from('activity')
        .insert({ user_id: userId, day_of_week: day, week_start: week, value: 10 })
    }
  } catch(e) { console.error('bumpActivity', e) }
}

// ── Chat analytics (no RPC) ────────────────────────────────────
export const recordCorrect = async (userId) => {
  try {
    const { data } = await supabase
      .from('profiles').select('chat_correct,chat_total').eq('id', userId).single()
    await supabase.from('profiles').update({
      chat_correct: (data?.chat_correct || 0) + 1,
      chat_total:   (data?.chat_total   || 0) + 1,
    }).eq('id', userId)
  } catch(e) { console.error('recordCorrect', e) }
}

export const recordAnswer = async (userId) => {
  try {
    const { data } = await supabase
      .from('profiles').select('chat_total').eq('id', userId).single()
    await supabase.from('profiles')
      .update({ chat_total: (data?.chat_total || 0) + 1 })
      .eq('id', userId)
  } catch(e) { console.error('recordAnswer', e) }
}

// ── Chat messages ──────────────────────────────────────────────
export const getChatMessages = async (limit = 60) => {
  const { data, error } = await supabase
    .from('chat_messages').select('*')
    .order('created_at', { ascending: false }).limit(limit)
  if (error) { console.error(error); return [] }
  return (data||[]).reverse()
}

export const sendChatMessage = async ({ userId, username, text, isBot=false, wordId=null }) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: isBot ? null : userId, username, text, is_bot: isBot, word_id: wordId })
    .select().single()
  if (error) { console.error(error); return null }
  return data
}

export const clearChatMessages = async () => {
  const { error } = await supabase.from('chat_messages').delete().gte('created_at', '1970-01-01')
  if (error) console.error(error)
}

// ── Admin ──────────────────────────────────────────────────────
export const getAllProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) { console.error(error); return [] }
  return data || []
}

export const getLeaderboard = async (lang) => {
  const { data: profiles } = await supabase
    .from('profiles').select('id,username,streak,chat_correct,chat_total')
  if (!profiles?.length) return []
  const results = await Promise.all(profiles.map(async p => {
    const { data: prog } = await supabase
      .from('word_progress').select('mastery', { count:'exact', head:false })
      .eq('user_id', p.id).eq('lang', lang).gte('mastery', 100)
    const learned = prog?.length || 0
    const chatTot = p.chat_total || 0
    const chatOk  = p.chat_correct || 0
    return { ...p, learned, accuracy: chatTot ? Math.round((chatOk/chatTot)*100) : 0 }
  }))
  return results.sort((a, b) => b.learned - a.learned)
  }
  
