import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG, LEVELS, LEVEL_COLORS } from '../theme.js'
import { allWords, getWordLevel } from '../data/words.js'
import { getProgress } from '../utils/db.js'
import { speakWord } from '../utils/helpers.js'

export default function LearnedWordsScreen({ user, lang, onBack }) {
  const { C, gls } = useTheme()
  const [progress, setProgress] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)
  const lc = LANG[lang]

  useEffect(() => {
    getProgress(user.id, lang).then(p => { setProgress(p); setLoading(false) })
  }, [user.id, lang])

  const ws = allWords(lang)
  const learned = ws.filter(w => (progress[w.id]?.mastery || 0) >= 100)
  const filtered = search
    ? learned.filter(w =>
        w.w.toLowerCase().includes(search.toLowerCase()) || w.t.includes(search))
    : learned

  const byLevel = {}
  LEVELS.forEach(lvl => {
    const lws = filtered.filter(w => getWordLevel(lang, w.id) === lvl)
    if (lws.length) byLevel[lvl] = lws
  })

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={onBack}
          style={{ background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10,
                   width: 38, height: 38, cursor: 'pointer', color: C.ts, fontSize: 18,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <div>
          <div style={{ color: C.t, fontWeight: 800, fontSize: 20 }}>✅ ნასწავლი სიტყვები</div>
          <div style={{ color: C.ts, fontSize: 12, marginTop: 2 }}>
            {lc.flag} {lc.name} · {learned.length} სიტყვა
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: C.ts, paddingTop: 40 }}>იტვირთება...</div>
      )}

      {!loading && learned.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📚</div>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 18 }}>ჯერ სიტყვები არ გისწავლია</div>
          <div style={{ color: C.ts, fontSize: 14, marginTop: 8 }}>ფლეშქარდებით დაიწყე!</div>
        </div>
      )}

      {!loading && learned.length > 0 && (
        <>
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 სიტყვის ძიება..."
            style={{ width: '100%', background: C.card3, border: `1px solid ${C.bdL}`,
                     borderRadius: 12, padding: '12px 16px', color: C.t, fontSize: 14,
                     outline: 'none', boxSizing: 'border-box', marginBottom: 6, fontFamily: 'inherit' }} />
          <div style={{ color: C.ts, fontSize: 12, marginBottom: 16 }}>{filtered.length} სიტყვა</div>

          {/* By level */}
          {Object.entries(byLevel).map(([lvl, words]) => (
            <div key={lvl} style={{ marginBottom: 20 }}>
              {/* Level header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: LEVEL_COLORS[lvl], borderRadius: 6, padding: '3px 10px',
                               fontSize: 11, color: '#fff', fontWeight: 800 }}>{lvl}</span>
                <div style={{ flex: 1, height: 1, background: C.bdL }} />
                <span style={{ color: C.ts, fontSize: 11 }}>{words.length}</span>
              </div>

              {/* Words */}
              {words.map(w => {
                const isExp = expanded === w.id
                return (
                  <div key={w.id} onClick={() => setExpanded(isExp ? null : w.id)}
                    style={{ ...gls({ padding: '12px 14px', marginBottom: 8 }),
                             background: `${C.g}0d`, borderLeft: `3px solid ${C.g}`,
                             cursor: 'pointer', transition: 'all 0.2s' }}>
                    {/* Collapsed row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: C.t, fontWeight: 800, fontSize: 16 }}>{w.w}</span>
                        <span style={{ color: C.a, fontSize: 12 }}>{w.ph}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: C.gold, fontWeight: 700, fontSize: 14 }}>{w.t}</span>
                        <span style={{ color: C.ts, fontSize: 14 }}>{isExp ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExp && (
                      <div style={{ marginTop: 10, borderTop: `1px solid ${C.bdL}`, paddingTop: 10 }}
                           onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <button onClick={() => speakWord(w.w, lc.code)}
                            style={{ background: `${C.a}22`, border: 'none', borderRadius: 8,
                                     padding: '6px 12px', color: C.a, fontSize: 13,
                                     cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔊 სიტყვა</button>
                          <button onClick={() => speakWord(w.ex, lc.code)}
                            style={{ background: `${C.g}22`, border: 'none', borderRadius: 8,
                                     padding: '6px 12px', color: C.g, fontSize: 13,
                                     cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔊 წინადადება</button>
                        </div>
                        <div style={{ background: C.card3, borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ color: C.ts, fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>"{w.ex}"</div>
                          <div style={{ color: C.t,  fontSize: 13 }}>"{w.ext}"</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <span style={{ background: `${C.g}22`, border: `1px solid ${C.g}44`, borderRadius: 6,
                                         padding: '2px 8px', fontSize: 11, color: C.g }}>✅ 100% დაუფლებული</span>
                          <span style={{ background: C.card3, borderRadius: 6, padding: '2px 8px',
                                         fontSize: 11, color: C.ts }}>{w.cat}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
                  }
                                    
