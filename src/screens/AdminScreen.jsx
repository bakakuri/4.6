import { useState, useEffect } from 'react'
import { C, gls } from '../theme.js'
import { getAllProfiles, getLeaderboard, clearChatMessages } from '../utils/db.js'
import { supabase } from '../lib/supabase.js'

export default function AdminScreen({ lang }) {
  const [tab,       setTab]       = useState('users')
  const [profiles,  setProfiles]  = useState([])
  const [leaders,   setLeaders]   = useState([])
  const [chatMsgs,  setChatMsgs]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [ps, lb, { data: msgs }] = await Promise.all([
        getAllProfiles(),
        getLeaderboard(lang),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(20)
      ])
      setProfiles(ps)
      setLeaders(lb)
      setChatMsgs((msgs || []).reverse())
      setLoading(false)
    }
    load()
  }, [lang])

  const handleClearChat = async () => {
    await clearChatMessages()
    setChatMsgs([])
  }

  const TABS = [
    { id: 'users',  label: 'მომხმარ.', icon: '👥' },
    { id: 'stats',  label: 'ლიდერ.',   icon: '🏆' },
    { id: 'chat',   label: 'ჩათი',     icon: '💬' },
  ]

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ color: C.ts }}>იტვირთება...</div>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ color: C.t, fontWeight: 800, fontSize: 22, marginBottom: 16 }}>⚙️ ადმინ პანელი</div>

      <div style={{ display: 'flex', background: C.card3, borderRadius: 12, padding: 4, marginBottom: 18, gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '8px 0', background: tab === t.id ? C.a : 'transparent', border: 'none',
                     borderRadius: 9, cursor: 'pointer', color: tab === t.id ? '#fff' : C.ts, fontSize: 11,
                     fontWeight: tab === t.id ? 700 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: 'inherit' }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>👥 მომხმარებლები ({profiles.length})</div>
          {profiles.map(p => (
            <div key={p.id} style={{ ...gls({ padding: '14px 16px', marginBottom: 10 }), background: C.card2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.a},${C.p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{p.username.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{ color: C.t, fontWeight: 700, fontSize: 14 }}>{p.username}</div>
                    {p.is_admin && <span style={{ background: `${C.gold}22`, borderRadius: 4, padding: '1px 6px', fontSize: 10, color: C.gold }}>ადმინი</span>}
                  </div>
                </div>
                <div style={{ color: C.ts, fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString('ka-GE')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[
                  { label: 'სესია',   val: p.sessions      },
                  { label: 'სტრიქი', val: `${p.streak}🔥` },
                  { label: 'ენა',     val: p.current_lang?.slice(0,3) || '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: C.card3, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ color: C.a, fontWeight: 800, fontSize: 14 }}>{s.val}</div>
                    <div style={{ color: C.ts, fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'stats' && (
        <div>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏆 ლიდერბორდი</div>
          {leaders.map((u, i) => (
            <div key={u.id} style={{ ...gls({ padding: '12px 16px', marginBottom: 8 }), display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? C.gold : i === 1 ? '#9ba3af' : '#cd7c3a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 13 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.t, fontWeight: 700, fontSize: 14 }}>{u.username}</div>
                <div style={{ color: C.ts, fontSize: 11 }}>🔥{u.streak} · 🎯{u.accuracy}%</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: C.g, fontWeight: 900, fontSize: 16 }}>{u.learned}</div>
                <div style={{ color: C.ts, fontSize: 10 }}>ნასწავლი</div>
              </div>
            </div>
          ))}
          {leaders.length === 0 && <div style={{ color: C.tm, textAlign: 'center', padding: 30 }}>მონაცემები არ არის</div>}
        </div>
      )}

      {/* Chat */}
      {tab === 'chat' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: C.t, fontWeight: 700, fontSize: 15 }}>💬 ბოლო შეტყობინებები</div>
            <button onClick={handleClearChat}
              style={{ background: `${C.r}22`, border: `1px solid ${C.r}44`, borderRadius: 8, padding: '5px 10px', color: C.r, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>გაწმენდა</button>
          </div>
          {chatMsgs.map(m => (
            <div key={m.id} style={{ background: C.card2, borderRadius: 10, padding: '10px 14px', marginBottom: 6, borderLeft: `3px solid ${m.is_bot ? C.a : C.bdL}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: m.is_bot ? C.a : C.t, fontWeight: 700, fontSize: 12 }}>{m.username}</span>
                <span style={{ color: C.tm, fontSize: 10 }}>{new Date(m.created_at).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ color: C.ts, fontSize: 13, lineHeight: 1.4 }}>{m.text}</div>
            </div>
          ))}
          {chatMsgs.length === 0 && <div style={{ color: C.tm, textAlign: 'center', padding: 30 }}>შეტყობინებები არ არის</div>}
        </div>
      )}
    </div>
  )
}
