import { useEffect, useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import GR from '../data/grammar.js'
import A1 from '../data/grammarA1.js'
import { getGrammarExercises } from '../data/grammarExercises.js'
import { getNextInterval, getNextReviewDate } from '../data/grammarReview.js'
import GrammarErrorBoundary from '../components/GrammarErrorBoundary.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import GrammarTopicCard from '../components/grammar/GrammarTopicCard.jsx'
import GrammarTopicPanel from '../components/grammar/GrammarTopicPanel.jsx'
import GrammarDiagnosticScreen from './GrammarDiagnosticScreen.jsx'
import GrammarAnalyticsScreen from './GrammarAnalyticsScreen.jsx'
import GrammarReviewScreen from './GrammarReviewScreen.jsx'
import GrammarMistakesScreen from './GrammarMistakesScreen.jsx'
import GrammarRoadmapScreen from './GrammarRoadmapScreen.jsx'
import GrammarPracticeModesScreen from './GrammarPracticeModesScreen.jsx'
import GrammarProgressReportScreen from './GrammarProgressReportScreen.jsx'
import { buildGrammarAnalytics, buildGrammarRoadmap, normalizeGrammarText, topicKey, topicSummary } from '../data/grammarInsights.js'

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

function StatGrid({ items, C, gls }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
      {items.map(item => <GrammarMetricCard key={item.label} {...item} C={C} gls={gls} />)}
    </div>
  )
}

function SectionCard({ title, children, C, gls }) {
  return (
    <section style={gls({ padding: 16, marginBottom: 12 })}>
      <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>{title}</h2>
      {children}
    </section>
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
  const [mode, setMode] = useState('dashboard')
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [progress, setProgress] = useState({})
  const [bookmarks, setBookmarks] = useState(new Set())
  const [notes, setNotes] = useState({})
  const [mistakes, setMistakes] = useState([])
  const [sessions, setSessions] = useState([])
  const [due, setDue] = useState([])
  const [achievements, setAchievements] = useState([])
  const [challenge, setChallenge] = useState({ target: 5, completed: 0 })
  const [reloadKey, setReloadKey] = useState(0)

  const topicIndex = useMemo(() => {
    const map = new Map()
    categories.forEach(category => {
      (category.topics || []).forEach(topic => {
        map.set(topicKey(lang, category.cat, topic.title), { category, topic })
      })
    })
    return map
  }, [categories, lang])

  const analytics = useMemo(() => buildGrammarAnalytics({ categories, progress, due, sessions, mistakes, lang }), [categories, progress, due, sessions, mistakes, lang])
  const roadmap = useMemo(() => buildGrammarRoadmap({ categories, progress, lang }), [categories, progress, lang])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError) setError(authError.message)
      if (!user) { setUserId(null); setLoading(false); return }
      setUserId(user.id)
      const [progressRes, bookmarksRes, notesRes, mistakesRes, sessionsRes, dueRes, achievementsRes, challengeRes] = await Promise.all([
        supabase.from('grammar_progress').select('*').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_bookmarks').select('category,topic').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_notes').select('category,topic,note').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_mistakes').select('*').eq('user_id', user.id).eq('lang', lang).order('updated_at', { ascending: false }).limit(50),
        supabase.from('grammar_sessions').select('*').eq('user_id', user.id).eq('lang', lang).order('completed_at', { ascending: false }).limit(10),
        supabase.from('grammar_mistakes').select('*').eq('user_id', user.id).eq('lang', lang).lte('next_review_at', new Date().toISOString()).order('next_review_at').limit(50),
        supabase.from('grammar_achievements').select('achievement_id').eq('user_id', user.id),
        supabase.from('grammar_daily_challenges').select('*').eq('user_id', user.id).eq('challenge_date', new Date().toISOString().slice(0, 10)).maybeSingle(),
      ])
      if (!active) return
      const firstError = progressRes.error || bookmarksRes.error || notesRes.error || mistakesRes.error || sessionsRes.error || dueRes.error || achievementsRes.error || challengeRes.error
      if (firstError) setError(firstError.message)
      const progressMap = {}
      ;(progressRes.data || []).forEach(row => { progressMap[topicKey(lang, row.category, row.topic)] = row })
      const noteMap = {}
      ;(notesRes.data || []).forEach(row => { noteMap[topicKey(lang, row.category, row.topic)] = row.note })
      setProgress(progressMap)
      setBookmarks(new Set((bookmarksRes.data || []).map(row => topicKey(lang, row.category, row.topic))))
      setNotes(noteMap)
      setMistakes(mistakesRes.data || [])
      setSessions(sessionsRes.data || [])
      setDue(dueRes.data || [])
      setAchievements((achievementsRes.data || []).map(row => row.achievement_id))
      setChallenge(challengeRes.data || { target: 5, completed: 0 })
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [lang, reloadKey])

  const rows = Object.values(progress)
  const seen = rows.filter(row => (row.times_viewed || 0) > 0).length
  const total = rows.reduce((sum, row) => sum + (row.correct_count || 0) + (row.wrong_count || 0), 0)
  const correct = rows.reduce((sum, row) => sum + (row.correct_count || 0), 0)
  const wrong = rows.reduce((sum, row) => sum + (row.wrong_count || 0), 0)

  const saveProgress = async (category, topicTitle, patch = {}) => {
    if (!userId) return
    const id = topicKey(lang, category.cat, topicTitle)
    const prev = progress[id] || {}
    const isAnswer = patch.answer !== undefined
    const correctCount = (prev.correct_count || 0) + (isAnswer && patch.answer?.correct ? 1 : 0)
    const wrongCount = (prev.wrong_count || 0) + (isAnswer && !patch.answer?.correct ? 1 : 0)
    const answeredTotal = correctCount + wrongCount
    const mastery = patch.mastery ?? (answeredTotal ? Math.min(100, Math.round((correctCount / answeredTotal) * 100)) : (prev.mastery || 0))
    const status = patch.status || (mastery >= 100 ? 'mastered' : mastery >= 50 ? 'review' : prev.status || (patch.view ? 'learning' : 'new'))
    const row = { user_id: userId, lang, category: category.cat, topic: topicTitle, status, mastery, times_viewed: (prev.times_viewed || 0) + (patch.view ? 1 : 0), correct_count: correctCount, wrong_count: wrongCount, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    setProgress(prevMap => ({ ...prevMap, [id]: row }))
    const { error: progressError } = await supabase.from('grammar_progress').upsert(row, { onConflict: 'user_id,lang,category,topic' })
    if (progressError) setError(progressError.message)

    if (!isAnswer) return
    const exercise = patch.answer.exercise
    if (!patch.answer.correct) {
      const { data: existing } = await supabase.from('grammar_mistakes').select('id,mistake_count,review_count').match({ user_id: userId, lang, category: category.cat, topic: topicTitle, exercise_id: exercise.id }).maybeSingle()
      const nextMistakeCount = (existing?.mistake_count || 0) + 1
      const nextReviewAt = getNextReviewDate(getNextInterval(existing?.review_count || 0, false))
      const mistakeRow = { user_id: userId, lang, category: category.cat, topic: topicTitle, exercise_id: exercise.id, exercise_type: exercise.type || 'multiple_choice', question: exercise.question, user_answer: patch.answer.userAnswer, correct_answer: exercise.answer, explanation: exercise.explanation, mistake_count: nextMistakeCount, review_count: 0, next_review_at: nextReviewAt, last_answered_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      const { error: mistakeError } = await supabase.from('grammar_mistakes').upsert(mistakeRow, { onConflict: 'user_id,lang,topic,exercise_id' })
      if (mistakeError) setError(mistakeError.message)
    }

    const today = new Date().toISOString().slice(0, 10)
    const nextCompleted = Math.min(challenge.target || 5, (challenge.completed || 0) + 1)
    setChallenge(prevCh => ({ ...prevCh, completed: nextCompleted }))
    const { error: challengeError } = await supabase.from('grammar_daily_challenges').upsert({ user_id: userId, challenge_date: today, target: challenge.target || 5, completed: nextCompleted, xp: nextCompleted * 10, completed_at: nextCompleted >= (challenge.target || 5) ? new Date().toISOString() : null }, { onConflict: 'user_id,challenge_date' })
    if (challengeError) setError(challengeError.message)

    const stats = { seen, correct: correctCount, total: answeredTotal, accuracy: answeredTotal ? Math.round((correctCount / answeredTotal) * 100) : 0, mastered: rows.filter(row => (row.mastery || 0) >= 100 || row.status === 'mastered').length }
    for (const [achievementId, , test] of ACHIEVEMENTS) {
      if (!test(stats) || achievements.includes(achievementId)) continue
      const { error: achievementError } = await supabase.from('grammar_achievements').upsert({ user_id: userId, achievement_id: achievementId }, { onConflict: 'user_id,achievement_id' })
      if (!achievementError) setAchievements(prev => [...prev, achievementId])
    }
  }

  const saveNote = async (category, topicTitle, note) => {
    if (!userId) return
    const id = topicKey(lang, category.cat, topicTitle)
    const clean = note.trim()
    setNotes(prev => ({ ...prev, [id]: clean }))
    if (!clean) {
      const { error } = await supabase.from('grammar_notes').delete().match({ user_id: userId, lang, category: category.cat, topic: topicTitle })
      if (error) setError(error.message)
      return
    }
    const { error } = await supabase.from('grammar_notes').upsert({ user_id: userId, lang, category: category.cat, topic: topicTitle, note: clean, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lang,category,topic' })
    if (error) setError(error.message)
  }

  const toggleBookmark = async (category, topicTitle) => {
    if (!userId) return
    const id = topicKey(lang, category.cat, topicTitle)
    const exists = bookmarks.has(id)
    setBookmarks(prev => { const next = new Set(prev); exists ? next.delete(id) : next.add(id); return next })
    const result = exists ? await supabase.from('grammar_bookmarks').delete().match({ user_id: userId, lang, category: category.cat, topic: topicTitle }) : await supabase.from('grammar_bookmarks').insert({ user_id: userId, lang, category: category.cat, topic: topicTitle })
    if (result.error) setError(result.error.message)
  }

  const resolveTopic = (categoryOrName, topicOrTitle) => {
    const categoryObj = typeof categoryOrName === 'string' ? categories.find(c => c.cat === categoryOrName) : categoryOrName
    const topicTitle = typeof topicOrTitle === 'string' ? topicOrTitle : topicOrTitle?.title
    const topicObj = categoryObj ? (categoryObj.topics || []).find(t => t.title === topicTitle) : null
    return { category: categoryObj, topic: topicObj, topicTitle }
  }

  const openTopic = (categoryOrName, topicOrTitle) => {
    const { category, topic, topicTitle } = resolveTopic(categoryOrName, topicOrTitle)
    if (!category || !topicTitle) return
    void saveProgress(category, topicTitle, { view: true })
    setSelected({ category, topicTitle })
    setMode('topic')
  }

  const backToDashboard = () => {
    setSelected(null)
    setMode('dashboard')
    setReloadKey(v => v + 1)
  }

  const visibleCategories = useMemo(() => {
    const q = normalizeGrammarText(query)
    return categories.map(category => ({
      ...category,
      topics: (category.topics || []).filter(topic => {
        const id = topicKey(lang, category.cat, topic.title)
        const row = progress[id]
        const hay = normalizeGrammarText(`${category.cat} ${topic.title} ${topic.body} ${(topic.ex || []).join(' ')}`)
        const matchesQuery = !q || hay.includes(q)
        const matchesFilter = filter === 'all' || (filter === 'bookmarks' && bookmarks.has(id)) || (filter === 'mastered' && (row?.mastery || 0) >= 100) || (filter === 'learning' && row && row.status !== 'new')
        return matchesQuery && matchesFilter
      }),
    })).filter(category => category.topics.length > 0)
  }, [categories, query, filter, progress, bookmarks, lang])

  if (loading) return <div style={{ padding: 20, color: C.ts }}>გრამატიკის მონაცემები იტვირთება...</div>
  if (!userId) return <div style={{ padding: 20, color: C.ts, lineHeight: 1.8 }}>🔐 გრამატიკის პროგრესის, ფავორიტებისა და ჩანაწერების შესანახად ავტორიზაცია საჭიროა.</div>

  if (mode === 'diagnostic') {
    return <GrammarErrorBoundary C={C}><GrammarDiagnosticScreen lang={lang} onBack={backToDashboard} onDone={() => { setReloadKey(v => v + 1); setMode('report') }} /></GrammarErrorBoundary>
  }
  if (mode === 'analytics') {
    return <GrammarErrorBoundary C={C}><GrammarAnalyticsScreen lang={lang} analytics={analytics} onBack={backToDashboard} onOpenDiagnostic={() => setMode('diagnostic')} onOpenMistakes={() => setMode('mistakes')} onOpenReview={() => setMode('review')} onOpenRoadmap={() => setMode('roadmap')} onOpenPractice={() => setMode('practice')} onOpenReport={() => setMode('report')} /></GrammarErrorBoundary>
  }
  if (mode === 'roadmap') {
    return <GrammarErrorBoundary C={C}><GrammarRoadmapScreen lang={lang} categories={categories} progress={progress} onBack={backToDashboard} onOpenTopic={openTopic} /></GrammarErrorBoundary>
  }
  if (mode === 'practice') {
    return <GrammarErrorBoundary C={C}><GrammarPracticeModesScreen lang={lang} categories={categories} progress={progress} due={due} onBack={backToDashboard} onOpenTopic={openTopic} onStartReview={() => setMode('review')} /></GrammarErrorBoundary>
  }
  if (mode === 'report') {
    return <GrammarErrorBoundary C={C}><GrammarProgressReportScreen lang={lang} analytics={analytics} onBack={backToDashboard} onOpenRoadmap={() => setMode('roadmap')} onOpenDiagnostics={() => setMode('diagnostic')} /></GrammarErrorBoundary>
  }
  if (mode === 'review') {
    return <GrammarErrorBoundary C={C}><GrammarReviewScreen lang={lang} onBack={backToDashboard} /></GrammarErrorBoundary>
  }
  if (mode === 'mistakes') {
    return <GrammarErrorBoundary C={C}><GrammarMistakesScreen lang={lang} onBack={backToDashboard} onReview={() => setMode('review')} /></GrammarErrorBoundary>
  }
  if (mode === 'topic' && selected?.category && selected?.topicTitle) {
    const id = topicKey(lang, selected.category.cat, selected.topicTitle)
    const topic = selected.category.topics.find(t => t.title === selected.topicTitle)
    return <GrammarErrorBoundary C={C}><GrammarTopicPanel lang={lang} category={selected.category} topic={topic} progress={progress[id]} bookmarked={bookmarks.has(id)} note={notes[id] || ''} onBack={backToDashboard} onBookmark={() => toggleBookmark(selected.category, selected.topicTitle)} onSaveNote={noteValue => saveNote(selected.category, selected.topicTitle, noteValue)} onUpdateStatus={status => saveProgress(selected.category, selected.topicTitle, { status })} onAnswered={payload => saveProgress(selected.category, selected.topicTitle, { answer: payload })} onOpenTopic={openTopic} /></GrammarErrorBoundary>
  }

  return (
    <GrammarErrorBoundary C={C}>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: C.t, fontWeight: 900, fontSize: 25 }}>📖 გრამატიკა 3.0</div>
          <div style={{ color: C.ts, fontSize: 13, marginTop: 5, lineHeight: 1.7 }}>{LANG[lang]?.flag} {LANG[lang]?.name} · Learn → Practice → Mistakes → SRS → Mastery</div>
        </div>

        {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: `${C.r}14`, border: `1px solid ${C.r}55`, color: C.r, lineHeight: 1.6 }}>⚠️ Backend შეცდომა: {error}<br /><small>თუ ეს არის RLS ან relation შეცდომა, გაუშვი <b>supabase/migrations/grammar_3_0.sql</b> Supabase SQL Editor-ში. სრული schema.sql თავიდან არ გაუშვა.</small></div>}

        <StatGrid
          C={C}
          gls={gls}
          items={[
            { icon: '📚', label: 'თემები', value: analytics.totalTopics },
            { icon: '📈', label: 'საშუალო mastery', value: `${analytics.averageMastery}%` },
            { icon: '🏆', label: 'ათვისებული', value: analytics.mastered },
            { icon: '🎯', label: 'სიზუსტე', value: `${analytics.accuracy}%` },
          ]}
        />

        <SectionCard title="📅 დღევანდელი Challenge" C={C} gls={gls}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: C.ts }}><span>Daily goal</span><strong style={{ color: C.a }}>{challenge.completed || 0}/{challenge.target || 5}</strong></div>
          <div style={{ height: 8, background: C.card3, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, ((challenge.completed || 0) / (challenge.target || 5)) * 100)}%`, height: '100%', background: C.g, borderRadius: 99 }} /></div>
          <div style={{ color: C.ts, fontSize: 12, marginTop: 7 }}>+{(challenge.completed || 0) * 10} XP · {due.length} SRS review due</div>
        </SectionCard>

        <SectionCard title="⚡ Grammar phases" C={C} gls={gls}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
              <button onClick={() => setMode('diagnostic')} style={{ borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>🧭 Diagnostic</button>
              <button onClick={() => setMode('analytics')} style={{ borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>📊 Analytics</button>
              <button onClick={() => setMode('roadmap')} style={{ borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>🧭 Roadmap</button>
              <button onClick={() => setMode('practice')} style={{ borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>🎛️ Practice modes</button>
              <button onClick={() => setMode('report')} style={{ borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>📈 Report</button>
              <button onClick={() => setMode('review')} style={{ borderRadius: 12, padding: '10px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>🔁 Review</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setMode('mistakes')} style={{ borderRadius: 12, padding: '9px 12px', border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}>❌ Mistakes {due.length ? `(${due.length})` : ''}</button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="🔎 Search and filter" C={C} gls={gls}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔎 მოძებნე გრამატიკული თემა..." style={{ width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 12, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {[['all', 'ყველა'], ['learning', 'ვწავლობ'], ['mastered', 'ათვისებული'], ['bookmarks', 'რჩეულები']].map(([key, label]) => <button key={key} onClick={() => setFilter(key)} style={{ borderRadius: 99, padding: '8px 12px', border: `1px solid ${filter === key ? C.a : C.bdL}`, background: filter === key ? `${C.a}18` : C.card3, color: filter === key ? C.a : C.ts, fontFamily: 'inherit' }}>{label}</button>)}
          </div>
        </SectionCard>

        <div style={{ color: C.ts, fontSize: 12, marginBottom: 10 }}>📖 {seen} ნანახი · ✅ {correct} სწორი · ❌ {wrong} შეცდომა · 🏅 {achievements.length} achievement</div>

        <div style={{ display: 'grid', gap: 12 }}>
          {visibleCategories.map(category => (
            <section key={category.cat} style={gls({ padding: 14 })}>
              <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>{category.icon} {category.cat}</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {category.topics.map(topic => {
                  const id = topicKey(lang, category.cat, topic.title)
                  const row = progress[id]
                  return (
                    <GrammarTopicCard
                      key={topic.title}
                      title={topic.title}
                      subtitle={topicSummary(topic)}
                      mastery={row?.mastery || 0}
                      onClick={() => openTopic(category, topic.title)}
                      C={C}
                    />
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
