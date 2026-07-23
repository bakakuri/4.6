import { useEffect, useMemo, useState } from 'react'
import { LANG } from '../../theme.js'
import { useTheme } from '../../lib/ThemeContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { getGrammarExercises } from '../../data/grammarExercises.js'
import { isGrammarAnswerCorrect } from '../../utils/grammarAnswer.js'
import GrammarErrorBoundary from '../GrammarErrorBoundary.jsx'
import GrammarTopicCard from './GrammarTopicCard.jsx'

const STATUS = { new: ['ახალი', '⚪'], learning: ['ვწავლობ', '🔵'], review: ['გამეორება', '🟡'], mastered: ['ათვისებული', '🟢'] }

export default function GrammarTopicPanel({
  lang,
  category,
  topic,
  progress,
  bookmarked,
  note,
  onBack,
  onBookmark,
  onSaveNote,
  onUpdateStatus,
  onAnswered,
  onOpenTopic,
}) {
  const { C, gls } = useTheme()
  const [draft, setDraft] = useState(note || '')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [tokens, setTokens] = useState([])
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => setDraft(note || ''), [note])

  const exercises = useMemo(() => getGrammarExercises(lang, topic.title), [lang, topic.title])
  const current = exercises[index]
  const related = (category.topics || []).filter(item => item.title !== topic.title).slice(0, 5)
  const mastery = progress?.mastery || 0
  const status = progress?.status || 'new'

  useEffect(() => {
    setIndex(0)
    setInput('')
    setTokens([])
    setAnswered(false)
    setScore(0)
  }, [topic.title])

  const submit = (value) => {
    if (!current || answered) return
    const answer = typeof value === 'string' ? value : (current.type === 'sentence_builder' ? tokens.join(' ') : input)
    const correct = isGrammarAnswerCorrect(answer, current)
    setAnswered(true)
    if (correct) setScore(v => v + 1)
    onAnswered?.({ correct, exercise: current, userAnswer: answer })
  }

  const next = () => {
    if (!exercises.length) return
    setIndex(v => (v + 1) % exercises.length)
    setInput('')
    setTokens([])
    setAnswered(false)
  }

  const toggle = (token) => {
    if (answered) return
    setTokens(prev => prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token])
  }

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 14px', marginBottom: 14, fontFamily: 'inherit' }}>← უკან</button>

      <section style={gls({ padding: 18, marginBottom: 12 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.ts, fontSize: 12 }}>{LANG[lang]?.flag} {category.cat}</div>
            <h1 style={{ color: C.t, fontSize: 24, margin: '7px 0' }}>{topic.title}</h1>
            <div style={{ color: C.ts, lineHeight: 1.7 }}>{topic.body?.split('\n').find(Boolean) || 'გრამატიკული ახსნა.'}</div>
          </div>
          <button onClick={onBookmark} title="რჩეულებში" style={{ fontSize: 23, border: `1px solid ${bookmarked ? C.gold : C.bdL}`, borderRadius: 12, background: C.card3, color: bookmarked ? C.gold : C.ts, minWidth: 46, minHeight: 46 }}>
            {bookmarked ? '★' : '☆'}
          </button>
        </div>

        <div style={{ marginTop: 15, color: C.ts }}>Mastery <strong style={{ color: C.a }}>{mastery}%</strong></div>
        <div style={{ height: 8, background: C.card3, borderRadius: 99, marginTop: 6, overflow: 'hidden' }}><div style={{ width: `${mastery}%`, height: '100%', background: C.a, borderRadius: 99 }} /></div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {Object.entries(STATUS).map(([key, [label, icon]]) => (
            <button key={key} onClick={() => onUpdateStatus(key)} style={{ padding: '7px 10px', borderRadius: 99, border: `1px solid ${status === key ? C.a : C.bdL}`, background: status === key ? `${C.a}18` : C.card3, color: status === key ? C.a : C.ts, fontFamily: 'inherit' }}>{icon} {label}</button>
          ))}
        </div>
      </section>

      <section style={gls({ padding: 18, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>📘 სრული ახსნა</h2>
        <div style={{ color: C.ts, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{topic.body}</div>
      </section>

      {Array.isArray(topic.ex) && topic.ex.length > 0 && (
        <section style={gls({ padding: 18, marginBottom: 12 })}>
          <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>📌 მაგალითები</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {topic.ex.map((example, i) => <div key={i} style={{ background: C.card3, borderRadius: 10, padding: 11, color: C.t, lineHeight: 1.7 }}>{example}</div>)}
          </div>
        </section>
      )}

      <GrammarErrorBoundary C={C}>
        <section style={gls({ padding: 18 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: C.ts, fontSize: 12, marginBottom: 12 }}>
            <span>🧪 Exercise</span>
            <span>{index + 1}/{Math.max(exercises.length, 1)} · Score {score}</span>
          </div>

          {!current ? (
            <div style={{ color: C.ts }}>ამ თემისთვის სავარჯიშოები ჯერ არ არის დამატებული.</div>
          ) : (
            <>
              <div style={{ color: C.t, fontSize: 18, fontWeight: 800, lineHeight: 1.6 }}>{current.question}</div>
              {current.type === 'multiple_choice' && <div style={{ display: 'grid', gap: 8, marginTop: 15 }}>{(current.options || []).map(option => {
                const chosen = answered && isGrammarAnswerCorrect(option, { ...current, answer: input || tokens.join(' ') })
                const isCorrect = answered && isGrammarAnswerCorrect(option, { ...current, answer: option }) && isGrammarAnswerCorrect(current.answer, { ...current, answer: option })
                return <button key={option} onClick={() => submit(option)} style={{ textAlign: 'left', padding: 12, borderRadius: 11, border: `1px solid ${isCorrect ? C.g : C.bdL}`, background: isCorrect ? `${C.g}18` : C.card2, color: C.t, fontFamily: 'inherit' }}>{isCorrect ? '✅ ' : ''}{option}</button>
              })}</div>}
              {(current.type === 'fill_blank' || current.type === 'error_correction' || current.type === 'translation') && <div style={{ marginTop: 15 }}><input value={input} onChange={e => setInput(e.target.value)} disabled={answered} placeholder="ჩაწერე პასუხი..." style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 11, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }} /><button onClick={() => submit(input)} disabled={!input.trim() || answered} style={{ width: '100%', marginTop: 8, border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', fontWeight: 800 }}>შემოწმება</button></div>}
              {current.type === 'sentence_builder' && <div style={{ marginTop: 15 }}><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', minHeight: 42, marginBottom: 10 }}>{tokens.length === 0 ? <div style={{ color: C.ts, fontSize: 13 }}>სიტყვებზე დააჭირე სწორი წინადადების ასაწყობად.</div> : tokens.map((token, i) => <button key={`${token}-${i}`} disabled={answered} onClick={() => toggle(token)} style={{ padding: '7px 10px', borderRadius: 9, background: C.a, color: '#fff', border: 'none', fontFamily: 'inherit' }}>{token}</button>)}</div><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(current.tokens || current.answer.split(/\s+/)).map((token, i) => <button key={`${token}-${i}`} disabled={answered} onClick={() => toggle(token)} style={{ padding: '8px 10px', borderRadius: 9, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>{token}</button>)}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}><button onClick={() => setTokens(prev => prev.slice(0, -1))} disabled={answered || tokens.length === 0} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 11, background: C.card2, color: C.t, fontFamily: 'inherit' }}>↶ Undo</button><button onClick={() => setTokens([])} disabled={answered || tokens.length === 0} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 11, background: C.card2, color: C.t, fontFamily: 'inherit' }}>↺ Reset</button></div><button onClick={() => submit(tokens.join(' '))} disabled={tokens.length === 0 || answered} style={{ width: '100%', marginTop: 10, border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', fontWeight: 800 }}>შემოწმება</button></div>}

              {answered && <div style={{ marginTop: 12, borderLeft: `3px solid ${isGrammarAnswerCorrect(input || tokens.join(' '), current) ? C.g : C.o}`, background: C.card3, borderRadius: 10, padding: 12, color: C.ts, lineHeight: 1.7 }}><strong style={{ color: isGrammarAnswerCorrect(input || tokens.join(' '), current) ? C.g : C.o }}>{isGrammarAnswerCorrect(input || tokens.join(' '), current) ? 'სწორია! 🎉' : `სწორი პასუხი: ${current.answer}`}</strong><br />{current.explanation}</div>}
              {answered && <button onClick={next} style={{ marginTop: 12, width: '100%', border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', fontWeight: 800 }}>შემდეგი კითხვა →</button>}
            </>
          )}
        </section>
      </GrammarErrorBoundary>

      <section style={gls({ padding: 18, marginTop: 12 })}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>🧠 ჩემი ჩანაწერი</h2>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={5} placeholder="ჩაწერე შენი წესი..." style={{ width: '100%', boxSizing: 'border-box', background: C.card2, color: C.t, border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 12, fontFamily: 'inherit' }} />
        <button onClick={() => onSaveNote(draft)} style={{ marginTop: 9, border: 'none', borderRadius: 10, padding: 10, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>შენახვა</button>
      </section>

      {related.length > 0 && (
        <section style={gls({ padding: 18, marginTop: 12 })}>
          <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>🔁 დაკავშირებული თემები</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {related.map(item => <GrammarTopicCard key={item.title} title={item.title} subtitle={item.body ? item.body.split('\n').find(Boolean) : ''} mastery={progress?.mastery || 0} onClick={() => onOpenTopic(item)} C={C} compact />)}
          </div>
        </section>
      )}
    </div>
  )
}
