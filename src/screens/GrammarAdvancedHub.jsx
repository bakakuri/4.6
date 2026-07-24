import { useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import GrammarTopicCard from '../components/grammar/GrammarTopicCard.jsx'
import { buildAdvancedSnapshot, buildExamPool, buildMixedPool, gradeFreeWriting } from '../data/grammarAdvancedPhases.js'

const normalize = (v = '') => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim()

function BasicDeck({ title, deck, onBack, onFinish, immediateFeedback = false }) {
  const { C, gls } = useTheme()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState('')
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const current = deck[index]

  const submit = (value) => {
    if (!current || done) return
    const correct = normalize(value) === normalize(current.answer)
    const next = [...answers, { ...current, user: value, correct }]
    setAnswers(next)
    setPicked(value)
    if (index >= deck.length - 1) {
      setDone(true)
      onFinish?.(next)
    } else {
      if (immediateFeedback) {
        setTimeout(() => { setIndex(v => v + 1); setPicked('') }, 250)
      } else {
        setIndex(v => v + 1)
        setPicked('')
      }
    }
  }

  if (!current) {
    return <div style={{ color: C.ts, padding: 16 }}>კითხვის ბანკი ცარიელია.</div>
  }

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>{title}</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{index + 1}/{deck.length}</div>
      </div>
      <section style={gls({ padding: 18 })}>
        <div style={{ color: C.t, fontSize: 19, fontWeight: 800, lineHeight: 1.5 }}>{current.question}</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {(current.options || []).map(option => {
            const isCorrect = normalize(option) === normalize(current.answer)
            const isSelected = normalize(option) === normalize(picked)
            return <button key={option} onClick={() => submit(option)} style={{ textAlign: 'left', padding: 12, borderRadius: 11, border: `1px solid ${isCorrect && done ? C.g : isSelected && !isCorrect && done ? C.r : C.bdL}`, background: isCorrect && done ? `${C.g}18` : isSelected && !isCorrect && done ? `${C.r}18` : C.card2, color: C.t, fontFamily: 'inherit' }}>{isCorrect && done ? '✅ ' : isSelected && !isCorrect && done ? '❌ ' : ''}{option}</button>
          })}
        </div>
        {done && <div style={{ marginTop: 12, borderLeft: `3px solid ${C.g}`, background: C.card3, borderRadius: 10, padding: 12, color: C.ts, lineHeight: 1.7 }}><strong style={{ color: C.g }}>სესია დასრულდა</strong><br />სწორი პასუხები: {answers.filter(a => a.correct).length}/{answers.length}</div>}
      </section>
    </div>
  )
}

export default function GrammarAdvancedHub({ lang, categories, progress, due, mistakes, sessions, analytics, onBack, onOpenTopic, onOpenRoadmap }) {
  const { C, gls } = useTheme()
  const [mode, setMode] = useState('hub')
  const [goal, setGoal] = useState('balanced')
  const [writing, setWriting] = useState('')
  const snapshot = useMemo(() => buildAdvancedSnapshot({ categories, progress, due, mistakes, sessions, lang, goal, target: 30 }), [categories, progress, due, mistakes, sessions, lang, goal])
  const examPool = useMemo(() => buildExamPool({ categories, lang, limit: 20 }), [categories, lang])
  const mixedPool = useMemo(() => buildMixedPool({ categories, lang, limit: 12 }), [categories, lang])
  const writingGrade = useMemo(() => gradeFreeWriting(writing), [writing])

  if (mode === 'exam') return <BasicDeck title="🧪 Exam Simulation" deck={examPool} onBack={() => setMode('hub')} onFinish={() => setMode('hub')} />
  if (mode === 'mixed') return <BasicDeck title="🎲 Mixed Grammar Practice" deck={mixedPool} onBack={() => setMode('hub')} onFinish={() => setMode('hub')} immediateFeedback />
  if (mode === 'writing') {
    return <div style={{ padding: 16 }}>
      <button onClick={() => setMode('hub')} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}><div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>✍️ Free Writing Grammar Check</div><div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} წესებზე დაფუძნებული შემოწმება, AI bot-ის გარეშე.</div></div>
      <section style={gls({ padding: 16 })}>
        <textarea value={writing} onChange={e => setWriting(e.target.value)} rows={8} placeholder="დაწერე გერმანულად რამდენიმე წინადადება..." style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: 12, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, padding: 12, fontFamily: 'inherit', fontSize: 14 }} />
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div style={{ background: C.card3, borderRadius: 12, padding: 12, color: C.ts }}>Status: <strong style={{ color: writingGrade.ok ? C.g : C.o }}>{writingGrade.ok ? 'Looks good' : 'Needs review'}</strong></div>
          <div style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ color: C.t, fontWeight: 800 }}>Checks</div><div style={{ color: C.ts, lineHeight: 1.7, marginTop: 6 }}>{writingGrade.checks.length ? writingGrade.checks.map((check, i) => <div key={i}>• {check}</div>) : 'No obvious grammar patterns found.'}</div></div>
          <div style={{ color: C.ts, fontSize: 12 }}>Words: {writingGrade.length}</div>
        </div>
      </section>
    </div>
  }

  const goalText = {
    exam: 'Goethe-style exam prep with timed review and accuracy focus.',
    work: 'Formal grammar, workplace phrases, and clean sentence structure.',
    speaking: 'High-frequency sentence patterns for quick, accurate speech.',
    balanced: 'Balanced daily training: review, weak topics, and new practice.',
  }[goal] || 'Balanced daily training.'

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🧠 Grammar Advanced Hub</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} phases 24-33 in one place.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="📚" label="Overall mastery" value={`${snapshot.analytics.averageMastery || 0}%`} C={C} gls={gls} />
        <GrammarMetricCard icon="🎯" label="Accuracy" value={`${snapshot.analytics.accuracy || 0}%`} C={C} gls={gls} />
        <GrammarMetricCard icon="🔁" label="Due" value={due.length} C={C} gls={gls} />
        <GrammarMetricCard icon="🏅" label="Certificates" value={snapshot.certificates.filter(c => c.achieved).length} C={C} gls={gls} />
      </div>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🚦 Quick actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
          <button onClick={() => setMode('exam')} style={{ border: 'none', borderRadius: 12, padding: 12, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🧪 Exam simulation</button>
          <button onClick={() => setMode('mixed')} style={{ border: 'none', borderRadius: 12, padding: 12, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🎲 Mixed practice</button>
          <button onClick={() => setMode('writing')} style={{ border: 'none', borderRadius: 12, padding: 12, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>✍️ Free writing</button>
          <button onClick={onOpenRoadmap} style={{ border: `1px solid ${C.bdL}`, borderRadius: 12, padding: 12, background: C.card2, color: C.t, fontFamily: 'inherit', fontWeight: 800 }}>🗺️ Roadmap</button>
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🗺️ Mastery map 2.0</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {snapshot.masteryMap.map(group => <div key={group.level + group.category} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{group.level} · {group.category}</strong><span style={{ color: C.ts }}>{group.topics.length} topics</span></div><div style={{ display: 'grid', gap: 8, marginTop: 10 }}>{group.topics.slice(0, 4).map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={`${item.summary}${item.due ? ' · due now' : ''}`} mastery={item.mastery} onClick={() => onOpenTopic?.(item.category, item.topic)} C={C} compact />)}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🧬 Prerequisite dependency engine</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {snapshot.prerequisites.slice(0, 8).map(item => <div key={item.topic} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ color: C.t, fontWeight: 800 }}>{item.topic}</div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.prerequisites.length ? `Requires: ${item.prerequisites.join(' → ')}` : 'No prerequisite dependency.'}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🏅 Certificates & milestones</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {snapshot.certificates.map(item => <div key={item.id} style={{ background: C.card2, borderRadius: 12, padding: 12, border: `1px solid ${item.achieved ? C.g : C.bdL}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{item.title}</strong><span style={{ color: item.achieved ? C.g : C.ts }}>{item.achieved ? 'Unlocked' : 'Locked'}</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.detail}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🔥 Error pattern intelligence</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {snapshot.errorPatterns.length === 0 ? <div style={{ color: C.ts }}>No repeated error patterns yet.</div> : snapshot.errorPatterns.slice(0, 5).map(item => <div key={item.key} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{item.topic}</strong><span style={{ color: C.ts }}>{item.count}×</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>Top: {item.topType} × {item.topCount}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🎯 Goal-based learning</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['balanced', 'exam', 'work', 'speaking'].map(key => <button key={key} onClick={() => setGoal(key)} style={{ borderRadius: 999, padding: '8px 12px', border: `1px solid ${goal === key ? C.a : C.bdL}`, background: goal === key ? `${C.a}18` : C.card3, color: goal === key ? C.a : C.ts, fontFamily: 'inherit' }}>{key}</button>)}
        </div>
        <div style={{ background: C.card2, borderRadius: 12, padding: 12, marginTop: 10, color: C.ts, lineHeight: 1.7 }}>{goalText}</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {snapshot.goalPlan.items.map(item => <div key={item} style={{ background: C.card3, borderRadius: 12, padding: 12, color: C.t }}>{item}</div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>📅 Smart daily plan</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {snapshot.dailyPlan.items.map(item => <div key={item.label} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{item.label}</strong><span style={{ color: C.ts }}>{item.minutes} min</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>Exercises: {item.count}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>📊 Long-term progress analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
          <GrammarMetricCard icon="📈" label="Average" value={`${snapshot.longTerm.average}%`} C={C} gls={gls} />
          <GrammarMetricCard icon="🔥" label="Peak" value={`${snapshot.longTerm.peak}%`} C={C} gls={gls} />
          <GrammarMetricCard icon="🧊" label="Low" value={`${snapshot.longTerm.low}%`} C={C} gls={gls} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>{snapshot.longTerm.trend.length === 0 ? <div style={{ color: C.ts }}>Not enough session history yet.</div> : snapshot.longTerm.trend.slice(-5).map(item => <div key={item.day} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{item.day}</strong><span style={{ color: C.ts }}>{item.avgScore}%</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.count} sessions</div></div>)}</div>
      </section>

      <section style={gls({ padding: 16 })}>
        <div style={{ color: C.ts, fontSize: 12, marginBottom: 10 }}>Phase 24 → 33 is now wired into the learning stack.</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={() => setMode('exam')} style={{ border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🧪 Start exam simulation</button>
          <button onClick={() => setMode('mixed')} style={{ border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🎲 Start mixed practice</button>
          <button onClick={() => setMode('writing')} style={{ border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>✍️ Free writing checker</button>
        </div>
      </section>
    </div>
  )
}
