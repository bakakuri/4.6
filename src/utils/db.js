import { supabase } from '../lib/supabase.js'
import { allWords } from '../data/words.js'
import { checkNewAchievements } from './gamification.js'

const weekStart = () => {
  const d = new Date(); d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}
const today     = () => new Date().toISOString().slice(0, 10)
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10)

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
  return ws
    .filter(w => (progMap[w.id]?.mastery || 0) < 100)
    .sort((a, b) => {
      const pa = progMap[a.id] || { mastery:0, ts:0 }
      const pb = progMap[b.id] || { mastery:0, ts:0 }
      if (pa.mastery !== pb.mastery) return pa.mastery - pb.mastery
      return (pa.ts||0) - (pb.ts||0)
    })[0] || null
}

// ── Stats ──────────────────────────────────────────────────────
export const getStats = async (userId, lang) => {
  const ws = allWords(lang)
  const [{ data: prog }, { data: prof }, { data: acts }] = await Promise.all([
    supabase.from('word_progress').select('mastery').eq('user_id', userId).eq('lang', lang),
    supabase.from('profiles').select('sessions,streak,chat_correct,chat_total,xp,daily_goal,achievements').eq('id', userId).single(),
    supabase.from('activity').select('day_of_week,value').eq('user_id', userId).eq('week_start', weekStart()),
  ])
  const p       = prof || {}
  const learned = (prog||[]).filter(r => r.mastery >= 100).length
  const inProg  = (prog||[]).filter(r => r.mastery > 0 && r.mastery < 100).length
  const chatOk  = p.chat_correct || 0
  const chatTot = p.chat_total   || 0
  const activity = Array.from({ length:7 }, (_, i) =>
    (acts||[]).find(r => r.day_of_week === i)?.value || 0)
  return {
    learned, inProg, total: ws.length,
    sessions: p.sessions || 0,
    streak:   p.streak   || 0,
    chatCorrect: chatOk, totalAns: chatTot,
    accuracy: chatTot ? Math.round((chatOk / chatTot) * 100) : null,
    activity,
    xp:           p.xp || 0,
    daily_goal:   p.daily_goal || 10,
    achievements: p.achievements || [],
  }
}

// ── Profile ────────────────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) { console.error(error); return null }
  return data
}
export const updateProfile = async (userId, updates) => {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) console.error(error)
}

// ── Session ────────────────────────────────────────────────────
export const bumpSession = async (userId) => {
  try {
    const { data } = await supabase.from('profiles').select('sessions').eq('id', userId).single()
    await supabase.from('profiles').update({ sessions: (data?.sessions || 0) + 1 }).eq('id', userId)
  } catch(e) { console.error('bumpSession', e) }
}

// ── Activity + Streak ──────────────────────────────────────────
export const bumpActivity = async (userId) => {
  try {
    const dow  = new Date().getDay()
    const week = weekStart()
    const td   = today()
    const yd   = yesterday()

    const { data: act } = await supabase.from('activity').select('value')
      .eq('user_id', userId).eq('day_of_week', dow).eq('week_start', week).maybeSingle()
    if (act) {
      await supabase.from('activity')
        .update({ value: Math.min(100, (act.value || 0) + 10) })
        .eq('user_id', userId).eq('day_of_week', dow).eq('week_start', week)
    } else {
      await supabase.from('activity').insert({ user_id: userId, day_of_week: dow, week_start: week, value: 10 })
    }

    const { data: prof } = await supabase.from('profiles').select('streak,last_active').eq('id', userId).single()
    const last = prof?.last_active
    let streak = prof?.streak || 0
    if      (last === td) { /* same day, no change */ }
    else if (last === yd) { streak++; await supabase.from('profiles').update({ streak, last_active: td }).eq('id', userId) }
    else                  { streak = 1; await supabase.from('profiles').update({ streak, last_active: td }).eq('id', userId) }
  } catch(e) { console.error('bumpActivity', e) }
}

// ── XP ─────────────────────────────────────────────────────────
export const awardXP = async (userId, amount) => {
  try {
    const { data } = await supabase.from('profiles').select('xp').eq('id', userId).single()
    const newXp = (data?.xp || 0) + amount
    await supabase.from('profiles').update({ xp: newXp }).eq('id', userId)
    return newXp
  } catch(e) { console.error('awardXP', e); return 0 }
}

// ── Achievements ───────────────────────────────────────────────
export const updateAchievements = async (userId, stats) => {
  try {
    const { data } = await supabase.from('profiles')
      .select('achievements,xp,streak').eq('id', userId).single()
    const earned = data?.achievements || []
    const fullStats = { ...stats, xp: data?.xp || 0, streak: data?.streak || 0 }
    const newOnes = checkNewAchievements(fullStats, earned)
    if (newOnes.length) {
      await supabase.from('profiles')
        .update({ achievements: [...earned, ...newOnes.map(a => a.id)] })
        .eq('id', userId)
    }
    return newOnes
  } catch(e) { console.error('updateAchievements', e); return [] }
}

// ── Daily Progress ─────────────────────────────────────────────
export const getDailyLearned = async (userId, lang) => {
  try {
    const start = today() + 'T00:00:00'
    const { data } = await supabase.from('word_progress').select('word_id')
      .eq('user_id', userId).eq('lang', lang).gte('mastery', 100).gte('updated_at', start)
    return data?.length || 0
  } catch(e) { return 0 }
}

// ── Leaderboard ────────────────────────────────────────────────
export const getLeaderboard = async () => {
  try {
    const { data } = await supabase.from('profiles')
      .select('username, xp, streak, photo_url').order('xp', { ascending: false }).limit(5)
    return data || []
  } catch(e) { return [] }
}

// ── Chat analytics ─────────────────────────────────────────────
export const recordCorrect = async (userId) => {
  try {
    const { data } = await supabase.from('profiles').select('chat_correct,chat_total').eq('id', userId).single()
    await supabase.from('profiles').update({
      chat_correct: (data?.chat_correct || 0) + 1,
      chat_total:   (data?.chat_total   || 0) + 1,
    }).eq('id', userId)
  } catch(e) { console.error(e) }
}
export const recordAnswer = async (userId) => {
  try {
    const { data } = await supabase.from('profiles').select('chat_total').eq('id', userId).single()
    await supabase.from('profiles').update({ chat_total: (data?.chat_total || 0) + 1 }).eq('id', userId)
  } catch(e) { console.error(e) }
}

// ── Chat messages ──────────────────────────────────────────────
export const getChatMessages = async (limit = 100) => {
  const { data, error } = await supabase.from('chat_messages').select('*')
    .order('created_at', { ascending:false }).limit(limit)
  if (error) { console.error(error); return [] }
  const msgs = (data||[]).reverse()
  // Attach photo_url from profiles for non-bot messages
  const userIds = [...new Set(msgs.filter(m => m.user_id).map(m => m.user_id))]
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles')
      .select('id,photo_url').in('id', userIds)
    const photoMap = Object.fromEntries((profs||[]).map(p => [p.id, p.photo_url]))
    return msgs.map(m => ({ ...m, photo_url: m.user_id ? (photoMap[m.user_id] || null) : null }))
  }
  return msgs
}
export const sendChatMessage = async ({ userId, username, text, isBot=false, wordId=null, lang=null }) => {
  const { data, error } = await supabase.from('chat_messages')
    .insert({ user_id: isBot ? null : userId, username, text, is_bot: isBot, word_id: wordId, lang })
    .select().single()
  if (error) { console.error(error); return null }
  return data
}
export const clearChatMessages = async () => {
  await supabase.from('chat_messages').delete().gte('created_at', '1970-01-01')
}

// ── Admin ──────────────────────────────────────────────────────
export const getAllProfiles = async () => {
  const { data } = await supabase.from('profiles').select('*').order('created_at')
  return data || []
}

// ── Direct Messages ──────────────────────────────────────────
export const getDmUsers = async (myId) => {
  // All profiles except self
  const { data: profiles } = await supabase
    .from('profiles').select('id,username,photo_url').neq('id', myId)
  if (!profiles?.length) return []

  // Last message + unread count per conversation
  const results = await Promise.all(profiles.map(async p => {
    const { data: msgs } = await supabase
      .from('direct_messages').select('text,sender_id,receiver_id,read,created_at')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: false }).limit(20)

    const last = msgs?.[0]
    const unread = (msgs || []).filter(m => m.receiver_id === myId && !m.read).length
    return { ...p, lastMsg: last?.text || null, lastTime: last?.created_at || null, unread }
  }))

  // Sort: unread first, then by last message time, then alphabetically
  return results.sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread
    if (a.lastTime && b.lastTime) return new Date(b.lastTime) - new Date(a.lastTime)
    if (a.lastTime) return -1
    if (b.lastTime) return 1
    return a.username.localeCompare(b.username)
  })
}

export const getDmThread = async (myId, otherId) => {
  const { data, error } = await supabase
    .from('direct_messages').select('*')
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export const sendDm = async (senderId, receiverId, text) => {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, text })
    .select().single()
  if (error) { console.error(error); return null }
  return data
}

export const markDmRead = async (myId, otherId) => {
  await supabase.from('direct_messages')
    .update({ read: true })
    .eq('sender_id', otherId).eq('receiver_id', myId).eq('read', false)
}

export const getTotalUnreadDms = async (myId) => {
  const { count } = await supabase
    .from('direct_messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', myId).eq('read', false)
  return count || 0
}

// ── Heatmap ───────────────────────────────────────────────────
export const getHeatmap = async (userId, lang) => {
  try {
    const since = new Date(); since.setFullYear(since.getFullYear() - 1)
    const { data } = await supabase.from('word_progress')
      .select('updated_at').eq('user_id', userId).eq('lang', lang)
      .gte('updated_at', since.toISOString())
    const map = {}
    ;(data || []).forEach(r => {
      const day = r.updated_at.slice(0, 10)
      map[day] = (map[day] || 0) + 1
    })
    return map
  } catch { return {} }
}

// ── Duel ─────────────────────────────────────────────────────
export const createDuel = async (challengerId, opponentId, challengerName, opponentName, lang, wordIds) => {
  const { data, error } = await supabase.from('duels').insert({
    challenger_id: challengerId, opponent_id: opponentId,
    challenger_name: challengerName, opponent_name: opponentName,
    lang, words: wordIds, status: 'pending'
  }).select().single()
  if (error) throw error
  return data
}

export const respondDuel = async (duelId, accept) => {
  const { data } = await supabase.from('duels')
    .update({ status: accept ? 'active' : 'declined', updated_at: new Date().toISOString() })
    .eq('id', duelId).select().single()
  return data
}

export const submitDuelScore = async (duelId, isChallenger, score, done) => {
  await supabase.rpc('duel_submit', {
    p_duel_id: duelId, p_is_challenger: isChallenger,
    p_score: score, p_done: done
  })
}

export const getActiveDuel = async (userId) => {
  try {
    const { data } = await supabase.from('duels')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false }).limit(1).single()
    return data
  } catch { return null }
}

// ── XP increment (race-condition safe via RPC) ───────────────
export const addXP = async (userId, amount) => {
  try {
    const { data } = await supabase.rpc('increment_xp', {
      p_user_id: userId,
      p_amount:  amount
    })
    return data ?? 0
  } catch {
    // fallback: read-then-write
    const { data: p } = await supabase.from('profiles').select('xp').eq('id', userId).single()
    const next = (p?.xp || 0) + amount
    await supabase.from('profiles').update({ xp: next }).eq('id', userId)
    return next
  }
}

// ── Admin functions ───────────────────────────────────────────
export const adminSetXP = async (userId, xp) =>
  supabase.from('profiles').update({ xp: Number(xp) }).eq('id', userId)

export const adminSetStreak = async (userId, streak) =>
  supabase.from('profiles').update({ streak: Number(streak) }).eq('id', userId)

export const adminToggleAdmin = async (userId, isAdmin) =>
  supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId)

export const adminToggleBlock = async (userId, blocked) =>
  supabase.from('profiles').update({ chat_blocked: blocked }).eq('id', userId)

export const adminDeleteMessage = async (msgId) =>
  supabase.from('chat_messages').delete().eq('id', msgId)

export const adminDeleteUserMessages = async (userId) =>
  supabase.from('chat_messages').delete().eq('user_id', userId)

export const adminBroadcast = async (text, adminName) =>
  supabase.from('chat_messages').insert({
    user_id: null, username: `📢 ${adminName}`, text,
    is_bot: true, word_id: null
  })

export const getSiteStats = async () => {
  const [{ data: profs }, { data: wp }, { data: msgs }] = await Promise.all([
    supabase.from('profiles').select('xp,sessions,streak,current_lang,chat_blocked,created_at'),
    supabase.from('word_progress').select('id', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
  ])
  const ps = profs || []
  const today = new Date().toDateString()
  return {
    totalUsers:    ps.length,
    totalXP:       ps.reduce((s, p) => s + (p.xp || 0), 0),
    totalSessions: ps.reduce((s, p) => s + (p.sessions || 0), 0),
    activeToday:   ps.filter(p => p.streak > 0).length,
    blockedCount:  ps.filter(p => p.chat_blocked).length,
    totalWords:    wp?.length ?? 0,
    totalMsgs:     msgs?.length ?? 0,
    byLang:        ps.reduce((acc, p) => {
      const l = p.current_lang || 'unknown'
      acc[l] = (acc[l] || 0) + 1; return acc
    }, {}),
    newToday: ps.filter(p => new Date(p.created_at).toDateString() === today).length,
  }
}
