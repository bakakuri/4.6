import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG, LEVELS, LEVEL_COLORS } from '../theme.js'
import WDB from '../data/words.js'
import * as DB from '../utils/db.js'
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

  // ── Progress Share ────────────────────────────────────────
  const shareProgress = (st) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080; canvas.height = 1080
    const ctx = canvas.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080)
    grad.addColorStop(0, '#030509'); grad.addColorStop(1, '#0d1228')
    ctx.fillStyle = grad; ctx.fillRect(0,0,1080,1080)
    // Accent blob
    ctx.fillStyle = 'rgba(99,102,241,0.12)'
    ctx.beginPath(); ctx.arc(900, 180, 320, 0, Math.PI*2); ctx.fill()
    // Branding
    ctx.font = 'bold 56px Arial'; ctx.fillStyle = '#fff'
    ctx.fillText('LINGUA', 80, 130)
    ctx.fillStyle = '#818cf8'; ctx.fillText('MASTER', 80, 195)
    ctx.font = '30px Arial'; ctx.fillStyle = 'rgba(255,255,255,.5)'
    ctx.fillText('@' + user.username, 80, 255)
    // XP
    ctx.font = 'bold 160px Arial'; ctx.fillStyle = '#f59e0b'
    ctx.fillText(String(st?.xp||0), 80, 460)
    ctx.font = '36px Arial'; ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.fillText('XP', 80, 505)
    // Streak
    ctx.font = 'bold 90px Arial'; ctx.fillStyle = '#fff'
    ctx.fillText((st?.streak||0) + ' day streak', 80, 650)
    // Words
    ctx.font = 'bold 80px Arial'; ctx.fillStyle = '#34d399'
    ctx.fillText((st?.learned||0) + ' words', 80, 775)
    ctx.font = '30px Arial'; ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.fillText('learned', 80, 818)
    // Footer
    ctx.font = '26px Arial'; ctx.fillStyle = 'rgba(255,255,255,.2)'
    ctx.fillText('linguamaster.app', 80, 1000)
    // Share
    canvas.toBlob(blob => {
      const file = new File([blob], 'linguamaster-progress.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'LinguaMaster Progress' }).catch(()=>{})
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = 'linguamaster-progress.png'; a.click()
        URL.revokeObjectURL(url)
      }
    })
  }
  const [activity, setActivity] = useState([])
  const [pqCount,   setPqCount]   = useState(0)

  useEffect(() => {
    Promise.all([
      DB.getStats(user.id, lang),
      DB.getProgress(user.id, lang),
      supabase.from('profiles').select('photo_url,created_at').eq('id', user.id).single(),
      DB.getHeatmap(user.id, lang)
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
      DB.updateProfile(user.id, { photo_url: url })
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
            <div key={v} style={{ width:12, height:12, borderRadius:3, background:`rgba(99,102,241,${v})` }} />
          ))}
          <span style={{ color:C.ts, fontSize:10 }}>მეტი</span>
        </div>
      </div>
    </div>
  )
}

function HeatmapGrid({ heat, C }) {
  const cells = []
  const base = new Date()
  base.setDate(base.getDate() - 363)
  for (let i = 0; i < 364; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    cells.push({ key, value: heat[key] || 0 })
  }

  const max = Math.max(1, ...cells.map(c => c.value))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)', gap: 2 }}>
      {cells.map(c => {
        const alpha = c.value ? Math.max(0.12, (c.value / max) * 0.95) : 0.06
        return <div key={c.key} title={`${c.key}: ${c.value}`} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 3, background: `rgba(99,102,241,${alpha})`, border: `1px solid ${C.bdL}` }} />
      })}
    </div>
  )
}