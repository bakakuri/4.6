import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { getStats, getDailyLearned, getLeaderboard, updateAchievements } from '../utils/db.js'
import { calcLevel, ACHIEVEMENTS } from '../utils/gamification.js'
import { speakWord } from '../utils/helpers.js'

const getWordOfDay = (lang) => {
  const ws = allWords(lang); if (!ws.length) return null
  const dayIdx = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0).getTime()) / 86400000)
  return ws[dayIdx % ws.length]
}

export default function HomeScreen({ user, lang, onNav }) {
  const { C, gls } = useTheme()
  const [st,      setSt]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [wodFlip, setWodFlip] = useState(false)
  const [dailyN,  setDailyN]  = useState(0)
  const [leaders, setLeaders] = useState([])
  const [newAchs, setNewAchs] = useState([])   // newly earned achievements to show

  useEffect(() => {
    Promise.all([
      getStats(user.id, lang),
      getDailyLearned(user.id, lang),
      getLeaderboard(),
    ]).then(async ([s, daily, lb]) => {
      setSt(s); setDailyN(daily); setLeaders(lb)
      setLoading(false)
      // Check achievements
      const a1words = allWords(lang).filter(w => w.id?.startsWith(lang.slice(0,2)) || true)
      const a1done  = false // simplified
      const earned = await updateAchievements(user.id, {
        learned: s.learned, streak: s.streak, totalAns: s.totalAns,
        xp: s.xp, a1done, dailyDone: daily >= s.daily_goal
      })
      if (earned.length) setNewAchs(earned)
    })
  }, [user.id, lang])

  const lc    = LANG[lang]
  const pct   = st ? (st.total ? Math.round((st.learned / st.total) * 100) : 0) : 0
  const days  = ['კვ','ორ','სამ','ოთ','ხუთ','პარ','შაბ']
  const today = new Date().getDay()
  const wod   = getWordOfDay(lang)
  const lvl   = calcLevel(st?.xp || 0)
  const dailyGoal = st?.daily_goal || 10
  const dailyPct  = Math.min(100, Math.round((dailyN / dailyGoal) * 100))
  const dailyDone = dailyN >= dailyGoal

  const myRank = leaders.findIndex(l => l.username === user.username) + 1

  if (loading) return (
    <div style={{ padding:24, display:'flex', justifyContent:'center', paddingTop:60 }}>
      <div style={{ color:C.ts }}>იტვირთება...</div>
    </div>
  )

  return (
    <div className="page-enter" style={{ padding:'12px 14px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* Achievement toast */}
      {newAchs.length > 0 && (
        <div onClick={() => setNewAchs([])}
          style={{ background:`linear-gradient(135deg,${C.gold},${C.o})`, borderRadius:14,
                   padding:'12px 16px', marginBottom:14, cursor:'pointer',
                   display:'flex', alignItems:'center', gap:10,
                   boxShadow:`0 4px 20px ${C.goldG}` }}>
          <span style={{ fontSize:24 }}>{newAchs[0].icon}</span>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>🏆 მიღწევა განბლოკილია!</div>
            <div style={{ color:'rgba(255,255,255,0.85)', fontSize:12 }}>
              {newAchs.map(a=>a.name).join(', ')}
            </div>
          </div>
          <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.7)', fontSize:12 }}>✕</span>
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom:14 }}>
        <div style={{ color:C.ts, fontSize:13 }}>გამარჯობა, {user.username}! 👋</div>
        <div style={{ color:C.t, fontSize:22, fontWeight:900, marginTop:2 }}>სწავლის დრო!</div>
      </div>

      {/* XP / Level bar */}
      <div style={{ ...gls({ padding:'12px 16px', marginBottom:12 }),
                    background:`linear-gradient(135deg,${C.card2},${C.card3})` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:22 }}>{lvl.lvl.icon}</span>
            <div>
              <div style={{ color:C.t, fontWeight:800, fontSize:14 }}>{lvl.lvl.name}</div>
              <div style={{ color:C.ts, fontSize:11 }}>Level {lvl.lvl.level}</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:C.gold, fontWeight:900, fontSize:16 }}>{st?.xp || 0} XP</div>
            {lvl.next && <div style={{ color:C.ts, fontSize:10 }}>→ {lvl.next.min} XP: {lvl.next.name}</div>}
          </div>
        </div>
        {/* XP progress bar */}
        <div style={{ background:C.card3, borderRadius:6, height:6, overflow:'hidden' }}>
          <div style={{ width:`${lvl.pct}%`, height:'100%', borderRadius:6, transition:'width .5s',
                        background:`linear-gradient(90deg,${C.gold},${C.o})` }} />
        </div>
        <div style={{ color:C.ts, fontSize:10, textAlign:'right', marginTop:3 }}>
          {lvl.fromCur}/{lvl.toNext} XP
        </div>
      </div>

      {/* Progress card */}
      <div style={{ ...gls({ padding:16, marginBottom:12 }),
                    background:`linear-gradient(135deg,rgba(93,107,255,.12),rgba(168,85,247,.07))` }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ color:C.ts, fontSize:11 }}>{lc.flag} {lc.name} · პროგრესი</div>
            <div style={{ color:C.t, fontSize:20, fontWeight:900 }}>{pct}%</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:C.gold, fontSize:24, fontWeight:900 }}>{st?.learned}</div>
            <div style={{ color:C.ts, fontSize:11 }}>/ {st?.total}</div>
          </div>
        </div>
        <div style={{ background:C.card3, borderRadius:6, height:7, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${C.a},${C.p})`, borderRadius:6, transition:'width .6s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:C.ts }}>
          <span><span className="streak-pulse" style={{ display:'inline-block' }}>🔥</span> {st?.streak} დღე streak</span>
          <span>⚡ {st?.inProg} სწავლის პროცესში</span>
        </div>
      </div>

      {/* Daily Goal */}
      <div style={{ ...gls({ padding:'12px 16px', marginBottom:12 }),
                    background: dailyDone ? `${C.g}12` : C.card2,
                    border: `1px solid ${dailyDone ? C.g + '55' : C.bdL}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.t }}>
            {dailyDone ? '✅ დღიური მიზანი შესრულდა!' : '🎯 დღიური მიზანი'}
          </div>
          <div style={{ color: dailyDone ? C.g : C.ts, fontWeight:700, fontSize:13 }}>
            {dailyN}/{dailyGoal}
          </div>
        </div>
        <div style={{ background:C.card3, borderRadius:6, height:8, overflow:'hidden' }}>
          <div style={{ width:`${dailyPct}%`, height:'100%', borderRadius:6, transition:'width .5s',
                        background: dailyDone
                          ? `linear-gradient(90deg,${C.g},#0fa37a)`
                          : `linear-gradient(90deg,${C.a},${C.p})` }} />
        </div>
        {!dailyDone && (
          <div style={{ color:C.ts, fontSize:11, marginTop:4 }}>
            კიდევ {dailyGoal - dailyN} სიტყვა დარჩა
          </div>
        )}
      </div>

      {/* Word of the Day */}
      {wod && (
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <div style={{ color:C.t, fontWeight:700, fontSize:13 }}>📅 დღის სიტყვა</div>
            <div style={{ color:C.ts, fontSize:11 }}>ყოველდღე განახლდება</div>
          </div>
          <div onClick={() => setWodFlip(f=>!f)} style={{ cursor:'pointer', perspective:1000 }}>
            <div style={{ position:'relative', transformStyle:'preserve-3d',
                          transition:'transform .5s', height:110,
                          transform: wodFlip ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                            ...gls({ padding:'14px 16px' }), display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ color:C.ts, fontSize:11, marginBottom:3 }}>{lc.flag} {wod.cat}</div>
                  <div style={{ color:C.t, fontWeight:900, fontSize:22 }}>{wod.w}</div>
                  <div style={{ color:C.a, fontSize:12, marginTop:2 }}>{wod.ph}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <button onClick={e=>{e.stopPropagation();speakWord(wod.w,lc.code)}}
                    style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none', borderRadius:10,
                             width:40, height:40, color:'#fff', fontSize:18, cursor:'pointer' }}>🔊</button>
                  <div style={{ color:C.tm, fontSize:9 }}>👆 შეაბრუნე</div>
                </div>
              </div>
              <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                            transform:'rotateY(180deg)', ...gls({ padding:'14px 16px' }),
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            background:`linear-gradient(135deg,${C.card3},${C.card4})` }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.gold, fontWeight:900, fontSize:20, marginBottom:4 }}>{wod.t}</div>
                  <div style={{ color:C.ts, fontSize:12, fontStyle:'italic' }}>"{wod.ext}"</div>
                </div>
                <button onClick={e=>{e.stopPropagation();speakWord(wod.ex,lc.code)}}
                  style={{ background:`linear-gradient(135deg,${C.g},#0fa37a)`, border:'none', borderRadius:10,
                           width:40, height:40, color:'#fff', fontSize:18, cursor:'pointer', marginLeft:10 }}>🔊</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {[
          { icon:'🃏', label:'ფლეშქარდები', sub:'სიტყვების სწავლა',  page:'flashcards', col:C.a  },
          { icon:'🎮', label:'ვარჯიში',     sub:'სხვადასხვა ვარ.',   page:'exercises',  col:C.p  },
          { icon:'📖', label:'გრამატიკა',   sub:'წესები და ახსნები', page:'grammar',    col:C.g  },
          { icon:'💬', label:'ჩათი',         sub:'ვარჯიში სხვებთან', page:'chat',       col:C.o  },
        ].map((a, i)=>(
          <button key={a.page} onClick={()=>onNav(a.page)}
            className="card-rise tap"
            style={{ padding:'14px 12px', background:C.card2, border:`1px solid ${C.bdL}`,
                     borderRadius:14, cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                     display:'flex', flexDirection:'column', gap:4,
                     animationDelay:`${i*60}ms` }}>
            <div style={{ fontSize:24 }}>{a.icon}</div>
            <div style={{ color:C.t, fontWeight:700, fontSize:13 }}>{a.label}</div>
            <div style={{ color:C.ts, fontSize:10 }}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {leaders.length > 0 && (
        <div style={{ ...gls({ padding:14, marginBottom:12 }) }}>
          <div style={{ color:C.t, fontWeight:700, fontSize:13, marginBottom:10 }}>🏆 ლიდერბორდი</div>
          {leaders.map((l, i) => {
            const isMe = l.username === user.username
            const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']
            return (
              <div key={l.username} className="card-rise"
                   style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px',
                            borderRadius:10, marginBottom:4, animationDelay:`${i*50}ms`,
                            background: isMe ? `${C.a}18` : 'transparent',
                            border: isMe ? `1px solid ${C.a}44` : '1px solid transparent' }}>
                <span style={{ fontSize:16, width:22 }}>{medals[i]}</span>
                <span style={{ color: isMe ? C.a : C.t, fontWeight: isMe ? 800 : 400, flex:1, fontSize:13 }}>
                  {l.username}{isMe ? ' (შენ)' : ''}
                </span>
                <span style={{ color:C.gold, fontWeight:700, fontSize:12 }}>{l.xp} XP</span>
                <span style={{ color:C.o, fontSize:11 }}>🔥{l.streak}</span>
              </div>
            )
          })}
          {myRank === 0 && (
            <div style={{ color:C.ts, fontSize:11, textAlign:'center', marginTop:4 }}>
              შენ ჯერ ლიდერბორდში არ ხარ — XP დააგროვე!
            </div>
          )}
        </div>
      )}

      {/* Weekly activity */}
      <div style={{ ...gls({ padding:14 }), marginBottom:12 }}>
        <div style={{ color:C.t, fontWeight:700, fontSize:13, marginBottom:10 }}>კვირის აქტივობა</div>
        <div style={{ display:'flex', gap:4, justifyContent:'space-between', alignItems:'flex-end' }}>
          {days.map((d,i)=>{
            const v = Math.min(100, st?.activity?.[i]||0)
            const isT = i===today
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', height:40, background:C.card3, borderRadius:5,
                              display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                  <div style={{ width:'100%', height:`${v}%`, minHeight:v>0?3:0, borderRadius:5, transition:'height .4s',
                                background:isT?`linear-gradient(180deg,${C.a},${C.p})`:C.a,
                                opacity:isT?1:.5 }} />
                </div>
                <span style={{ fontSize:9, color:isT?C.a:C.tm, fontWeight:isT?700:400 }}>{d}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {[
          { label:'ნასწავლი', val:st?.learned, icon:'✅', col:C.g    },
          { label:'სესია',    val:st?.sessions, icon:'📅', col:C.a    },
          { label:'სიზუსტე',  val:st?.accuracy===null?'—':`${st?.accuracy}%`, icon:'🎯', col:C.gold },
        ].map(s=>(
          <div key={s.label} style={{ ...gls({ padding:'11px 8px' }), textAlign:'center' }}>
            <div style={{ fontSize:18 }}>{s.icon}</div>
            <div style={{ color:s.col, fontWeight:900, fontSize:17, marginTop:2 }}>{s.val}</div>
            <div style={{ color:C.ts, fontSize:10, marginTop:1 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
