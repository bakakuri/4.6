import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { getStats } from '../utils/db.js'
import { speakWord } from '../utils/helpers.js'

// Deterministic word of the day — same word for everyone on the same calendar day
const getWordOfDay = (lang) => {
  const ws = allWords(lang)
  if (!ws.length) return null
  const start = new Date(new Date().getFullYear(), 0, 0).getTime()
  const dayIdx = Math.floor((Date.now() - start) / 86400000)
  return ws[dayIdx % ws.length]
}

export default function HomeScreen({ user, lang, onNav }) {
  const { C, gls } = useTheme()
  const [st,      setSt]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [wodFlip, setWodFlip] = useState(false) // word of day card flip

  useEffect(() => {
    getStats(user.id, lang).then(s => { setSt(s); setLoading(false) })
  }, [user.id, lang])

  const lc      = LANG[lang]
  const pct     = st ? (st.total ? Math.round((st.learned / st.total) * 100) : 0) : 0
  const days    = ['კვ','ორ','სამ','ოთ','ხუთ','პარ','შაბ']
  const today   = new Date().getDay()
  const wod     = getWordOfDay(lang)

  if (loading) return (
    <div style={{ padding:24, display:'flex', justifyContent:'center', paddingTop:60 }}>
      <div style={{ color:C.ts }}>იტვირთება...</div>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* Greeting */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:14, color:C.ts }}>გამარჯობა, {user.username}! 👋</div>
        <div style={{ fontSize:24, fontWeight:900, color:C.t, marginTop:2 }}>სწავლის დრო!</div>
      </div>

      {/* Progress card */}
      <div style={{ ...gls({ padding:20, marginBottom:14 }), background:`linear-gradient(135deg,rgba(93,107,255,.15),rgba(168,85,247,.08))` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ color:C.ts, fontSize:12 }}>{lc.flag} {lc.name} · პროგრესი</div>
            <div style={{ color:C.t, fontSize:22, fontWeight:900, marginTop:2 }}>{pct}%</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:C.gold, fontSize:26, fontWeight:900 }}>{st?.learned}</div>
            <div style={{ color:C.ts, fontSize:11 }}>ნასწავლი / {st?.total}</div>
          </div>
        </div>
        <div style={{ background:C.card3, borderRadius:6, height:8, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${C.a},${C.p})`, borderRadius:6, transition:'width .6s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:C.ts }}>
          <span>🔥 {st?.streak} დღე streak</span>
          <span>⚡ {st?.inProg} სწავლის პროცესში</span>
        </div>
      </div>

      {/* ── Word of the Day ─────────────────────────────────── */}
      {wod && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ color:C.t, fontWeight:700, fontSize:14 }}>📅 დღის სიტყვა</div>
            <div style={{ color:C.ts, fontSize:11 }}>ყოველდღე განახლდება</div>
          </div>
          <div onClick={() => setWodFlip(f => !f)} style={{ cursor:'pointer', perspective:1000 }}>
            <div style={{ position:'relative', transformStyle:'preserve-3d',
                          transition:'transform .5s', transform: wodFlip ? 'rotateY(180deg)' : 'rotateY(0deg)', height:120 }}>
              {/* Front */}
              <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                            ...gls({ padding:'16px 18px' }), display:'flex', alignItems:'center', justifyContent:'space-between',
                            background:`linear-gradient(135deg,${C.card2},${C.card3})` }}>
                <div>
                  <div style={{ color:C.ts, fontSize:11, marginBottom:4 }}>{lc.flag} {wod.cat}</div>
                  <div style={{ color:C.t, fontWeight:900, fontSize:24 }}>{wod.w}</div>
                  <div style={{ color:C.a, fontSize:13, marginTop:2 }}>{wod.ph}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <button onClick={e => { e.stopPropagation(); speakWord(wod.w, lc.code) }}
                    style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none', borderRadius:10,
                             width:44, height:44, color:'#fff', fontSize:20, cursor:'pointer',
                             boxShadow:`0 2px 12px ${C.aG}` }}>🔊</button>
                  <div style={{ color:C.tm, fontSize:10 }}>👆 შეაბრუნე</div>
                </div>
              </div>
              {/* Back */}
              <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                            transform:'rotateY(180deg)', ...gls({ padding:'16px 18px' }),
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            background:`linear-gradient(135deg,${C.card3},${C.card4})` }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.gold, fontWeight:900, fontSize:22, marginBottom:6 }}>{wod.t}</div>
                  <div style={{ color:C.ts, fontSize:13, fontStyle:'italic' }}>"{wod.ext}"</div>
                </div>
                <button onClick={e => { e.stopPropagation(); speakWord(wod.ex, lc.code) }}
                  style={{ background:`linear-gradient(135deg,${C.g},#0fa37a)`, border:'none', borderRadius:10,
                           width:44, height:44, color:'#fff', fontSize:18, cursor:'pointer', marginLeft:10 }}>🔊</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        {[
          { icon:'🃏', label:'ფლეშქარდები', sub:'სიტყვების სწავლა',     page:'flashcards' },
          { icon:'🎮', label:'ვარჯიში',      sub:'სხვადასხვა სავარჯიშო', page:'exercises'  },
          { icon:'📖', label:'გრამატიკა',    sub:'წესები და ახსნები',     page:'grammar'    },
          { icon:'💬', label:'ჩათი',          sub:'ვარჯიში სხვებთან',      page:'chat'       },
        ].map(a => (
          <button key={a.page} onClick={() => onNav(a.page)}
            style={{ padding:'16px 14px', background:C.card2, border:`1px solid ${C.bdL}`,
                     borderRadius:14, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
            <div style={{ fontSize:26, marginBottom:6 }}>{a.icon}</div>
            <div style={{ color:C.t, fontWeight:700, fontSize:13 }}>{a.label}</div>
            <div style={{ color:C.ts, fontSize:11, marginTop:2 }}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Weekly activity */}
      <div style={{ ...gls({ padding:16 }), marginBottom:14 }}>
        <div style={{ color:C.t, fontWeight:700, fontSize:14, marginBottom:12 }}>კვირის აქტივობა</div>
        <div style={{ display:'flex', gap:5, justifyContent:'space-between', alignItems:'flex-end' }}>
          {days.map((d, i) => {
            const v  = Math.min(100, st?.activity?.[i] || 0)
            const isT = i === today
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', height:44, background:C.card3, borderRadius:6,
                              display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                  <div style={{ width:'100%', height:`${v}%`, borderRadius:6, minHeight: v > 0 ? 4 : 0, transition:'height .4s',
                                background: isT ? `linear-gradient(180deg,${C.a},${C.p})` : C.a,
                                opacity: isT ? 1 : .5 }} />
                </div>
                <span style={{ fontSize:9, color: isT ? C.a : C.tm, fontWeight: isT ? 700 : 400 }}>{d}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {[
          { label:'ნასწავლი', val:st?.learned,        icon:'✅', col:C.g    },
          { label:'სესია',    val:st?.sessions,        icon:'📅', col:C.a    },
          { label:'სიზუსტე',  val: st?.accuracy === null ? '—' : `${st?.accuracy}%`, icon:'🎯', col:C.gold },
        ].map(s => (
          <div key={s.label} style={{ ...gls({ padding:'12px 10px' }), textAlign:'center' }}>
            <div style={{ fontSize:20 }}>{s.icon}</div>
            <div style={{ color:s.col, fontWeight:900, fontSize:19, marginTop:2 }}>{s.val}</div>
            <div style={{ color:C.ts, fontSize:10, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
