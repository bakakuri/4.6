import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { getDmUsers, getDmThread, sendDm, markDmRead } from '../utils/db.js'
import { supabase } from '../lib/supabase.js'

// ── Conversation Thread ──────────────────────────────────────
function Thread({ user, other, onBack }) {
  const { C } = useTheme()
  const [msgs,    setMsgs]    = useState([])
  const [inp,     setInp]     = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    getDmThread(user.id, other.id).then(m => { setMsgs(m); setLoading(false) })
    markDmRead(user.id, other.id)
  }, [user.id, other.id])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`dm_${user.id}_${other.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'direct_messages' },
        p => {
          const m = p.new
          const belongs = (m.sender_id===user.id && m.receiver_id===other.id) ||
                          (m.sender_id===other.id && m.receiver_id===user.id)
          if (belongs) {
            setMsgs(prev => [...prev, m])
            if (m.receiver_id === user.id) markDmRead(user.id, other.id)
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user.id, other.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs.length])

  const send = async () => {
    if (!inp.trim()) return
    const text = inp.trim(); setInp('')
    await sendDm(user.id, other.id, text)
  }

  const fmt = ts => new Date(ts).toLocaleTimeString('ka-GE', { hour:'2-digit', minute:'2-digit' })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
                  fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.bdL}`,
                    display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack}
          style={{ background:C.card3, border:`1px solid ${C.bdL}`, borderRadius:10,
                   width:36, height:36, cursor:'pointer', color:C.ts, fontSize:18,
                   display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', flexShrink:0,
                      background:C.card3, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {other.photo_url
            ? <img src={other.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ color:C.a, fontWeight:800, fontSize:13 }}>{other.username.slice(0,2).toUpperCase()}</span>}
        </div>
        <div style={{ color:C.t, fontWeight:700, fontSize:15 }}>{other.username}</div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px',
                    display:'flex', flexDirection:'column', gap:6 }}>
        {loading && <div style={{ textAlign:'center', color:C.ts, paddingTop:40 }}>იტვირთება...</div>}
        {!loading && msgs.length===0 && (
          <div style={{ textAlign:'center', color:C.tm, paddingTop:50 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>✉️</div>
            ჯერ შეტყობინება არ არის — დაუგზავნე {other.username}-ს!
          </div>
        )}
        {msgs.map(m => {
          const isOwn = m.sender_id === user.id
          return (
            <div key={m.id} style={{ display:'flex', flexDirection:'column',
                                     alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth:'78%', padding:'9px 13px', wordBreak:'break-word',
                whiteSpace:'pre-wrap', lineHeight:1.45, fontSize:14,
                borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                color: isOwn ? '#fff' : C.t,
                background: isOwn ? `linear-gradient(135deg,${C.a},${C.p})` : C.card2,
                border: isOwn ? 'none' : `1px solid ${C.bdL}`,
                boxShadow: isOwn ? `0 2px 10px ${C.aG}` : 'none',
              }}>{m.text}</div>
              <div style={{ color:C.tm, fontSize:10, marginTop:2,
                            paddingLeft: isOwn?0:4, paddingRight: isOwn?4:0 }}>
                {fmt(m.created_at)}{isOwn && m.read ? ' · წაკითხულია' : ''}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'10px 14px', borderTop:`1px solid ${C.bdL}`,
                    display:'flex', gap:8, background:C.bg }}>
        <input value={inp} onChange={e=>setInp(e.target.value)}
          onKeyDown={e=>e.key==='Enter' && send()}
          name="dm-message" type="text"
          autoComplete="off" autoCorrect="off"
          autoCapitalize="sentences" spellCheck="false"
          data-lpignore="true" data-1p-ignore data-form-type="other"
          placeholder="შეტყობინება..."
          style={{ flex:1, boxSizing:'border-box', background:C.card3, border:`1px solid ${C.bdL}`,
                   borderRadius:12, padding:'12px 14px', color:C.t, fontSize:14, outline:'none',
                   fontFamily:'inherit' }} />
        <button onClick={send}
          style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none', borderRadius:12,
                   width:46, height:46, color:'#fff', fontSize:20, cursor:'pointer',
                   display:'flex', alignItems:'center', justifyContent:'center',
                   boxShadow:`0 2px 12px ${C.aG}`, flexShrink:0 }}>➤</button>
      </div>
    </div>
  )
}

// ── User List ─────────────────────────────────────────────────
export default function DirectMessagesScreen({ user }) {
  const { C } = useTheme()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [active,  setActive]  = useState(null) // selected conversation partner

  const load = () => getDmUsers(user.id).then(u => { setUsers(u); setLoading(false) })

  useEffect(() => { load() }, [user.id]) // eslint-disable-line

  // Refresh list when returning from a thread (to update last message/unread)
  useEffect(() => {
    if (!active) load()
  }, [active]) // eslint-disable-line

  // Realtime — refresh list on any new DM involving me
  useEffect(() => {
    const ch = supabase.channel('dm_list')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'direct_messages' },
        p => {
          if (p.new.sender_id===user.id || p.new.receiver_id===user.id) load()
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user.id]) // eslint-disable-line

  if (active) {
    return <Thread user={user} other={active} onBack={() => setActive(null)} />
  }

  const fmtTime = ts => {
    const d = new Date(ts), now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay
      ? d.toLocaleTimeString('ka-GE', { hour:'2-digit', minute:'2-digit' })
      : d.toLocaleDateString('ka-GE', { month:'short', day:'numeric' })
  }

  return (
    <div style={{ height:'100%', overflowY:'auto', boxSizing:'border-box',
                  padding:'12px 14px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ color:C.t, fontWeight:800, fontSize:18 }}>✉️ პირადი მიმოწერა</div>
        <div style={{ color:C.ts, fontSize:12, marginTop:2 }}>
          {users.filter(u=>u.unread>0).length > 0
            ? `${users.filter(u=>u.unread>0).length} წაუკითხავი საუბარი`
            : 'ყველაფერი წაკითხულია'}
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', color:C.ts, paddingTop:40 }}>იტვირთება...</div>}

      {!loading && users.length===0 && (
        <div style={{ textAlign:'center', color:C.tm, paddingTop:50 }}>
          სხვა მომხმარებლები არ მოიძებნა
        </div>
      )}

      {users.map(u => (
        <button key={u.id} onClick={() => setActive(u)}
          style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:12,
                   padding:'12px 10px', background: u.unread>0 ? `${C.a}0d` : 'transparent',
                   border:'none', borderRadius:14, marginBottom:4, cursor:'pointer',
                   fontFamily:'inherit' }}>
          <div style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', flexShrink:0,
                        background:C.card3, border:`2px solid ${u.unread>0?C.a:C.bdL}`,
                        display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            {u.photo_url
              ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ color:C.a, fontWeight:800, fontSize:15 }}>{u.username.slice(0,2).toUpperCase()}</span>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span style={{ color:C.t, fontWeight: u.unread>0?800:600, fontSize:14 }}>{u.username}</span>
              {u.lastTime && <span style={{ color:C.tm, fontSize:11, flexShrink:0, marginLeft:8 }}>{fmtTime(u.lastTime)}</span>}
            </div>
            <div style={{ color: u.unread>0?C.t:C.ts, fontSize:12, marginTop:2,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          fontWeight: u.unread>0?600:400 }}>
              {u.lastMsg || 'საუბრის დაწყება...'}
            </div>
          </div>
          {u.unread>0 && (
            <div style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, borderRadius:10,
                          minWidth:20, height:20, padding:'0 6px', display:'flex', alignItems:'center',
                          justifyContent:'center', color:'#fff', fontSize:11, fontWeight:800, flexShrink:0 }}>
              {u.unread}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
