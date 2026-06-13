import { useTheme } from '../lib/ThemeContext.jsx'
import { useState, useEffect, useRef } from 'react'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { getChatMessages, sendChatMessage, recordCorrect, recordAnswer } from '../utils/db.js'
import { rnd } from '../utils/helpers.js'
import { supabase } from '../lib/supabase.js'

const BOT = 'LinguaBot 🤖'

export default function ChatScreen({ user, lang }) {
  const { C } = useTheme()
  const [msgs,    setMsgs]    = useState([])
  const [inp,     setInp]     = useState('')
  const [loading, setLoading] = useState(true)
  const [currWord,setCurrWord]= useState(null)
  const bottomRef = useRef(null)
  const lc = LANG[lang]

  // ── Initial load ─────────────────────────────────────────────
  useEffect(() => {
    getChatMessages().then(m => { setMsgs(m); setLoading(false) })
  }, [])

  // ── Supabase Realtime subscription ───────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          setMsgs(prev => [...prev, payload.new])
          // Track current challenge word from bot messages
          if (payload.new.is_bot && payload.new.word_id) setCurrWord(payload.new.word_id)
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // ── Bot challenge interval ────────────────────────────────────
  useEffect(() => {
    postChallenge()
    const id = setInterval(postChallenge, 20000)
    return () => clearInterval(id)
  }, [lang]) // eslint-disable-line

  const postChallenge = async () => {
    const word = rnd(allWords(lang))
    await sendChatMessage({
      userId: null,
      username: BOT,
      text: `${lc.flag} ახალი გამოწვევა! სიტყვა: "${word.w}" (${word.ph})\n🎯 ჩაწერე ქართული თარგმანი!`,
      isBot: true,
      wordId: word.id,
    })
  }

  // ── Send user message ─────────────────────────────────────────
  const sendMsg = async () => {
    if (!inp.trim()) return
    const text = inp.trim()
    setInp('')

    await sendChatMessage({ userId: user.id, username: user.username, text })

    // Check against current challenge
    if (currWord) {
      const word = allWords(lang).find(w => w.id === currWord)
      if (word) {
        const ok = text.trim().toLowerCase() === word.t.trim().toLowerCase()
        recordAnswer(user.id)
        if (ok) {
          recordCorrect(user.id)
          setCurrWord(null)
          setTimeout(() =>
            sendChatMessage({ userId: null, username: BOT,
              text: `✅ სწორია, ${user.username}! 🎉 "${word.w}" = "${word.t}" 🔥`,
              isBot: true }), 400)
        } else {
          const hint = word.t.slice(0, Math.ceil(word.t.length / 2)) + '...'
          setTimeout(() =>
            sendChatMessage({ userId: null, username: BOT,
              text: `❌ არასწორია. მინიშნება: "${hint}"`, isBot: true }), 400)
        }
      }
    }
  }

  const fmt = ts => new Date(ts).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.bdL}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>💬</span>
        <div>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15 }}>სწავლის ჩათი</div>
          <div style={{ color: C.ts, fontSize: 11 }}>{lc.flag} Realtime · ყველა მომხმარებელი</div>
        </div>
        <button onClick={postChallenge} style={{ marginLeft: 'auto', background: `${C.a}22`, border: `1px solid ${C.a}44`, borderRadius: 8, padding: '5px 10px', color: C.a, fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>+ ახალი</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ textAlign: 'center', color: C.ts, paddingTop: 40 }}>იტვირთება...</div>}
        {msgs.map(m => {
          const isOwn = m.user_id === user.id
          const isBot = m.is_bot
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
              {!isOwn && <div style={{ color: C.tm, fontSize: 10, marginBottom: 3, paddingLeft: 4 }}>{m.username} · {fmt(m.created_at)}</div>}
              <div style={{ maxWidth: '82%', padding: '10px 14px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5,
                            borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isOwn ? `linear-gradient(135deg,${C.a},${C.p})` : isBot ? C.card3 : C.card2,
                            border: isOwn ? 'none' : `1px solid ${isBot ? C.a + '44' : C.bdL}`,
                            color: C.t, fontSize: 14, boxShadow: isOwn ? `0 2px 12px ${C.aG}` : 'none' }}>
                {m.text}
              </div>
              {isOwn && <div style={{ color: C.tm, fontSize: 10, marginTop: 3, paddingRight: 4 }}>{fmt(m.created_at)}</div>}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.bdL}`, display: 'flex', gap: 8, background: 'rgba(7,9,26,.97)' }}>
        <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder="ჩაწერე პასუხი..."
          style={{ flex: 1, background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 12, padding: '12px 14px', color: C.t, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={sendMsg}
          style={{ background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 12, width: 46, height: 46, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 12px ${C.aG}`, flexShrink: 0 }}>➤</button>
      </div>
    </div>
  )
}
