import { useTheme } from '../lib/ThemeContext.jsx'
import { useState, useEffect, useRef } from 'react'
import { LANG, LEVEL_COLORS } from '../theme.js'
import { allWords, getWordLevel } from '../data/words.js'
import { getProgress, saveProgress, nextCardFromProgress, bumpSession, bumpActivity, addXP, getWeakWordIds, getPracticeQueue, addToPracticeQueue, removeFromPracticeQueue } from '../utils/db.js'
import { speakWord } from '../utils/helpers.js'
import { preload } from '../utils/tts.js'
import { XP_REWARD } from '../utils/gamification.js'

export default function FlashcardScreen({ user, lang }) {
  const { C, gls } = useTheme()
  const [progress, setProgress] = useState(null) // loaded once, updated optimistically
  const [card,     setCard]     = useState(null)
  const [flipped,  setFlipped]  = useState(false)
  const [count,    setCount]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [xpFloat,  setXpFloat]  = useState(null) // { x, y, pts }
  const xpTimer = useRef(null)
  const [weakMode,    setWeakMode]    = useState(false)
  const [weakIds,     setWeakIds]     = useState([])
  const [practiceIds, setPracticeIds] = useState(new Set())
  const [pqBusy,      setPqBusy]      = useState(false)
  const lc = LANG[lang]

  // Load weak word IDs when weakMode on
  useEffect(() => {
    if (weakMode) getWeakWordIds(user.id, lang).then(setWeakIds)
    else setWeakIds([])
  }, [weakMode, user.id, lang])

  // Load all progress once at mount
  useEffect(() => {
    setLoading(true)
    getProgress(user.id, lang).then(prog => {
      setProgress(prog)
      const wids = weakMode && weakIds.length ? weakIds : null
      setCard(nextCardFromProgress(prog, lang, wids))
      setLoading(false)
    })
  }, [user.id, lang])

  const answer = (mastery) => {
    if (!card || !progress) return
    // XP based on rating: easy=full, ok=half, hard=quarter, again=none
    const xpMap = { 100: XP_REWARD.flashcard, 75: Math.round(XP_REWARD.flashcard*0.5),
                    50: Math.round(XP_REWARD.flashcard*0.25), 25: 0 }
    const xpEarned = xpMap[mastery] ?? 0
    if (xpEarned > 0) {
      addXP(user.id, xpEarned)
      clearTimeout(xpTimer.current)
      setXpFloat({ x: window.innerWidth/2, y: window.innerHeight/2, pts: xpEarned })
      xpTimer.current = setTimeout(() => setXpFloat(null), 1100)
    }
    // Optimistic update – instant next card, save to DB in background
    const newProg = { ...progress, [card.id]: { mastery, ts: Date.now() } }
    setProgress(newProg)
    setCard(nextCardFromProgress(newProg, lang))
    setFlipped(false)
    setCount(n => n + 1)
    saveProgress(user.id, lang, card.id, mastery)
    bumpSession(user.id)
    bumpActivity(user.id)
  }

  const learned = progress ? allWords(lang).filter(w => (progress[w.id]?.mastery || 0) >= 100) : []

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ color: C.ts }}>პროგრესი იტვირთება...</div>
    </div>
  )

  // All done
  if (!card) return (
    <div style={{ padding: 20, fontFamily: "'Inter',system-ui,sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{ fontSize: 52 }}>🎉</div>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 20, marginTop: 10 }}>ყველა სიტყვა ნასწავლია!</div>
        <div style={{ color: C.ts, fontSize: 14, marginTop: 6 }}>ბრავო! ახლა გააგრძელე ახალ დონეზე.</div>
      </div>
      <div style={{ ...gls({ padding: 20, width: '100%', maxWidth: 380 }), textAlign: 'center' }}>
        <div style={{ color: C.gold, fontSize: 32, fontWeight: 900 }}>{learned.length}</div>
        <div style={{ color: C.ts, fontSize: 13 }}>ნასწავლი სიტყვა</div>
      </div>
      {learned.length > 0 && (
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>✅ ნასწავლი სიტყვები</div>
          {learned.map(w => (
            <div key={w.id} style={{ ...gls({ padding: '12px 14px', marginBottom: 8 }), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: C.t, fontWeight: 700 }}>{w.w}</div>
                <div style={{ color: C.ts, fontSize: 12 }}>{w.ph}</div>
              </div>
              <div style={{ color: C.ts, fontSize: 13 }}>{w.t}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const togglePractice = async (e, wordId) => {
    e.stopPropagation()
    setPqBusy(true)
    if (practiceIds.has(wordId)) {
      await removeFromPracticeQueue(user.id, lang, wordId)
      setPracticeIds(prev => { const n = new Set(prev); n.delete(wordId); return n })
    } else {
      await addToPracticeQueue(user.id, lang, wordId)
      setPracticeIds(prev => new Set([...prev, wordId]))
    }
    setPqBusy(false)
  }

  const cardLevel = getWordLevel(lang, card.id)
  const mastery   = progress?.[card.id]?.mastery || 0
  const mColor    = mastery >= 75 ? C.g : mastery >= 50 ? C.gold : mastery >= 25 ? C.o : C.ts

  // Auto-play word when card changes
  useEffect(() => {
    if (card?.w && lc?.code) {
      const t = setTimeout(() => speakWord(card.w, lc.code), 200)
      // Preload example sentence audio too
      if (card.ex) preload(card.ex, lc.code)
      return () => clearTimeout(t)
    }
  }, [card?.id]) // eslint-disable-line

  return (
    <div className="page-enter" style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Floating XP */}
      {xpFloat && (
        <div className="xp-float" style={{ left:xpFloat.x, top:xpFloat.y, color:'#f0a830' }}>
          +{xpFloat.pts} XP ⚡
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ color: C.ts, fontSize: 13 }}>სესია: {count}</span>
          <button onClick={()=>setWeakMode(m=>!m)}
            style={{ background: weakMode ? C.r+'22' : C.card3,
              border: '1px solid '+(weakMode ? C.r+'66' : C.bdL),
              borderRadius:8, padding:'3px 8px', color: weakMode ? C.r : C.ts,
              fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {weakMode ? '😓 სუსტი სიტყვები' : '😓 სუსტი'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: C.g, fontSize: 13 }}>✅ {learned.length}/{allWords(lang).length}</span>
          <span style={{ background: C.card3, borderRadius: 6, padding: '3px 8px', fontSize: 12, color: mColor, fontWeight: 700 }}>{mastery}%</span>
        </div>
      </div>

      {/* 3D flip card */}
      <div key={card.id} className="slide-right"
           onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer', perspective: 1000, marginBottom: 16 }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .55s cubic-bezier(.4,0,.2,1)',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', height: 310 }}>

          {/* FRONT */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                        ...gls({ padding: 24 }), display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        background: `linear-gradient(160deg,${C.card2},${C.card3})` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {cardLevel && <span style={{ background: LEVEL_COLORS[cardLevel] || C.a, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 800 }}>{cardLevel}</span>}
              <span style={{ color: C.ts, fontSize: 12 }}>{card.cat}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: C.t, letterSpacing: -1, marginBottom: 8 }}>{card.w}</div>
              <div style={{ color: C.a, fontSize: 15, marginBottom: 16 }}>{card.ph}</div>
              <div style={{ borderTop: `1px solid ${C.bdL}`, paddingTop: 14 }}>
                <div style={{ color: C.ts, fontSize: 14, fontStyle: 'italic', marginBottom: 6 }}>"{card.ex}"</div>
                <div style={{ color: C.tm, fontSize: 12 }}>{card.exph}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.tm, fontSize: 12 }}>👆 დააჭირე გადასაბრუნებლად</span>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={e => { e.stopPropagation(); speakWord(card.w, lc.code, true) }}
                  className="tap"
                  style={{ background: C.card3, border:`1px solid ${C.bdL}`, borderRadius:10,
                    padding:'7px 10px', color:C.ts, fontSize:11, cursor:'pointer',
                    fontFamily:'inherit', fontWeight:600 }}>🐢 ნელა</button>
                <button onClick={e => { e.stopPropagation(); speakWord(card.w, lc.code) }}
                  className="tap"
                  style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none',
                    borderRadius:10, padding:'8px 14px', color:'#fff', fontSize:18,
                    cursor:'pointer', boxShadow:`0 2px 12px ${C.aG}`, fontFamily:'inherit' }}>🔊</button>
                <button onClick={e => togglePractice(e, card.id)}
                  disabled={pqBusy}
                  title={practiceIds.has(card.id) ? 'სამეცადინოდან ამოღება' : 'სამეცადინოში დამატება'}
                  className="tap"
                  style={{ background: practiceIds.has(card.id) ? `${C.o}33` : C.card3,
                    border:`1px solid ${practiceIds.has(card.id) ? C.o+'88' : C.bdL}`,
                    borderRadius:10, padding:'8px 11px', color: practiceIds.has(card.id) ? C.o : C.ts,
                    fontSize:18, cursor:'pointer', opacity: pqBusy ? 0.5 : 1 }}>
                  {practiceIds.has(card.id) ? '📌' : '📚'}
                </button>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)', ...gls({ padding: 24 }), display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', background: `linear-gradient(160deg,${C.card3},${C.card4})` }}>
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>{lc.flag} თარგმანი</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: C.gold, marginBottom: 16 }}>{card.t}</div>
              <div style={{ borderTop: `1px solid ${C.bdL}`, paddingTop: 14 }}>
                <div style={{ color: C.ts, fontSize: 13, marginBottom: 6 }}>"{card.ex}"</div>
                <div style={{ color: C.t, fontSize: 14, fontWeight: 600 }}>"{card.ext}"</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={e => { e.stopPropagation(); speakWord(card.ex, lc.code) }}
                style={{ background: `linear-gradient(135deg,${C.g},#0fa37a)`, border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔊 წინადადება</button>
            </div>
          </div>
        </div>
      </div>

      {/* SRS buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'ისევ',    emoji: '🔄', mastery: 25,  bg: C.r    },
          { label: 'რთული',  emoji: '😓', mastery: 50,  bg: C.o    },
          { label: 'ისო რა', emoji: '😐', mastery: 75,  bg: C.gold },
          { label: 'ადვილი', emoji: '😊', mastery: 100, bg: C.g    },
        ].map(btn => (
          <button key={btn.label} onClick={() => answer(btn.mastery)}
            className="tap"
            style={{ padding: '12px 4px', background: `${btn.bg}22`, border: `1px solid ${btn.bg}66`,
                     borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <span style={{ fontSize: 18 }}>{btn.emoji}</span>
            <span style={{ color: C.t, fontSize: 11, fontWeight: 700 }}>{btn.label}</span>
            <span style={{ color: C.ts, fontSize: 10 }}>{btn.mastery}%</span>
          </button>
        ))}
      </div>

      {/* Learned chips */}
      {learned.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>✅ ნასწავლი ({learned.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {learned.map(w => (
              <div key={w.id} style={{ background: `${C.g}22`, border: `1px solid ${C.g}44`, borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: C.t, fontSize: 12, fontWeight: 700 }}>{w.w}</span>
                <span style={{ color: C.ts, fontSize: 11 }}>· {w.t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
