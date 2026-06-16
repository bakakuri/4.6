import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG, LEVELS, LEVEL_COLORS } from '../theme.js'
import WDB from '../data/words.js'
import { getProgress, getStats, updateProfile, getHeatmap } from '../utils/db.js'
import { supabase } from '../lib/supabase.js'
import { calcLevel, ACHIEVEMENTS } from '../utils/gamification.js'

export default function ProfileScreen({ user, lang, onNav }) {
  const { C, gls } = useTheme()
  const [st,      setSt]      = useState(null)
  const [prog,    setProg]    = useState({})
  const [photo,   setPhoto]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [achTab,  setAchTab]  = useState(false) // toggle achievements view
  const [heat,    setHeat]    = useState({})

  useEffect(() => {
    Promise.all([
      getStats(user.id, lang),
      getProgress(user.id, lang),
      supabase.from('profiles').select('photo_url,created_at').eq('id', user.id).single(),
      getHeatmap(user.id, lang)
    ]).then(([s, p, { data }, h]) => {
      setSt(s); setProg(p)
      setPhoto(data?.photo_url || null)
      setHeat(h)
      setLoading(false)
    })
  }, [user.id, lang])

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target.result
      setPhoto(url)
      updateProfile(user.id, { photo_url: url })
    }
    reader.readAsDataURL(file)
  }

  if (loading) return (
    <div style={{ padding:24, display:'flex', justifyContent:'center', paddingTop:60 }}>
      <div style={{ color:C.ts }}>იტვირთება...</div>
    </div>
  )

  const lvl    = calcLevel(st?.xp || 0)
  const earned = st?.achievements || []
  const levelStats = LEVELS.map(lvl => {
    const ws      = WDB[lang]?.[lvl] || []
    const learned = ws.filter(w => (prog[w.id]?.mastery||0) >= 100).length
    return { lvl, total:ws.length, learned, pct:ws.length?Math.round((learned/ws.length)*100):0 }
  })

  return (
    <div className="page-enter" style={{ padding:'14px 14px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* Avatar + info */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
        <label style={{ cursor:'pointer', position:'relative' }}>
          <div style={{ width:70, height:70, borderRadius:'50%', overflow:'hidden',
                        border:`3px solid ${C.a}`, background:C.card3,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
            {photo
              ? <img src={photo} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:24, fontWeight:900, color:C.a }}>{user.username.slice(0,2).toUpperCase()}</span>}
          </div>
          <div style={{ position:'absolute', bottom:0, right:0, background:C.a, borderRadius:'50%',
                        width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>📷</div>
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
        </label>
        <div style={{ flex:1 }}>
          <div style={{ color:C.t, fontWeight:800, fontSize:18 }}>{user.username}</div>
          <div style={{ color:C.ts, fontSize:12, marginTop:2 }}>{LANG[lang].flag} {LANG[lang].ka}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
            <span style={{ fontSize:16 }}>{lvl.lvl.icon}</span>
            <span style={{ color:C.gold, fontWeight:700, fontSize:13 }}>{lvl.lvl.name}</span>
            <span style={{ color:C.ts, fontSize:11 }}>Level {lvl.lvl.level}</span>
          </div>
        </div>
        {user.isAdmin && (
          <span style={{ background:`${C.gold}22`, border:`1px solid ${C.gold}44`, borderRadius:6,
                         padding:'3px 8px', fontSize:11, color:C.gold, fontWeight:700 }}>⚙️ ადმინი</span>
        )}
      </div>

      {/* XP Bar */}
      <div style={{ ...gls({ padding:'12px 14px', marginBottom:12 }),
                    background:`linear-gradient(135deg,${C.goldG},rgba(240,168,48,0.05))` }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ color:C.t, fontWeight:700, fontSize:13 }}>⚡ {st?.xp || 0} XP</span>
          {lvl.next && <span style={{ color:C.ts, fontSize:11 }}>→ Level {lvl.next.level}: {lvl.next.min} XP</span>}
        </div>
        <div style={{ background:C.card3, borderRadius:6, height:8, overflow:'hidden' }}>
          <div style={{ width:`${lvl.pct}%`, height:'100%', borderRadius:6, transition:'width .5s',
                        background:`linear-gradient(90deg,${C.gold},${C.o})` }} />
        </div>
        <div style={{ color:C.ts, fontSize:10, marginTop:4, textAlign:'right' }}>
          {lvl.fromCur}/{lvl.toNext} XP შემდეგ Level-მდე
        </div>
      </div>

      {/* Stats — learned is clickable */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        <div onClick={()=>onNav('learnedWords')}
          className="pop-in tap"
          style={{ ...gls({ padding:'11px 6px' }), textAlign:'center', cursor:'pointer',
                   animationDelay:'60ms',
                   border:`1px solid ${C.g}44`, background:`${C.g}0a` }}>
          <div style={{ fontSize:16 }}>✅</div>
          <div style={{ color:C.g, fontWeight:900, fontSize:17, marginTop:1 }}>{st?.learned}</div>
          <div style={{ color:C.ts, fontSize:9 }}>ნასწავლი</div>
          <div style={{ color:C.g, fontSize:9 }}>→ ნახვა</div>
        </div>
        {[
          { icon:'🔥', val:st?.streak,                            label:'Streak', col:C.o    },
          { icon:'🎯', val:st?.accuracy===null?'—':`${st?.accuracy}%`, label:'სიზ.',  col:C.gold },
          { icon:'📅', val:st?.sessions,                          label:'სესია',  col:C.a    },
        ].map((s,si)=>(
          <div key={s.label} className="pop-in" style={{ ...gls({ padding:'11px 6px' }), textAlign:'center', animationDelay:`${(si+2)*70}ms` }}>
            <div className={s.label==='Streak'?'streak-pulse':''} style={{ fontSize:16, display:'inline-block' }}>{s.icon}</div>
            <div style={{ color:s.col, fontWeight:900, fontSize:17, marginTop:1 }}>{s.val}</div>
            <div style={{ color:C.ts, fontSize:9 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle: Progress / Achievements */}
      <div style={{ display:'flex', background:C.card3, borderRadius:10, padding:3, marginBottom:14 }}>
        {[{id:false,label:'📊 პროგრესი'},{id:true,label:'🏆 მიღწევები'}].map(t=>(
          <button key={String(t.id)} onClick={()=>setAchTab(t.id)}
            style={{ flex:1, padding:'8px 0', border:'none', borderRadius:8, cursor:'pointer',
                     fontWeight:700, fontSize:13, fontFamily:'inherit', transition:'all .2s',
                     background: achTab===t.id ? C.a : 'transparent',
                     color: achTab===t.id ? '#fff' : C.ts }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Progress tab */}
      {!achTab && (
        <div style={{ ...gls({ padding:14 }), marginBottom:12 }}>
          <div style={{ color:C.t, fontWeight:700, fontSize:14, marginBottom:12 }}>დონეების პროგრესი</div>
          {levelStats.map(({ lvl, total, learned, pct })=>(
            <div key={lvl} style={{ marginBottom:11 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ background:LEVEL_COLORS[lvl], borderRadius:4, padding:'2px 7px',
                               fontSize:10, color:'#fff', fontWeight:800 }}>{lvl}</span>
                <span style={{ color:C.ts, fontSize:11 }}>{learned}/{total}</span>
              </div>
              <div style={{ background:C.card3, borderRadius:4, height:6, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:LEVEL_COLORS[lvl],
                              borderRadius:4, transition:'width .5s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap */}
      <div style={{ ...gls({ padding:14 }), marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ color:C.t, fontWeight:700, fontSize:13 }}>📅 სასწავლო კალენდარი</div>
          <div style={{ color:C.ts, fontSize:10 }}>ბოლო 1 წელი</div>
        </div>
        <HeatmapGrid heat={heat} C={C} />
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8 }}>
          <span style={{ color:C.ts, fontSize:10 }}>ნაკლები</span>
          {[0.08, 0.33, 0.66, 1].map(v => (
            <div key={v} style={{ width:10, height:10, borderRadius:2,
              background:`${C.a}${Math.round(v*255).toString(16).padStart(2,'0')}` }} />
          ))}
          <span style={{ color:C.ts, fontSize:10 }}>მეტი</span>
        </div>
      </div>

      {/* Duel button */}
      <button onClick={() => onNav('duel')}
        style={{ width:'100%', background:`linear-gradient(135deg,${C.a}22,${C.p}22)`,
          border:`1px solid ${C.a}44`, borderRadius:14, padding:'14px 16px',
          display:'flex', alignItems:'center', gap:12, cursor:'pointer',
          fontFamily:'inherit', marginBottom:12, textAlign:'left' }}>
        <span style={{ fontSize:28 }}>⚔️</span>
        <div>
          <div style={{ color:C.t, fontWeight:700, fontSize:14 }}>დუელი</div>
          <div style={{ color:C.ts, fontSize:11 }}>სხვა მომხმარებელს გამოიწვიე</div>
        </div>
        <div style={{ marginLeft:'auto', color:C.a, fontSize:18 }}>›</div>
      </button>

      {/* Achievements tab */}
      {achTab && (
        <div style={{ ...gls({ padding:14 }), marginBottom:12 }}>
          <div style={{ color:C.t, fontWeight:700, fontSize:14, marginBottom:12 }}>
            🏆 მიღწევები — {earned.length}/{ACHIEVEMENTS.length}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {ACHIEVEMENTS.map(a=>{
              const isEarned = earned.includes(a.id)
              return (
                <div key={a.id} style={{ padding:'10px 8px', borderRadius:12, textAlign:'center',
                                          background: isEarned ? `${C.gold}15` : C.card3,
                                          border: `1px solid ${isEarned ? C.gold+'55' : C.bdL}`,
                                          opacity: isEarned ? 1 : 0.45, transition:'all .2s' }}>
                  <div style={{ fontSize:22 }}>{a.icon}</div>
                  <div style={{ color: isEarned ? C.gold : C.ts, fontWeight:700, fontSize:10,
                                marginTop:4, lineHeight:1.3 }}>{a.name}</div>
                  <div style={{ color:C.tm, fontSize:9, marginTop:2 }}>{a.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Chat stats */}
      <div style={{ ...gls({ padding:14 }), marginBottom:12 }}>
        <div style={{ color:C.t, fontWeight:700, fontSize:13, marginBottom:10 }}>💬 ჩათის სტატ.</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={{ background:C.card3, borderRadius:10, padding:'10px 12px' }}>
            <div style={{ color:C.g, fontSize:20, fontWeight:900 }}>{st?.chatCorrect}</div>
            <div style={{ color:C.ts, fontSize:11 }}>სწორი</div>
          </div>
          <div style={{ background:C.card3, borderRadius:10, padding:'10px 12px' }}>
            <div style={{ color:C.a, fontSize:20, fontWeight:900 }}>{st?.totalAns}</div>
            <div style={{ color:C.ts, fontSize:11 }}>სულ</div>
          </div>
        </div>
      </div>

      <button onClick={()=>onNav('settings')}
        style={{ width:'100%', padding:'13px 16px', background:C.card2, border:`1px solid ${C.bdL}`,
                 borderRadius:14, color:C.t, fontSize:15, fontWeight:700, cursor:'pointer',
                 display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'inherit' }}>
        <span>⚙️ პარამეტრები</span><span style={{ color:C.ts }}>›</span>
      </button>
    </div>
  )
}

// ── Heatmap Grid Component ───────────────────────────────────
function HeatmapGrid({ heat, C }) {
  const days = []
  const today = new Date()
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ key, count: heat[key] || 0, dow: d.getDay() })
  }
  // Pad start so first column aligns to Sunday
  const firstDow = days[0].dow
  const padded = Array(firstDow).fill(null).concat(days)
  // Split into columns of 7
  const cols = []
  for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7))

  const color = (n) => {
    if (!n) return C.card3
    const op = n < 3 ? '28' : n < 7 ? '66' : n < 15 ? 'aa' : 'ff'
    return `${C.a}${op}`
  }

  return (
    <div style={{ overflowX:'auto', paddingBottom:2 }}>
      <div style={{ display:'flex', gap:2, width:'max-content' }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {col.map((day, di) => (
              <div key={di}
                title={day ? `${day.key}: ${day.count}` : ''}
                style={{ width:9, height:9, borderRadius:2, flexShrink:0,
                  background: day ? color(day.count) : 'transparent' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
