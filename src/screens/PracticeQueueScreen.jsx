import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { getPracticeQueue, removeFromPracticeQueue } from '../utils/db.js'
import { speak } from '../utils/tts.js'

export default function PracticeQueueScreen({ user, lang, onBack }) {
  const { C, gls } = useTheme()
  const lc = LANG[lang]

  const [words,   setWords]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    const load = async () => {
      const ids = await getPracticeQueue(user.id, lang)
      if (!ids.length) { setLoading(false); return }
      const all = allWords(lang)
      setWords(ids.map(id => all.find(w => w.id === id)).filter(Boolean))
      setLoading(false)
    }
    load()
  }, [user.id, lang])

  const remove = async (wordId) => {
    setRemoving(wordId)
    await removeFromPracticeQueue(user.id, lang, wordId)
    setWords(prev => prev.filter(w => w.id !== wordId))
    setRemoving(null)
  }

  const filtered = words.filter(w =>
    !search || w.w.toLowerCase().includes(search.toLowerCase())
      || w.t.toLowerCase().includes(search.toLowerCase())
  )

  const s = { fontFamily:"'Inter',system-ui,sans-serif", padding:'0 14px 24px' }

  // ── Empty ─────────────────────────────────────────────────────
  if (!loading && words.length === 0) return (
    <div style={{ ...s, textAlign:'center', paddingTop:80, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📚</div>
      <div style={{ color:C.t, fontWeight:700, fontSize:17, marginBottom:8 }}>სამეცადინო ცარიელია</div>
      <div style={{ color:C.ts, fontSize:13, lineHeight:1.6 }}>
        ფლეშქარდებში 📚 ღილაკით ან<br/>ნასწავლი სიტყვებიდან სიტყვები დაამატე
      </div>
      <button onClick={onBack} className="tap"
        style={{ marginTop:28, background:`linear-gradient(135deg,${C.a},${C.p})`,
          border:'none', borderRadius:14, padding:'13px 28px', color:'#fff',
          fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
        ← უკან
      </button>
    </div>
  )

  return (
    <div className="page-enter" style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── Fixed header ─────────────────────────────────────── */}
      <div style={{ position:'sticky', top:56, zIndex:30, background:C.bg,
        padding:'12px 14px 10px', borderBottom:`1px solid ${C.bdL}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <button onClick={onBack}
            style={{ background:'none', border:'none', color:C.ts,
              cursor:'pointer', fontSize:20, padding:0, lineHeight:1 }}>←</button>
          <div>
            <div style={{ color:C.t, fontWeight:800, fontSize:17 }}>📚 სამეცადინო</div>
            <div style={{ color:C.ts, fontSize:11 }}>
              {lc.flag} {words.length} სიტყვა
            </div>
          </div>
          <div style={{ marginLeft:'auto', background:`${C.a}22`,
            border:`1px solid ${C.a}44`, borderRadius:10, padding:'4px 12px',
            color:C.a, fontWeight:800, fontSize:15 }}>
            {words.length}
          </div>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ძებნა..."
          autoComplete="off" autoCorrect="off"
          style={{ width:'100%', boxSizing:'border-box', background:C.card3,
            border:`1px solid ${C.bdL}`, borderRadius:10, padding:'9px 12px',
            color:C.t, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
      </div>

      {/* ── Word list ─────────────────────────────────────────── */}
      <div style={{ padding:'10px 14px 24px' }}>
        {loading
          ? <div style={{ textAlign:'center', color:C.ts, paddingTop:50 }}>იტვირთება...</div>
          : filtered.length === 0
          ? <div style={{ textAlign:'center', color:C.ts, paddingTop:40 }}>ვერ მოიძებნა</div>
          : filtered.map((w, i) => (
              <div key={w.id} className="card-rise"
                style={{ ...gls({ padding:'14px 14px' }), marginBottom:10,
                  animationDelay:`${i * 30}ms` }}>

                {/* ── Row 1: Word + audio + remove ──────────── */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6, flexWrap:'wrap' }}>
                      <span style={{ color:C.t, fontWeight:800, fontSize:19 }}>{w.w}</span>
                      <span style={{ color:C.a, fontSize:12 }}>{w.ph}</span>
                    </div>
                    <div style={{ color:C.gold, fontWeight:700, fontSize:15, marginTop:2 }}>
                      {w.t}
                    </div>
                    <div style={{ display:'flex', gap:4, marginTop:4 }}>
                      <span style={{ background:`${C.a}18`, border:`1px solid ${C.a}33`,
                        borderRadius:5, padding:'1px 7px', fontSize:10, color:C.a }}>
                        {w.cat}
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                    <button onClick={() => speak(w.w, lc.code)} className="tap"
                      title="სიტყვის გახმოვანება"
                      style={{ background:`linear-gradient(135deg,${C.a},${C.p})`,
                        border:'none', borderRadius:9, width:36, height:36,
                        cursor:'pointer', fontSize:16, display:'flex',
                        alignItems:'center', justifyContent:'center' }}>
                      🔊
                    </button>
                    <button onClick={() => remove(w.id)} disabled={removing === w.id}
                      className="tap" title="სამეცადინოდან ამოღება"
                      style={{ background:`${C.g}22`, border:`1px solid ${C.g}44`,
                        borderRadius:9, width:36, height:36, cursor:'pointer',
                        fontSize:15, display:'flex', alignItems:'center',
                        justifyContent:'center', opacity: removing===w.id ? 0.5 : 1 }}>
                      {removing === w.id ? '⏳' : '✅'}
                    </button>
                  </div>
                </div>

                {/* ── Divider ───────────────────────────────── */}
                <div style={{ height:1, background:C.bdL, margin:'8px 0' }} />

                {/* ── Row 2: Example sentence ───────────────── */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:C.t, fontSize:13, fontStyle:'italic',
                      lineHeight:1.5, marginBottom:2 }}>
                      "{w.ex}"
                    </div>
                    {w.exph && (
                      <div style={{ color:C.tm, fontSize:11, marginBottom:4 }}>
                        {w.exph}
                      </div>
                    )}
                    <div style={{ color:C.ts, fontSize:13, lineHeight:1.5 }}>
                      "{w.ext}"
                    </div>
                  </div>
                  <button onClick={() => speak(w.ex, lc.code)} className="tap"
                    title="წინადადების გახმოვანება"
                    style={{ background:`${C.g}22`, border:`1px solid ${C.g}33`,
                      borderRadius:9, width:34, height:34, cursor:'pointer',
                      fontSize:14, display:'flex', alignItems:'center',
                      justifyContent:'center', flexShrink:0, marginTop:2 }}>
                    🔊
                  </button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}
