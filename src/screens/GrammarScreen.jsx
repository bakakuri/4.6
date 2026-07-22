import { useEffect, useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import GR from '../data/grammar.js'
import A1 from '../data/grammarA1.js'
import { getGrammarExercises } from '../data/grammarExercises.js'
import { getNextInterval, getNextReviewDate } from '../data/grammarReview.js'
import { isGrammarAnswerCorrect } from '../utils/grammarAnswer.js'
import GrammarErrorBoundary from '../components/GrammarErrorBoundary.jsx'
import GrammarReviewScreen from './GrammarReviewScreen.jsx'
import GrammarMistakesScreen from './GrammarMistakesScreen.jsx'

const STATUS = {
  new: ['ახალი', '⚪'],
  learning: ['ვწავლობ', '🔵'],
  review: ['გამეორება', '🟡'],
  mastered: ['ათვისებული', '🟢'],
}

const ACHIEVEMENTS = [
  ['first-grammar', '📖 პირველი თემა', r => r.seen >= 1],
  ['ten-correct', '🎯 10 სწორი პასუხი', r => r.correct >= 10],
  ['accuracy-90', '⚡ 90% სიზუსტე', r => r.total >= 10 && r.accuracy >= 90],
  ['mastery-100', '🏆 პირველი Mastery 100%', r => r.mastered >= 1],
  ['fifty-answers', '🧠 50 სავარჯიშო', r => r.total >= 50],
]

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim()
}

function keyOf(lang, category, topic) {
  return `${lang}::${category}::${topic}`
}

function topicSummary(topic) {
  const source = topic?.ex?.[0] || topic?.body || ''
  const firstLine = String(source)
    .split('\n')
    .map(line => line.replace(/^\*\*|\*\*$/g, '').replace(/^•\s*/, '').trim())
    .find(Boolean)
  return (firstLine || 'გრამატიკული წესები, ახსნა და მაგალითები.').slice(0, 150)
}

function renderBody(body = '', C) {
  return String(body)
    .split('\n')
    .map((line, i) => {
      const t = line.trim()
      if (!t) return <div key={i} style={{ height: 7 }} />
      if (/^\*\*.*\*\*$/.test(t)) {
        return <h3 key={i} style={{ color: C.t, fontSize: 16, margin: '16px 0 6px' }}>{t.replace(/\*\*/g, '')}</h3>
      }
      if (/^(⚠️|✅|💡)/.test(t)) {
        const tone = t.startsWith('⚠️') ? C.o : t.startsWith('✅') ? C.g : C.a
        return <div key={i} style={{ borderLeft: `3px solid ${tone}`, background: C.card3, borderRadius: 10, padding: 11, color: C.ts, lineHeight: 1.7, margin: '8px 0' }}>{t}</div>
      }
      if (t.startsWith('•')) {
        return <div key={i} style={{ color: C.ts, lineHeight: 1.7, marginBottom: 4 }}>• {t.slice(1).trim()}</div>
      }
      return <p key={i} style={{ color: C.ts, lineHeight: 1.8, margin: '6px 0' }}>{t}</p>
    })
}

function StatCard({ icon, label, value, C, gls }) {
  return (
    <div style={gls({ padding: 14 })}>
      <div style={{ color: C.ts, fontSize: 12 }}>{icon} {label}</div>
      <div style={{ color: C.t, fontSize: 23, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  )
}

function PracticePanel({ exercises, progress, onAnswered, C, gls }) {
  const safeExercises = Array.isArray(exercises) ? exercises.filter(Boolean) : []
  const signature = safeExercises.map(e => e.id).join('|')
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [selectedTokens, setSelectedTokens] = useState([])
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    setIndex(0)
    setInput('')
    setSelectedTokens([])
    setAnswered(false)
    setScore(0)
  }, [signature])

  const current = safeExercises[index] || safeExercises[0]
  if (!current) {
    return (
      <section style={gls({ padding: 18 })}>
        <div style={{ color: C.ts }}>ამ თემისთვის სავარჯიშოები ჯერ არ არის დამატებული.</div>
      </section>
    )
  }

  const typeLabel = {
    multiple_choice: '🧪 არჩევანი',
    fill_blank: '✍️ ჩასვი პასუხი',
    sentence_builder: '🔀 ააწყვე წინადადება',
    error_correction: '🛠️ გაასწორე შეცდომა',
    translation: '🌍 თარგმანი',
  }[current.type] || '🧪 სავარჯიშო'

  const tokens = Array.isArray(current.tokens) && current.tokens.length > 0
    ? current.tokens.filter(Boolean)
    : String(current.answer || '').split(/\s+/).filter(Boolean)

  const userAnswer = current.type === 'sentence_builder'
    ? selectedTokens.join(' ')
    : input.trim()

  const check = () => {
    if (answered) return
    const correct = isGrammarAnswerCorrect(userAnswer, current)
    setAnswered(true)
    if (correct) setScore(value => value + 1)
    try {
      onAnswered?.({ correct, exercise: current, userAnswer })
    } catch (error) {
      console.error(error)
    }
  }

  const next = () => {
    if (!safeExercises.length) return
    setIndex(value => (value + 1) % safeExercises.length)
    setInput('')
    setSelectedTokens([])
    setAnswered(false)
  }

  const toggleToken = token => {
    if (answered) return
    setSelectedTokens(prev => (
      prev.includes(token)
        ? prev.filter(item => item !== token)
        : [...prev, token]
    ))
  }

  return (
    <section style={gls({ padding: 18 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: C.ts, fontSize: 12, marginBottom: 12 }}>
        <span>🧪 {typeLabel}</span>
        <span>{index + 1}/{safeExercises.length} · Score {score}</span>
      </div>

      <div style={{ height: 7, background: C.card3, borderRadius: 99, overflow: 'hidden', marginBottom: 15 }}>
        <div style={{ width: `${((index + 1) / safeExercises.length) * 100}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.g})` }} />
      </div>

      <div style={{ background: C.card3, borderRadius: 14, padding: 16 }}>
        <div style={{ color: C.t, fontSize: 18, fontWeight: 800, lineHeight: 1.6 }}>{current.question}</div>

        {current.type === 'multiple_choice' && (
          <div style={{ display: 'grid', gap: 8, marginTop: 15 }}>
            {(Array.isArray(current.options) ? current.options : []).map(option => {
              const isChosen = answered && normalizeText(option) === normalizeText(userAnswer)
              const isCorrect = answered && normalizeText(option) === normalizeText(current.answer)
              return (
                <button
                  key={option}
                  onClick={() => !answered && check(option)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 11,
                    border: `1px solid ${isCorrect ? C.g : isChosen && !isCorrect ? C.r : C.bdL}`,
                    background: isCorrect ? `${C.g}18` : isChosen && !isCorrect ? `${C.r}18` : C.card2,
                    color: C.t,
                    fontFamily: 'inherit',
                    cursor: answered ? 'default' : 'pointer',
                  }}
                >
                  {isCorrect ? '✅ ' : isChosen && !isCorrect ? '❌ ' : ''}{option}
                </button>
              )
            })}
          </div>
        )}

        {(current.type === 'fill_blank' || current.type === 'error_correction' || current.type === 'translation') && (
          <div style={{ marginTop: 15 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={answered}
              placeholder="ჩაწერე პასუხი..."
              style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 11, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}
            />
            <button
              onClick={check}
              disabled={!userAnswer || answered}
              style={{ width: '100%', marginTop: 8, border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', fontWeight: 800 }}
            >
              შემოწმება
            </button>
          </div>
        )}

        {current.type === 'sentence_builder' && (
          <div style={{ marginTop: 15 }}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', minHeight: 42, marginBottom: 10 }}>
              {selectedTokens.length === 0 ? (
                <div style={{ color: C.ts, fontSize: 13 }}>სიტყვებზე დააჭირე სწორი წინადადების ასაწყობად.</div>
              ) : selectedTokens.map((token, i) => (
                <button
                  key={`${token}-${i}`}
                  disabled={answered}
                  onClick={() => toggleToken(token)}
                  style={{ padding: '7px 10px', borderRadius: 9, background: C.a, color: '#fff', border: 'none', fontFamily: 'inherit' }}
                >
                  {token}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {tokens.map((token, i) => (
                <button
                  key={`${token}-${i}`}
                  disabled={answered}
                  onClick={() => toggleToken(token)}
                  style={{ padding: '8px 10px', borderRadius: 9, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}
                >
                  {token}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <button onClick={() => setSelectedTokens(tokens => tokens.slice(0, -1))} disabled={answered || selectedTokens.length === 0} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 11, background: C.card2, color: C.t, fontFamily: 'inherit' }}>↶ Undo</button>
              <button onClick={() => { if (!answered) { setSelectedTokens([]) } }} disabled={answered || selectedTokens.length === 0} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 11, background: C.card2, color: C.t, fontFamily: 'inherit' }}>↺ Reset</button>
            </div>
            <button onClick={check} disabled={!userAnswer || answered} style={{ width: '100%', marginTop: 10, border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', fontWeight: 800 }}>შემოწმება</button>
          </div>
        )}
      </div>

      {answered && (
        <div style={{ marginTop: 12, borderLeft: `3px solid ${isGrammarAnswerCorrect(userAnswer, current) ? C.g : C.o}`, background: C.card3, borderRadius: 10, padding: 12, color: C.ts, lineHeight: 1.7 }}>
          <strong style={{ color: isGrammarAnswerCorrect(userAnswer, current) ? C.g : C.o }}>
            {isGrammarAnswerCorrect(userAnswer, current) ? 'სწორია! 🎉' : `სწორი პასუხი: ${current.answer}`}
          </strong>
          <br />
          {current.explanation}
        </div>
      )}

      {answered && (
        <button onClick={next} style={{ marginTop: 12, width: '100%', border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', fontWeight: 800 }}>
          შემდეგი კითხვა →
        </button>
      )}

      <div style={{ color: C.ts, fontSize: 12, marginTop: 12 }}>
        ამ თემის სტატისტიკა: {progress?.correct_count || 0} სწორი · {progress?.wrong_count || 0} შეცდომა
      </div>
    </section>
  )
}

function TopicPanel({
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
  C,
  gls,
}) {
  const [draft, setDraft] = useState(note || '')
  const exercises = getGrammarExercises(lang, topic.title)

  useEffect(() => {
    setDraft(note || '')
  }, [note])

  const related = (category.topics || []).filter(item => item.title !== topic.title).slice(0, 5)
  const mastery = progress?.mastery || 0
  const status = progress?.status || 'new'

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 14px', marginBottom: 14, fontFamily: 'inherit' }}>
        ← უკან
      </button>

      <section style={gls({ padding: 18, marginBottom: 12 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.ts, fontSize: 12 }}>{LANG[lang]?.flag} {category.cat}</div>
            <h1 style={{ color: C.t, fontSize: 24, margin: '7px 0' }}>{topic.title}</h1>
            <div style={{ color: C.ts, lineHeight: 1.7 }}>{topicSummary(topic)}</div>
          </div>
          <button onClick={onBookmark} title="რჩეულებში" style={{ fontSize: 23, border: `1px solid ${bookmarked ? C.gold : C.bdL}`, borderRadius: 12, background: C.card3, color: bookmarked ? C.gold : C.ts, minWidth: 46, minHeight: 46 }}>
            {bookmarked ? '★' : '☆'}
          </button>
        </div>

        <div style={{ marginTop: 15, color: C.ts }}>Mastery <strong style={{ color: C.a }}>{mastery}%</strong></div>
        <div style={{ height: 8, background: C.card3, borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
          <div style={{ width: `${mastery}%`, height: '100%', background: C.a, borderRadius: 99 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {Object.entries(STATUS).map(([key, [label, icon]]) => (
            <button
              key={key}
              onClick={() => onUpdateStatus(key)}
              style={{
                padding: '7px 10px',
                borderRadius: 99,
                border: `1px solid ${status === key ? C.a : C.bdL}`,
                background: status === key ? `${C.a}18` : C.card3,
                color: status === key ? C.a : C.ts,
                fontFamily: 'inherit',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </section>

      <section style={gls({ padding: 18, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>📘 სრული ახსნა</h2>
        {renderBody(topic.body, C)}
      </section>

      {Array.isArray(topic.ex) && topic.ex.length > 0 && (
        <section style={gls({ padding: 18, marginBottom: 12 })}>
          <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>📌 მაგალითები</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {topic.ex.map((example, i) => (
              <div key={i} style={{ background: C.card3, borderRadius: 10, padding: 11, color: C.t, lineHeight: 1.7 }}>
                {example}
              </div>
            ))}
          </div>
        </section>
      )}

      <GrammarErrorBoundary C={C}>
        <PracticePanel exercises={exercises} progress={progress} onAnswered={onAnswered} C={C} gls={gls} />
      </GrammarErrorBoundary>

      <section style={gls({ padding: 18, marginTop: 12 })}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>🧠 ჩემი ჩანაწერი</h2>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={5}
          placeholder="ჩაწერე შენი წესი..."
          style={{ width: '100%', boxSizing: 'border-box', background: C.card2, color: C.t, border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 12, fontFamily: 'inherit' }}
        />
        <button onClick={() => onSaveNote(draft)} style={{ marginTop: 9, border: 'none', borderRadius: 10, padding: 10, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>
          შენახვა
        </button>
      </section>

      {related.length > 0 && (
        <section style={gls({ padding: 18, marginTop: 12 })}>
          <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 10px' }}>🔁 დაკავშირებული თემები</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {related.map(item => (
              <button
                key={item.title}
                onClick={() => onOpenTopic(item)}
                style={{ textAlign: 'left', width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}
              >
                <div style={{ fontWeight: 800 }}>{item.title}</div>
                <div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{topicSummary(item)}</div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function GrammarScreen({ lang }) {
  const { C, gls } = useTheme()
  const categories = useMemo(() => {
    const base = GR[lang] || GR.german || []
    return lang === 'german' ? [...A1, ...base] : base
  }, [lang])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const [mode, setMode] = useState('topics')
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [progress, setProgress] = useState({})
  const [bookmarks, setBookmarks] = useState(new Set())
  const [notes, setNotes] = useState({})
  const [due, setDue] = useState([])
  const [achievements, setAchievements] = useState([])
  const [challenge, setChallenge] = useState({ target: 5, completed: 0 })

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError) {
        setError(authError.message)
      }

      if (!user) {
        setUserId(null)
        setLoading(false)
        return
      }

      setUserId(user.id)

      const [progressRes, bookmarksRes, notesRes, dueRes, achievementsRes, challengeRes] = await Promise.all([
        supabase.from('grammar_progress').select('*').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_bookmarks').select('category,topic').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_notes').select('category,topic,note').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_mistakes').select('*').eq('user_id', user.id).eq('lang', lang).lte('next_review_at', new Date().toISOString()).order('next_review_at').limit(50),
        supabase.from('grammar_achievements').select('achievement_id').eq('user_id', user.id),
        supabase.from('grammar_daily_challenges').select('*').eq('user_id', user.id).eq('challenge_date', new Date().toISOString().slice(0, 10)).maybeSingle(),
      ])

      if (!active) return

      const firstError = progressRes.error || bookmarksRes.error || notesRes.error || dueRes.error || achievementsRes.error || challengeRes.error
      if (firstError) setError(firstError.message)

      const progressMap = {}
      ;(progressRes.data || []).forEach(row => {
        progressMap[keyOf(lang, row.category, row.topic)] = row
      })

      const noteMap = {}
      ;(notesRes.data || []).forEach(row => {
        noteMap[keyOf(lang, row.category, row.topic)] = row.note
      })

      setProgress(progressMap)
      setBookmarks(new Set((bookmarksRes.data || []).map(row => keyOf(lang, row.category, row.topic))))
      setNotes(noteMap)
      setDue(dueRes.data || [])
      setAchievements((achievementsRes.data || []).map(row => row.achievement_id))
      setChallenge(challengeRes.data || { target: 5, completed: 0 })
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [lang])

  const allTopics = useMemo(() => categories.flatMap(category => (category.topics || []).map(topic => ({ category, topic }))), [categories])
  const rows = Object.values(progress)
  const total = rows.reduce((sum, row) => sum + (row.correct_count || 0) + (row.wrong_count || 0), 0)
  const correct = rows.reduce((sum, row) => sum + (row.correct_count || 0), 0)
  const wrong = rows.reduce((sum, row) => sum + (row.wrong_count || 0), 0)
  const mastered = rows.filter(row => row.mastery >= 100 || row.status === 'mastered').length
  const average = allTopics.length ? Math.round(rows.reduce((sum, row) => sum + (row.mastery || 0), 0) / allTopics.length) : 0
  const accuracy = total ? Math.round((correct / total) * 100) : 0
  const seen = rows.filter(row => (row.times_viewed || 0) > 0).length

  const saveProgress = async (category, topic, patch = {}) => {
    if (!userId) return

    const id = keyOf(lang, category.cat, topic.title)
    const previous = progress[id] || {}
    const isAnswer = patch.answer !== undefined

    const nextCorrect = previous.correct_count || 0
    const nextWrong = previous.wrong_count || 0
    const correctCount = nextCorrect + (isAnswer && patch.answer?.correct ? 1 : 0)
    const wrongCount = nextWrong + (isAnswer && !patch.answer?.correct ? 1 : 0)
    const totalAnswered = correctCount + wrongCount
    const mastery = patch.mastery ?? (totalAnswered ? Math.min(100, Math.round((correctCount / totalAnswered) * 100)) : (previous.mastery || 0))
    const status = patch.status || (mastery >= 100 ? 'mastered' : mastery >= 50 ? 'review' : previous.status || (patch.view ? 'learning' : 'new'))

    const row = {
      user_id: userId,
      lang,
      category: category.cat,
      topic: topic.title,
      status,
      mastery,
      times_viewed: (previous.times_viewed || 0) + (patch.view ? 1 : 0),
      correct_count: correctCount,
      wrong_count: wrongCount,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setProgress(prev => ({ ...prev, [id]: row }))

    const { error: progressError } = await supabase.from('grammar_progress').upsert(row, { onConflict: 'user_id,lang,category,topic' })
    if (progressError) setError(progressError.message)

    if (!isAnswer) return

    const exercise = patch.answer.exercise
    if (!patch.answer.correct) {
      const { data: existingMistake } = await supabase
        .from('grammar_mistakes')
        .select('id,mistake_count,review_count')
        .match({ user_id: userId, lang, category: category.cat, topic: topic.title, exercise_id: exercise.id })
        .maybeSingle()

      const previousMistakes = existingMistake?.mistake_count || 0
      const nextMistakeCount = previousMistakes + 1
      const nextReviewAt = getNextReviewDate(getNextInterval(existingMistake?.review_count || 0, false))

      const mistakeRow = {
        user_id: userId,
        lang,
        category: category.cat,
        topic: topic.title,
        exercise_id: exercise.id,
        exercise_type: exercise.type,
        question: exercise.question,
        user_answer: patch.answer.userAnswer,
        correct_answer: exercise.answer,
        explanation: exercise.explanation,
        mistake_count: nextMistakeCount,
        review_count: 0,
        next_review_at: nextReviewAt,
        last_answered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: mistakeError } = await supabase.from('grammar_mistakes').upsert(mistakeRow, { onConflict: 'user_id,lang,topic,exercise_id' })
      if (mistakeError) setError(mistakeError.message)
    }

    const today = new Date().toISOString().slice(0, 10)
    const nextCompleted = Math.min(challenge.target || 5, (challenge.completed || 0) + 1)
    setChallenge(prev => ({ ...prev, completed: nextCompleted }))

    const { error: challengeError } = await supabase.from('grammar_daily_challenges').upsert({
      user_id: userId,
      challenge_date: today,
      target: challenge.target || 5,
      completed: nextCompleted,
      xp: nextCompleted * 10,
      completed_at: nextCompleted >= (challenge.target || 5) ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,challenge_date' })
    if (challengeError) setError(challengeError.message)

    const stats = {
      seen,
      correct: correctCount,
      total: totalAnswered,
      accuracy: totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0,
      mastered,
    }

    for (const [achievementId, , test] of ACHIEVEMENTS) {
      if (!test(stats) || achievements.includes(achievementId)) continue
      const { error: achievementError } = await supabase.from('grammar_achievements').upsert({ user_id: userId, achievement_id: achievementId }, { onConflict: 'user_id,achievement_id' })
      if (!achievementError) setAchievements(prev => [...prev, achievementId])
    }
  }

  const saveNote = async (category, topic, note) => {
    if (!userId) return
    const id = keyOf(lang, category.cat, topic.title)
    const clean = note.trim()
    setNotes(prev => ({ ...prev, [id]: clean }))

    if (!clean) {
      const { error } = await supabase.from('grammar_notes').delete().match({ user_id: userId, lang, category: category.cat, topic: topic.title })
      if (error) setError(error.message)
      return
    }

    const { error } = await supabase.from('grammar_notes').upsert({
      user_id: userId,
      lang,
      category: category.cat,
      topic: topic.title,
      note: clean,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lang,category,topic' })
    if (error) setError(error.message)
  }

  const toggleBookmark = async (category, topic) => {
    if (!userId) return
    const id = keyOf(lang, category.cat, topic.title)
    const exists = bookmarks.has(id)
    setBookmarks(prev => {
      const next = new Set(prev)
      if (exists) next.delete(id)
      else next.add(id)
      return next
    })

    const result = exists
      ? await supabase.from('grammar_bookmarks').delete().match({ user_id: userId, lang, category: category.cat, topic: topic.title })
      : await supabase.from('grammar_bookmarks').insert({ user_id: userId, lang, category: category.cat, topic: topic.title })

    if (result.error) setError(result.error.message)
  }

  const openTopic = (category, topic) => {
    setSelected({ category, topic })
    setMode('topic')
  }

  const backToTopics = () => {
    setSelected(null)
    setMode('topics')
  }

  const visibleCategories = useMemo(() => {
    const q = normalizeText(query)
    return categories
      .map(category => ({
        ...category,
        topics: (category.topics || []).filter(topic => {
          const id = keyOf(lang, category.cat, topic.title)
          const row = progress[id]
          const haystack = normalizeText(`${category.cat} ${topic.title} ${topic.body} ${(topic.ex || []).join(' ')}`)
          const matchesQuery = !q || haystack.includes(q)
          const matchesFilter = filter === 'all'
            || (filter === 'bookmarks' && bookmarks.has(id))
            || (filter === 'mastered' && (row?.mastery || 0) >= 100)
            || (filter === 'learning' && row && row.status !== 'new')
          return matchesQuery && matchesFilter
        }),
      }))
      .filter(category => category.topics.length > 0)
  }, [categories, query, filter, progress, bookmarks, lang])

  if (loading) {
    return <div style={{ padding: 20, color: C.ts }}>გრამატიკის მონაცემები იტვირთება...</div>
  }

  if (!userId) {
    return <div style={{ padding: 20, color: C.ts, lineHeight: 1.8 }}>🔐 გრამატიკის პროგრესის, ფავორიტებისა და ჩანაწერების შესანახად ავტორიზაცია საჭიროა.</div>
  }

  if (mode === 'review') {
    return (
      <GrammarErrorBoundary C={C}>
        <GrammarReviewScreen lang={lang} onBack={backToTopics} />
      </GrammarErrorBoundary>
    )
  }

  if (mode === 'mistakes') {
    return (
      <GrammarErrorBoundary C={C}>
        <GrammarMistakesScreen lang={lang} onBack={backToTopics} onReview={() => setMode('review')} />
      </GrammarErrorBoundary>
    )
  }

  if (mode === 'topic' && selected) {
    const { category, topic } = selected
    const id = keyOf(lang, category.cat, topic.title)
    return (
      <GrammarErrorBoundary C={C}>
        <TopicPanel
          lang={lang}
          category={category}
          topic={topic}
          progress={progress[id]}
          bookmarked={bookmarks.has(id)}
          note={notes[id] || ''}
          onBack={backToTopics}
          onBookmark={() => toggleBookmark(category, topic)}
          onSaveNote={noteValue => saveNote(category, topic, noteValue)}
          onUpdateStatus={status => saveProgress(category, topic, { status })}
          onAnswered={payload => saveProgress(category, topic, { answer: payload })}
          onOpenTopic={item => openTopic(category, item)}
          C={C}
          gls={gls}
        />
      </GrammarErrorBoundary>
    )
  }

  return (
    <GrammarErrorBoundary C={C}>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: C.t, fontWeight: 900, fontSize: 25 }}>📖 გრამატიკა 3.0</div>
          <div style={{ color: C.ts, fontSize: 13, marginTop: 5, lineHeight: 1.7 }}>
            {LANG[lang]?.flag} {LANG[lang]?.name} · Learn → Practice → Mistakes → SRS → Mastery
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: `${C.r}14`, border: `1px solid ${C.r}55`, color: C.r, lineHeight: 1.6 }}>
            ⚠️ Backend შეცდომა: {error}
            <br />
            <small>თუ ეს არის RLS ან relation შეცდომა, გაუშვი <b>supabase/migrations/grammar_3_0.sql</b> Supabase SQL Editor-ში. სრული schema.sql თავიდან არ გაუშვა.</small>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
          <StatCard icon="📚" label="თემები" value={allTopics.length} C={C} gls={gls} />
          <StatCard icon="📈" label="საშუალო mastery" value={`${average}%`} C={C} gls={gls} />
          <StatCard icon="🏆" label="ათვისებული" value={mastered} C={C} gls={gls} />
          <StatCard icon="🎯" label="სიზუსტე" value={`${accuracy}%`} C={C} gls={gls} />
        </div>

        <section style={gls({ padding: 14, marginBottom: 12 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: C.ts }}>
            <span>📅 დღევანდელი Challenge</span>
            <strong style={{ color: C.a }}>{challenge.completed || 0}/{challenge.target || 5}</strong>
          </div>
          <div style={{ height: 8, background: C.card3, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((challenge.completed || 0) / (challenge.target || 5)) * 100)}%`, height: '100%', background: C.g, borderRadius: 99 }} />
          </div>
          <div style={{ color: C.ts, fontSize: 12, marginTop: 7 }}>+{(challenge.completed || 0) * 10} XP · {due.length} SRS review due</div>
        </section>

        <section style={gls({ padding: 14, marginBottom: 12 })}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="🔎 მოძებნე გრამატიკული თემა..."
            style={{ width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 12, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {[
              ['all', 'ყველა'],
              ['learning', 'ვწავლობ'],
              ['mastered', 'ათვისებული'],
              ['bookmarks', 'რჩეულები'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{ borderRadius: 99, padding: '8px 12px', border: `1px solid ${filter === key ? C.a : C.bdL}`, background: filter === key ? `${C.a}18` : C.card3, color: filter === key ? C.a : C.ts, fontFamily: 'inherit' }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button onClick={() => setMode('mistakes')} style={{ borderRadius: 12, padding: '9px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>
              ❌ შეცდომები {due.length ? `(${due.length})` : ''}
            </button>
            <button onClick={() => setMode('review')} style={{ borderRadius: 12, padding: '9px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>
              🔁 SRS Review
            </button>
          </div>
        </section>

        <div style={{ color: C.ts, fontSize: 12, marginBottom: 10 }}>
          📖 {seen} ნანახი · ✅ {correct} სწორი · ❌ {wrong} შეცდომა · 🏅 {achievements.length} achievement
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {visibleCategories.map(category => (
            <section key={category.cat} style={gls({ padding: 14 })}>
              <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>{category.icon} {category.cat}</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {category.topics.map(topic => {
                  const id = keyOf(lang, category.cat, topic.title)
                  const row = progress[id]
                  return (
                    <button
                      key={topic.title}
                      onClick={() => openTopic(category, topic)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 2, padding: 14, borderRadius: 12, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong>{topic.title}</strong>
                        <span style={{ color: C.a }}>{row?.mastery || 0}%</span>
                      </div>
                      <div style={{ color: C.ts, fontSize: 12, marginTop: 5, lineHeight: 1.6 }}>{topicSummary(topic)}</div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </GrammarErrorBoundary>
  )
}
