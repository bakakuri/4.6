import { useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getGrammarDiagnosticQuestions } from '../data/grammarDiagnostic.js'

const normalize = (v = '') => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim()

export default function GrammarDiagnosticScreen({ lang, onBack, onDone }) {
  const { C, gls } = useTheme()
  const questions = useMemo(() => getGrammarDiagnosticQuestions(20), [])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [answers, setAnswers] = useState([])
  const [startedAt] = useState(() => Date.now())
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const current = questions[index]
  const correctCount = answers.filter(a => a.correct).length
  const progress = Math.round((answers.length / questions.length) * 100)

  const finish = async (finalAnswers) => {
    setDone(true)
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('grammar_sessions').insert({
          user_id: user.id,
          lang,
          category: 'Assessment',
          topic: 'Grammar Diagnostic',
          started_at: new Date(startedAt).toISOString(),
          completed_at: new Date().toISOString(),
          score: Math.round((finalAnswers.filter(a => a.correct).length / questions.length) * 100),
          duration_sec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        })
      }
    } finally {
      setSaving(false)
      onDone?.({ answers: finalAnswers })
    }
  }

  const choose = (option) => {
    if (!current || done) return
    const next = [...answers, { ...current, choice: option, correct: normalize(option) === normalize(current.answer) }]
    setAnswers(next)
    setSelected(option)
    if (index === questions.length - 1) finish(next)
    else setTimeout(() => { setIndex(i => i + 1); setSelected('') }, 220)
  }

  if (done) {
    const score = Math.round((correctCount / questions.length) * 100)
    const weakAreas = [...new Set(answers.filter(a => !a.correct).map(a => a.area))]
    return (
      <div style={{ padding: 16 }}>
        <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px' }}>← უკან</button>
        <section style={{ ...gls({ padding: 20, marginTop: 14 }), textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>🧭</div>
          <h2 style={{ color: C.t }}>Grammar Diagnostic დასრულდა</h2>
          <div style={{ color: C.ts, lineHeight: 1.7 }}>ქულა: <strong style={{ color: C.a }}>{score}%</strong></div>
          <div style={{ marginTop: 10, color: C.ts }}>სწორი პასუხები: {correctCount}/{questions.length}</div>
          <div style={{ marginTop: 10, color: C.ts }}>სუსტი ზონები: {weakAreas.length ? weakAreas.join(', ') : 'არცერთი'}</div>
          <div style={{ marginTop: 10, color: C.ts, fontSize: 12 }}>{saving ? 'შედეგი ინახება...' : 'შედეგი შენახულია.'}</div>
          <button onClick={onBack} style={{ marginTop: 16, border: 'none', borderRadius: 11, padding: '12px 16px', background: C.a, color: '#fff', fontWeight: 800 }}>შედეგებზე დაბრუნება</button>
        </section>
      </div>
    )
  }

  if (!current) return null

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🧭 Grammar Diagnostic Test</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} {index + 1}/{questions.length} · {progress}%</div>
      </div>
      <section style={gls({ padding: 18 })}>
        <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>{current.area} · {current.topic}</div>
        <h2 style={{ color: C.t, fontSize: 20, lineHeight: 1.5, marginTop: 0 }}>{current.question}</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {current.options.map(option => {
            const isChosen = selected && normalize(selected) === normalize(option)
            const isCorrect = normalize(option) === normalize(current.answer)
            return (
              <button key={option} onClick={() => choose(option)} style={{ textAlign: 'left', padding: 12, borderRadius: 11, border: `1px solid ${selected && isCorrect ? C.g : selected && isChosen && !isCorrect ? C.r : C.bdL}`, background: selected && isCorrect ? `${C.g}18` : selected && isChosen && !isCorrect ? `${C.r}18` : C.card2, color: C.t, fontFamily: 'inherit' }}>
                {selected && isCorrect ? '✅ ' : selected && isChosen && !isCorrect ? '❌ ' : ''}{option}
              </button>
            )
          })}
        </div>
        {selected && <div style={{ marginTop: 12, borderLeft: `3px solid ${normalize(selected) === normalize(current.answer) ? C.g : C.o}`, background: C.card3, borderRadius: 10, padding: 12, color: C.ts, lineHeight: 1.7 }}><strong style={{ color: normalize(selected) === normalize(current.answer) ? C.g : C.o }}>{normalize(selected) === normalize(current.answer) ? 'სწორია!' : `სწორი პასუხი: ${current.answer}`}</strong><br />{current.explanation}</div>}
        <div style={{ color: C.ts, fontSize: 12, marginTop: 12 }}>სწორი პასუხები: {correctCount} · შეცდომები: {answers.length - correctCount}</div>
      </section>
    </div>
  )
}
