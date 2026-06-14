import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { getChatMessages, sendChatMessage, recordCorrect, recordAnswer, getTotalUnreadDms } from '../utils/db.js'
import DirectMessagesScreen from './DirectMessagesScreen.jsx'
import { rnd } from '../utils/helpers.js'
import { supabase } from '../lib/supabase.js'

const BOT = 'LinguaBot 🤖'
const HEADER_H = 56  // App-level fixed header height
const NAV_H    = 70  // App-level bottom nav height

// ═══════════════════════════════════════════════════════════
// GroupChat — messages + input only (header lives in wrapper)
// ═══════════════════════════════════════════════════════════
function GroupChat({ user, lang, postChallenge, challenge, setChallenge }) {
  const { C } = useTheme()
  const [msgs,    setMsgs]    = useState([])
  const [inp,     setInp]     = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  // Messages visible to this user
  const visible = msgs.filter(m => !m.is_bot || !m.lang || m.lang === lang)

  // Keep wrapper informed of the current open challenge (for header button state, if needed)
  useEffect(() => {
    const c = [...visible].reverse().find(m => m.is_bot && m.word_id)
    setChallenge?.(c)
  }, [visible]) // eslint-disable-line

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    getChatMessages(100).then(m => { setMsgs(m); setLoading(false) })
  }, [])

  // ── Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel('chat_msgs')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'chat_messages' },
        p => setMsgs(prev => [...prev, p.new]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // ── Scroll ────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth', block:'end' })
  }, [visible.length])

  // ── Auto-post challenges ────────────────────────────────────────
  useEffect(() => {
    postChallenge()
    const id = setInterval(postChallenge, 20000)
    return () => clearInterval(id)
  }, [postChallenge])

  // ── Send ──────────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!inp.trim()) return
    const text = inp.trim()
    setInp('')

    await sendChatMessage({ userId: user.id, username: user.username, text })

    if (text.startsWith(':') && challenge?.word_id) {
      const answer = text.slice(1).trim()
      const word   = allWords(lang).find(w => w.id === challenge.word_id)
      if (word) {
        recordAnswer(user.id)
        const ok = answer.toLowerCase() === word.t.toLowerCase()
        if (ok) recordCorrect(user.id)
        const hint = word.t.slice(0, Math.ceil(word.t.length / 2)) + '...'
        await sendChatMessage({
          userId: null, username: BOT, isBot: true,
          text: ok
            ? `✅ სწორია, ${user.username}! 🎉 "${word.w}" = "${word.t}" 🔥`
            : `❌ ${user.username}: არასწორია. მინიშნება: "${hint}"`,
          lang, wordId: null
        })
      }
    }
  }

  const fmt = ts => new Date(ts).toLocaleTimeString('ka-GE', { hour:'2-digit', minute:'2-digit' })

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* ── Messages ────────────────────────────────────────── */}
      <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8,
                    minHeight:'40vh' }}>
        {loading && (
          <div style={{ textAlign:'center', color:C.ts, paddingTop:40 }}>იტვირთება...</div>
        )}

        {visible.map(m => {
          const isOwn   = m.user_id === user.id
          const isBot   = m.is_bot
          const isAnswer= !isBot && m.text?.startsWith(':')
          const isBotQ  = isBot && m.word_id
          const isBotOk = isBot && !m.word_id && m.text?.startsWith('✅')
          const isBotBad= isBot && !m.word_id && m.text?.startsWith('❌')

          return (
            <div key={m.id} style={{ display:'flex', flexDirection:'column',
                                     alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
              {!isOwn && (
                <div style={{ color:C.tm, fontSize:10, marginBottom:3, paddingLeft:4 }}>
                  {m.username} · {fmt(m.created_at)}
                </div>
              )}

              <div style={{
                maxWidth:'85%', padding:'10px 14px', wordBreak:'break-word',
                whiteSpace:'pre-wrap', lineHeight:1.5, fontSize:14,
                borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                color: isOwn ? '#fff' : C.t,
                boxShadow: isOwn ? `0 2px 12px ${C.aG}` : 'none',
                background: isOwn
                  ? (isAnswer
                      ? `linear-gradient(135deg,${C.g},#0fa37a)`
                      : `linear-gradient(135deg,${C.a},${C.p})`)
                  : isBotQ   ? `${C.a}18`
                  : isBotOk  ? `${C.g}18`
                  : isBotBad ? `${C.r}18`
                  : C.card2,
                border: isOwn ? 'none'
                  : isBotQ  ? `1px solid ${C.a}55`
                  : isBotOk ? `1px solid ${C.g}55`
                  : isBotBad? `1px solid ${C.r}44`
                  : `1px solid ${C.bdL}`,
              }}>
                {isAnswer && (
                  <div style={{ fontSize:11, opacity:.8, marginBottom:3 }}>
                    ✏️ პასუხი:
                  </div>
                )}
                {isAnswer ? m.text.slice(1).trim() : m.text}
              </div>

              {isOwn && (
                <div style={{ color:C.tm, fontSize:10, marginTop:3, paddingRight:4 }}>
                  {fmt(m.created_at)}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input — sticky above bottom nav ──────────────────── */}
      <div style={{
        position:'sticky', bottom:NAV_H, zIndex:40,
        padding:'10px 14px', borderTop:`1px solid ${C.bdL}`,
        display:'flex', gap:8, background:C.bg,
      }}>
        <div style={{ flex:1, position:'relative' }}>
          <input value={inp} onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key==='Enter' && sendMsg()}
            placeholder={
              inp.startsWith(':')
                ? '🎯 ქართული თარგმანი...'
                : 'შეტყობინება... (: პასუხისთვის)'
            }
            style={{
              width:'100%', boxSizing:'border-box',
              background: C.card3,
              border: `1px solid ${inp.startsWith(':') ? C.g : C.bdL}`,
              borderRadius:12, padding:'12px 14px', color:C.t,
              fontSize:14, outline:'none', fontFamily:'inherit',
              transition:'border-color .2s'
            }}
          />
          {inp.startsWith(':') && (
            <div style={{ position:'absolute', top:-22, left:0,
                          color:C.g, fontSize:11, fontWeight:700 }}>
              🎯 პასუხის რეჟიმი
            </div>
          )}
        </div>
        <button onClick={sendMsg}
          style={{ background:`linear-gradient(135deg,${C.a},${C.p})`,
                   border:'none', borderRadius:12, width:46, height:46,
                   color:'#fff', fontSize:20, cursor:'pointer',
                   display:'flex', alignItems:'center', justifyContent:'center',
                   boxShadow:`0 2px 12px ${C.aG}`, flexShrink:0 }}>➤</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Wrapper — Tabs (sticky) + Group/DM content
// ═══════════════════════════════════════════════════════════
export default function ChatScreen({ user, lang }) {
  const { C } = useTheme()
  const lc = LANG[lang]
  const [tab,     setTab]     = useState('group')
  const [unread,  setUnread]  = useState(0)
  const [challenge, setChallenge] = useState(null)

  // ── Unread DM badge ──────────────────────────────────────────
  useEffect(() => {
    const load = () => getTotalUnreadDms(user.id).then(setUnread)
    load()
    const ch = supabase.channel('dm_unread_badge')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'direct_messages' },
        p => { if (p.new.receiver_id === user.id) load() })
      .subscribe()
    const id = setInterval(load, 15000)
    return () => { supabase.removeChannel(ch); clearInterval(id) }
  }, [user.id])

  // ── Bot challenge poster (stable per-language identity) ──────
  const postChallenge = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('is_bot', true).eq('lang', lang)
        .not('word_id', 'is', null)
        .order('created_at', { ascending: false }).limit(1).single()
      if (data && Date.now() - new Date(data.created_at).getTime() < 18000) return
    } catch {}
    const word = rnd(allWords(lang))
    await sendChatMessage({
      userId: null, username: BOT, isBot: true,
      text: `${lc.flag} ახალი გამოწვევა!\nსიტყვა: "${word.w}" ${word.ph}\n🎯 პასუხისთვის დაიწყე : სიმბოლოთი`,
      lang, wordId: word.id
    })
  }, [lang]) // eslint-disable-line

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ══ STICKY: Tabs + (group) header + hint ══════════════ */}
      <div style={{ position:'sticky', top:HEADER_H, zIndex:40,
                    background:C.bg }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, padding:'10px 14px 0',
                      borderBottom:`1px solid ${C.bdL}` }}>
          {[
            { id:'group', label:'💬 საერთო ჩათი' },
            { id:'dm',    label:'✉️ პირადი' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id==='dm') setUnread(0) }}
              style={{ flex:1, padding:'9px 0', borderRadius:'10px 10px 0 0', cursor:'pointer',
                       border:'none', borderBottom: tab===t.id ? `2px solid ${C.a}` : `2px solid transparent`,
                       marginBottom:-1,
                       background: tab===t.id ? C.card2 : 'transparent',
                       color: tab===t.id ? C.t : C.ts, fontWeight: tab===t.id ? 700 : 400,
                       fontSize:13, fontFamily:'inherit', position:'relative',
                       display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {t.label}
              {t.id==='dm' && unread>0 && (
                <span style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, borderRadius:8,
                              minWidth:18, height:18, padding:'0 5px', display:'flex', alignItems:'center',
                              justifyContent:'center', color:'#fff', fontSize:10, fontWeight:800 }}>
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* GroupChat header + hint — only on group tab */}
        {tab === 'group' && (
          <>
            <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.bdL}`,
                          display:'flex', alignItems:'center', gap:10, background:C.bg }}>
              <span style={{ fontSize:24 }}>💬</span>
              <div style={{ flex:1 }}>
                <div style={{ color:C.t, fontWeight:700, fontSize:15 }}>სწავლის ჩათი</div>
                <div style={{ color:C.ts, fontSize:11 }}>
                  {lc.flag} {lc.name} · Realtime · ყველა მომხმარებელი
                </div>
              </div>
              <button onClick={postChallenge}
                style={{ background:`${C.a}22`, border:`1px solid ${C.a}44`, borderRadius:8,
                         padding:'5px 10px', color:C.a, fontSize:12, cursor:'pointer',
                         fontWeight:700, fontFamily:'inherit' }}>+ ახალი</button>
            </div>

            <div style={{ padding:'7px 16px', background:`${C.gold}0f`,
                          borderBottom:`1px solid ${C.gold}22`,
                          display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>💡</span>
              <span style={{ color:C.gold, fontSize:11, lineHeight:1.4 }}>
                პასუხი: <strong style={{ background:`${C.gold}33`, padding:'1px 5px', borderRadius:4 }}>:</strong> სიმბოლოთი დაიწყე →{' '}
                <strong>: პარადოქსი</strong>
                <span style={{ color:C.ts, marginLeft:6 }}>· ჩვეულებ. გაგზავნა — თავისუფლად</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* ══ CONTENT ════════════════════════════════════════════ */}
      {tab==='group'
        ? <GroupChat user={user} lang={lang} postChallenge={postChallenge}
                     challenge={challenge} setChallenge={setChallenge} />
        : <DirectMessagesScreen user={user} />}
    </div>
  )
        }
                    
