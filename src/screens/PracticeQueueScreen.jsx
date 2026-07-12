import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { getPracticeQueue, removeFromPracticeQueue } from '../utils/db.js'
import { speakWord } from '../utils/helpers.js'

export default function PracticeQueueScreen({ user, lang, onBack }) {
  const { C } = useTheme()
  const lc = LANG[lang]

  const [queue,   setQueue]   = useState([])   // word objects
  const [idx,     setIdx]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done,    setDone]    = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const ids = await getPracticeQueue(user.id, lang)
      if (!ids.length) { setLoading(false); return }
      const all = allWords(lang)
      const words = ids.map(id => all.find(w => w.id === id)).filter(Boolean)
      setQueue(words)
      setLoading(false)
    }
    load()
  }, [user.id, lang])

  const current = queue[idx] || null
  const total   = queue.length + done
  const pct     = total ? Math.round((done / total) * 100) : 0

  // Auto-play when card appears
  useEffect(() => {
    if (current?.w && lc?.code) {
      const t = setTimeout(() => speakWord(current.w, lc.code), 150)
      return () => clearTimeout(t)
    }
  }, [idx, current?.id]) // eslint-disable-line

  const answer = async (know) => {
    if (!current) return
    if (know) {
      await removeFromPracticeQueue(user.id, lang, current.id)
      setDone(d => d + 1)
    }
    setFlipped(false)
    setTimeout(() => {
      if (know) {
        setQueue(prev => prev.filter((_, i) => i !== idx))
        setIdx(prev => Math.min(prev, queue.length - 2))
      } else {
        // Move to end of queue
        setQueue(prev => {
          const next = [...prev]
          const [item] = next.splice(idx, 1)
          next.push(item)
          return next
        })
        setIdx(prev => Math.min(prev, queue.length - 1))
      }
    }, 50)
  }

  const s = { fontFamily:"'Inter',system-ui,sans-serif", padding:'16px 14px 24px' }

  if (loading) return (
    <div style={{ ...s, textAlign:'center', paddingTop:80, color:C.ts }}>იტვირთება...</div>
  )

  // ── Completion screen ─────────────────────────────────────────
  if (!loading && queue.length === 0) return (
    <div style={s}>
      <button onClick={onBack}
        style={{ background:'none', border:'none', color:C.ts, cursor:'pointer',
          fontSize:20, padding:0, marginBottom:24 }}>←</button>
      <div style={{ textAlign:'center', paddingTop:40 }}>
        <div style={{ fontSize:72, marginBottom:20 }}>🎉</div>
        <div style={{ color:C.t, fontWeight:800, fontSize:24, marginBottom:8 }}>
          სამეცადინო დასრულდა!
        </div>
        <div style={{ color:C.ts, fontSize:14, marginBottom:32 }}>
          {done > 0
            ? `${done} სიტყვა დაიუფლე ✅`
            : 'სამეცადინო სიაში სიტყვა არ არის'}
        </div>
        <button onClick={onBack} className="tap"
          style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none',
            borderRadius:14, padding:'14px 32px', color:'#fff',
            fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit' }}>
          ← უკან
        </button>
      </div>
    </div>
  )

  return (
    <div className="page-enter" style={s}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <button onClick={onBack}
          style={{ background:'none', border:'none', color:C.ts,
            cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:C.t, fontWeight:700, fontSize:14 }}>📚 სამეცადინო</div>
          <div style={{ color:C.ts, fontSize:11 }}>
            {lc.flag} {queue.length} დარჩა · {done} ✅
          </div>
        </div>
        <div style={{ width:32 }} />
      </div>

      {/* Progress bar */}
      <div style={{ height:4, background:C.card3, borderRadius:2, marginBottom:20 }}>
        <div style={{ height:'100%', width:pct+'%',
          background:`linear-gradient(90deg,${C.a},${C.p})`,
          borderRadius:2, transition:'width .4s' }} />
      </div>

      {/* Card */}
      {current && (
        <div key={current.id} className="slide-right"
          onClick={() => { setFlipped(f => !f); if (!flipped) speakWord(current.w, lc.code) }}
          style={{ background:C.card2, border:`1px solid ${C.bdL}`,
            borderRadius:22, padding:'28px 22px', textAlign:'center',
            cursor:'pointer', minHeight:240, position:'relative',
            display:'flex', flexDirection:'column', justifyContent:'center',
            alignItems:'center', gap:10, marginBottom:20,
            boxShadow:'0 8px 32px rgba(0,0,0,.25)' }}>

          {!flipped ? (
            <>
              <div style={{ color:C.ts, fontSize:11, marginBottom:4 }}>{current.cat}</div>
              <div style={{ color:C.t, fontWeight:900, fontSize:34, letterSpacing:0.5 }}>
                {current.w}
              </div>
              <div style={{ color:C.a, fontSize:15 }}>{current.ph}</div>
              <div style={{ color:C.tm, fontSize:12, marginTop:12 }}>
                👆 შეეხე — თარგმანის სანახავად
              </div>
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                <button onClick={e => { e.stopPropagation(); speakWord(current.w, lc.code) }}
                  style={{ background:`${C.a}22`, border:'none', borderRadius:8,
                    padding:'6px 12px', color:C.a, fontSize:18, cursor:'pointer' }}>🔊</button>
                <button onClick={e => { e.stopPropagation(); speakWord(current.w, lc.code, true) }}
                  style={{ background:C.card3, border:'none', borderRadius:8,
                    padding:'6px 12px', color:C.ts, fontSize:12, cursor:'pointer',
                    fontFamily:'inherit' }}>🐢 ნელა</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ color:C.ts, fontSize:13, marginBottom:4 }}>{current.w}</div>
              <div style={{ color:C.gold, fontWeight:900, fontSize:30 }}>{current.t}</div>
              <div style={{ color:C.ts, fontSize:13, fontStyle:'italic', marginTop:10,
                maxWidth:280, lineHeight:1.5 }}>"{current.ex}"</div>
              <div style={{ color:C.t, fontSize:13, marginTop:4, maxWidth:280, lineHeight:1.5 }}>
                "{current.ext}"
              </div>
              <button onClick={e => { e.stopPropagation(); speakWord(current.ex, lc.code) }}
                style={{ marginTop:10, background:`${C.g}22`, border:'none', borderRadius:8,
                  padding:'6px 12px', color:C.g, fontSize:13, cursor:'pointer',
                  fontFamily:'inherit', fontWeight:700 }}>🔊 მაგალითი</button>
            </>
          )}
        </div>
      )}

      {/* Answer buttons */}
      {flipped && current && (
        <div className="slide-up" style={{ display:'flex', gap:10 }}>
          <button onClick={() => answer(false)} className="tap"
            style={{ flex:1, background:`${C.r}22`, border:`1px solid ${C.r}44`,
              borderRadius:14, padding:'16px 0', color:C.r, fontWeight:800,
              fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
            🔄 ისევ
          </button>
          <button onClick={() => answer(true)} className="tap"
            style={{ flex:2, background:`${C.g}22`, border:`1px solid ${C.g}44`,
              borderRadius:14, padding:'16px 0', color:C.g, fontWeight:800,
              fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
            ✅ ვიცი!
          </button>
        </div>
      )}

      {!flipped && current && (
        <div style={{ textAlign:'center', color:C.tm, fontSize:12, marginTop:8 }}>
          შეეხე ბარათს — პასუხის ღილაკების სანახავად
        </div>
      )}
    </div>
  )
}
