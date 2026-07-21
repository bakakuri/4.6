import { useEffect, useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import GR from '../data/grammar.js'
import { getGrammarExercises } from '../data/grammarExercises.js'

const STATUS = {
  new: { label: 'ახალი', icon: '⚪' },
  learning: { label: 'ვწავლობ', icon: '🔵' },
  review: { label: 'გამეორება', icon: '🟡' },
  mastered: { label: 'ათვისებული', icon: '🟢' },
}

function normalize(text = '') {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function keyOf(lang, category, topic) {
  return `${lang}::${category}::${topic}`
}

function topicSummary(topic) {
  const source = topic?.ex?.[0] || topic?.body || ''
  return source.split('\n').map(line => line.replace(/^\*\*|\*\*$/g, '').replace(/^•\s*/, '').trim()).find(Boolean)?.slice(0, 150) || 'გრამატიკული წესები, ახსნა და მაგალითები.'
}

function renderInline(text, C) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index} style={{ color: C.t }}>{part.slice(2, -2)}</strong> : part)
}

function renderBody(body = '', C) {
  return body.split('\n').map((line, index) => {
    const text = line.trim()
    if (!text) return <div key={index} style={{ height: 8 }} />
    if (/^\*\*.*\*\*$/.test(text)) return <h3 key={index} style={{ color: C.t, fontSize: 16, margin: '16px 0 6px' }}>{text.replace(/\*\*/g, '')}</h3>
    if (/^(⚠️|✅|💡)/.test(text)) {
      const tone = text.startsWith('⚠️') ? C.o : text.startsWith('✅') ? C.g : C.a
      return <div key={index} style={{ borderLeft: `3px solid ${tone}`, background: C.card3, borderRadius: 10, padding: '10px 12px', margin: '8px 0', color: C.ts, lineHeight: 1.7, fontSize: 14 }}>{renderInline(text, C)}</div>
    }
    if (text.startsWith('•')) return <div key={index} style={{ display: 'flex', gap: 10, color: C.ts, fontSize: 14, lineHeight: 1.7, marginBottom: 5 }}><span style={{ color: C.a }}>•</span><span>{renderInline(text.replace(/^•\s*/, ''), C)}</span></div>
    return <p key={index} style={{ color: C.ts, fontSize: 14, lineHeight: 1.8, margin: '5px 0' }}>{renderInline(text, C)}</p>
  })
}

function StatCard({ icon, label, value, C, gls }) {
  return <div style={gls({ padding: 14 })}><div style={{ color: C.ts, fontSize: 12, marginBottom: 7 }}>{icon} {label}</div><div style={{ color: C.t, fontWeight: 900, fontSize: 23 }}>{value}</div></div>
}

function PracticePanel({ exercises, progress, onAnswer, C, gls }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const exercise = exercises[index]
  if (!exercise) return <div style={{ color: C.ts }}>ამ თემისთვის სავარჯიშოები ჯერ არ არის დამატებული.</div>

  const answer = value => {
    if (answered) return
    setSelected(value)
    setAnswered(true)
    const correct = value === exercise.answer
    if (correct) setScore(value => value + 1)
    onAnswer(correct)
  }

  const next = () => {
    setIndex(value => (value + 1) % exercises.length)
    setSelected(null)
    setAnswered(false)
  }

  return <section style={gls({ padding: 18 })}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h2 style={{ color: C.t, fontSize: 17, margin: 0 }}>🧪 ინტერაქტიული პრაქტიკა</h2>
      <span style={{ color: C.ts, fontSize: 12 }}>{index + 1}/{exercises.length} · Score {score}</span>
    </div>
    <div style={{ height: 7, background: C.card3, borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}><div style={{ width: `${((index + 1) / exercises.length) * 100}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.g})` }} /></div>
    <div style={{ background: C.card3, borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ color: C.t, fontSize: 18, fontWeight: 800, lineHeight: 1.6 }}>{exercise.question}</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        {exercise.options.map(option => {
          const isCorrect = answered && option === exercise.answer
          const isWrong = answered && option === selected && option !== exercise.answer
          return <button key={option} onClick={() => answer(option)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 11, border: `1px solid ${isCorrect ? C.g : isWrong ? C.r : C.bdL}`, background: isCorrect ? `${C.g}18` : isWrong ? `${C.r}18` : C.card2, color: C.t, cursor: answered ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14 }}>{isCorrect ? '✅ ' : isWrong ? '❌ ' : ''}{option}</button>
        })}
      </div>
    </div>
    {answered && <div style={{ borderLeft: `3px solid ${selected === exercise.answer ? C.g : C.o}`, background: C.card3, borderRadius: 10, padding: 12, color: C.ts, lineHeight: 1.7, fontSize: 14 }}><strong style={{ color: selected === exercise.answer ? C.g : C.o }}>{selected === exercise.answer ? 'სწორია! 🎉' : 'ჯერ არა. ვიმეორებთ. 🧠'}</strong><br />{exercise.explanation}</div>}
    {answered && <button onClick={next} style={{ marginTop: 12, width: '100%', border: 'none', borderRadius: 11, padding: 12, background: C.a, color: '#fff', cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit' }}>შემდეგი კითხვა →</button>}
    <div style={{ color: C.ts, fontSize: 12, marginTop: 12 }}>ამ თემის მიმდინარე სტატისტიკა: {progress?.correct_count || 0} სწორი · {progress?.wrong_count || 0} არასწორი</div>
  </section>
}

function TopicPage({ lang, category, topic, progress, bookmarked, note, onBack, onToggleBookmark, onSaveNote, onUpdateProgress, onOpenTopic, related }) {
  const { C, gls } = useTheme()
  const [noteDraft, setNoteDraft] = useState(note || '')
  const [noteSaving, setNoteSaving] = useState(false)
  const exercises = getGrammarExercises(lang, topic.title)
  useEffect(() => setNoteDraft(note || ''), [note])
  const currentStatus = progress?.status || 'new'
  const mastery = progress?.mastery || 0
  const saveNote = async () => { setNoteSaving(true); await onSaveNote(noteDraft); setNoteSaving(false) }

  return <div className="page-enter" style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
    <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 12, padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>← უკან</button>
    <div style={{ ...gls({ padding: 18, marginBottom: 12 }), background: `linear-gradient(135deg,${C.card2},${C.card3})` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}><div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>{LANG[lang]?.flag} {category.cat}</div><h1 style={{ color: C.t, fontSize: 24, lineHeight: 1.2, margin: 0 }}>{topic.title}</h1><div style={{ color: C.ts, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>{topicSummary(topic)}</div></div>
        <button onClick={onToggleBookmark} title="რჩეულებში დამატება" style={{ minWidth: 46, minHeight: 46, borderRadius: 14, border: `1px solid ${bookmarked ? C.gold : C.bdL}`, background: bookmarked ? `${C.gold}18` : C.card, color: bookmarked ? C.gold : C.ts, cursor: 'pointer', fontSize: 21 }}>{bookmarked ? '★' : '☆'}</button>
      </div>
      <div style={{ marginTop: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', color: C.ts, fontSize: 12, marginBottom: 6 }}><span>Mastery</span><strong style={{ color: C.a }}>{mastery}%</strong></div><div style={{ height: 8, borderRadius: 999, background: C.card, overflow: 'hidden' }}><div style={{ width: `${mastery}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.g})` }} /></div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>{Object.entries(STATUS).map(([key, item]) => <button key={key} onClick={() => onUpdateProgress({ status: key })} style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${currentStatus === key ? C.a : C.bdL}`, background: currentStatus === key ? `${C.a}18` : C.card, color: currentStatus === key ? C.a : C.ts, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{item.icon} {item.label}</button>)}</div>
    </div>
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={gls({ padding: 18 })}><h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>📘 სრული ახსნა</h2>{renderBody(topic.body, C)}</section>
      {topic.ex?.length > 0 && <section style={gls({ padding: 18 })}><h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>📌 მაგალითები</h2><div style={{ display: 'grid', gap: 8 }}>{topic.ex.map((example, index) => <div key={index} style={{ borderLeft: `3px solid ${C.a}`, background: C.card3, borderRadius: 10, padding: '11px 14px', color: C.t, fontSize: 14, lineHeight: 1.7 }}>{example}</div>)}</div></section>}
      {exercises.length > 0 && <PracticePanel exercises={exercises} progress={progress} onAnswer={correct => onUpdateProgress({ answer: correct })} C={C} gls={gls} />}
      <section style={gls({ padding: 18 })}><h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>🧠 ჩემი ჩანაწერი</h2><textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="ჩაწერე შენი წესი, რთული მაგალითი ან რაც უნდა დაიმახსოვრო..." rows={5} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: 12, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, padding: 12, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} /><button onClick={saveNote} disabled={noteSaving} style={{ marginTop: 10, border: 'none', borderRadius: 11, padding: '10px 14px', background: C.a, color: '#fff', cursor: noteSaving ? 'wait' : 'pointer', fontWeight: 800, fontFamily: 'inherit' }}>{noteSaving ? 'ინახება...' : 'ჩანაწერის შენახვა'}</button></section>
      <section style={gls({ padding: 18 })}><h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>🎯 სწავლის სტატუსი</h2><div style={{ display: 'grid', gap: 8 }}>{[25, 50, 75, 100].map(value => <button key={value} onClick={() => onUpdateProgress({ mastery: value, status: value === 100 ? 'mastered' : value >= 50 ? 'review' : 'learning' })} style={{ textAlign: 'left', padding: 11, borderRadius: 11, border: `1px solid ${mastery === value ? C.a : C.bdL}`, background: mastery === value ? `${C.a}18` : C.card3, color: C.ts, cursor: 'pointer', fontFamily: 'inherit' }}>{value === 25 ? '📖 გავეცანი თემას' : value === 50 ? '🧠 ვვარჯიშობ' : value === 75 ? '🎯 კარგად ვიცი' : '🏆 სრულად ავითვისე'} · {value}%</button>)}</div></section>
      {related.length > 0 && <section style={gls({ padding: 18 })}><h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>🔁 დაკავშირებული თემები</h2><div style={{ display: 'grid', gap: 8 }}>{related.map(item => <button key={item.title} onClick={() => onOpenTopic(item)} style={{ textAlign: 'left', border: `1px solid ${C.bdL}`, background: C.card2, borderRadius: 12, padding: 13, cursor: 'pointer', fontFamily: 'inherit' }}><div style={{ color: C.t, fontWeight: 800 }}>{item.title}</div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{topicSummary(item)}</div></button>)}</div></section>}
    </div>
  </div>
}

export default function GrammarScreen({ lang }) {
  const { C, gls } = useTheme()
  const categories = GR[lang] || GR.english || []
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [progress, setProgress] = useState({})
  const [bookmarks, setBookmarks] = useState(new Set())
  const [notes, setNotes] = useState({})

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError) { setError(authError.message); setLoading(false); return }
      if (!user) { setUserId(null); setLoading(false); return }
      setUserId(user.id)
      const [progressRes, bookmarksRes, notesRes] = await Promise.all([
        supabase.from('grammar_progress').select('*').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_bookmarks').select('category,topic').eq('user_id', user.id).eq('lang', lang),
        supabase.from('grammar_notes').select('category,topic,note').eq('user_id', user.id).eq('lang', lang),
      ])
      if (!active) return
      const firstError = progressRes.error || bookmarksRes.error || notesRes.error
      if (firstError) setError(firstError.message)
      const progressMap = {}; (progressRes.data || []).forEach(row => { progressMap[keyOf(lang, row.category, row.topic)] = row })
      const bookmarkSet = new Set((bookmarksRes.data || []).map(row => keyOf(lang, row.category, row.topic)))
      const notesMap = {}; (notesRes.data || []).forEach(row => { notesMap[keyOf(lang, row.category, row.topic)] = row.note })
      setProgress(progressMap); setBookmarks(bookmarkSet); setNotes(notesMap); setLoading(false)
    }
    load(); return () => { active = false }
  }, [lang])

  const allTopics = useMemo(() => categories.flatMap(category => (category.topics || []).map(topic => ({ category, topic }))), [categories])
  const totalTopics = allTopics.length
  const progressRows = Object.values(progress)
  const seenCount = progressRows.filter(row => (row.times_viewed || 0) > 0).length
  const masteredCount = progressRows.filter(row => row.status === 'mastered' || row.mastery >= 100).length
  const averageMastery = totalTopics ? Math.round(progressRows.reduce((sum, row) => sum + (row.mastery || 0), 0) / totalTopics) : 0
  const totalCorrect = progressRows.reduce((sum, row) => sum + (row.correct_count || 0), 0)
  const totalWrong = progressRows.reduce((sum, row) => sum + (row.wrong_count || 0), 0)
  const accuracy = totalCorrect + totalWrong ? Math.round(totalCorrect / (totalCorrect + totalWrong) * 100) : 0

  const visibleCategories = useMemo(() => {
    const q = normalize(query.trim())
    return categories.map(category => ({ ...category, topics: (category.topics || []).filter(topic => {
      const id = keyOf(lang, category.cat, topic.title); const haystack = normalize([category.cat, topic.title, topic.body, ...(topic.ex || [])].join(' ')); const row = progress[id]
      const matchesQuery = !q || haystack.includes(q)
      const matchesFilter = filter === 'all' || (filter === 'bookmarks' && bookmarks.has(id)) || (filter === 'mastered' && (row?.mastery || 0) >= 100) || (filter === 'learning' && row && row.status !== 'new')
      return matchesQuery && matchesFilter
    }) })).filter(category => category.topics.length > 0)
  }, [categories, lang, query, filter, progress, bookmarks])

  const updateProgress = async (category, topic, patch) => {
    if (!userId) return
    const id = keyOf(lang, category.cat, topic.title); const previous = progress[id] || {}
    const correct = patch.answer === true; const wrong = patch.answer === false
    const correctCount = (previous.correct_count || 0) + (correct ? 1 : 0); const wrongCount = (previous.wrong_count || 0) + (wrong ? 1 : 0)
    const total = correctCount + wrongCount; const accuracyScore = total ? Math.round(correctCount / total * 100) : 0
    const autoMastery = patch.answer !== undefined ? Math.max(previous.mastery || 0, Math.min(100, accuracyScore)) : (patch.mastery ?? previous.mastery ?? 0)
    const row = { user_id: userId, lang, category: category.cat, topic: topic.title, status: patch.status || (autoMastery >= 100 ? 'mastered' : autoMastery >= 50 ? 'review' : previous.status || 'learning'), mastery: autoMastery, times_viewed: (previous.times_viewed || 0) + (patch.incrementView ? 1 : 0), correct_count: correctCount, wrong_count: wrongCount, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    setProgress(prev => ({ ...prev, [id]: row }))
    const { error: saveError } = await supabase.from('grammar_progress').upsert(row, { onConflict: 'user_id,lang,category,topic' })
    if (saveError) setError(saveError.message)
  }

  const openTopic = async (category, topic) => { setSelectedCategory(category); setSelectedTopic(topic); await updateProgress(category, topic, { incrementView: true }) }
  const toggleBookmark = async (category, topic) => {
    if (!userId) return
    const id = keyOf(lang, category.cat, topic.title); const exists = bookmarks.has(id)
    setBookmarks(prev => { const next = new Set(prev); exists ? next.delete(id) : next.add(id); return next })
    const result = exists ? await supabase.from('grammar_bookmarks').delete().match({ user_id: userId, lang, category: category.cat, topic: topic.title }) : await supabase.from('grammar_bookmarks').insert({ user_id: userId, lang, category: category.cat, topic: topic.title })
    if (result.error) setError(result.error.message)
  }
  const saveNote = async (category, topic, note) => {
    if (!userId) return
    const id = keyOf(lang, category.cat, topic.title); const clean = note.trim(); setNotes(prev => ({ ...prev, [id]: clean }))
    const result = clean ? await supabase.from('grammar_notes').upsert({ user_id: userId, lang, category: category.cat, topic: topic.title, note: clean, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lang,category,topic' }) : await supabase.from('grammar_notes').delete().match({ user_id: userId, lang, category: category.cat, topic: topic.title })
    if (result.error) setError(result.error.message)
  }

  if (loading) return <div style={{ padding: 20, color: C.ts }}>გრამატიკის მონაცემები იტვირთება...</div>
  if (!userId) return <div style={{ padding: 20, color: C.ts, lineHeight: 1.8 }}>🔐 გრამატიკის პროგრესის, ფავორიტებისა და ჩანაწერების შესანახად ავტორიზაცია საჭიროა.</div>
  if (selectedCategory && selectedTopic) {
    const id = keyOf(lang, selectedCategory.cat, selectedTopic.title); const related = (selectedCategory.topics || []).filter(item => item.title !== selectedTopic.title).slice(0, 5)
    return <TopicPage lang={lang} category={selectedCategory} topic={selectedTopic} progress={progress[id]} bookmarked={bookmarks.has(id)} note={notes[id] || ''} onBack={() => setSelectedTopic(null)} onToggleBookmark={() => toggleBookmark(selectedCategory, selectedTopic)} onSaveNote={note => saveNote(selectedCategory, selectedTopic, note)} onUpdateProgress={patch => updateProgress(selectedCategory, selectedTopic, patch)} onOpenTopic={topic => openTopic(selectedCategory, topic)} related={related} />
  }

  return <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
    <div style={{ marginBottom: 18 }}><div style={{ color: C.t, fontWeight: 900, fontSize: 25 }}>📖 გრამატიკა 2.0</div><div style={{ color: C.ts, fontSize: 13, marginTop: 5, lineHeight: 1.7 }}>{LANG[lang]?.flag} {LANG[lang]?.name} · ახსნა + პრაქტიკა + ავტომატური პროგრესი</div></div>
    {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: `${C.r}14`, border: `1px solid ${C.r}55`, color: C.r, fontSize: 13, lineHeight: 1.6 }}>⚠️ Backend შეცდომა: {error}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}><StatCard icon="📚" label="თემები" value={totalTopics} C={C} gls={gls} /><StatCard icon="📈" label="საშუალო mastery" value={`${averageMastery}%`} C={C} gls={gls} /><StatCard icon="🏆" label="ათვისებული" value={masteredCount} C={C} gls={gls} /><StatCard icon="🎯" label="სიზუსტე" value={`${accuracy}%`} C={C} gls={gls} /></div>
    <div style={{ ...gls({ padding: 14, marginBottom: 12 }) }}><div style={{ display: 'flex', justifyContent: 'space-between', color: C.ts, fontSize: 12, marginBottom: 7 }}><span>საერთო პროგრესი</span><strong style={{ color: C.a }}>{averageMastery}%</strong></div><div style={{ height: 8, borderRadius: 999, background: C.card3, overflow: 'hidden' }}><div style={{ width: `${averageMastery}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.g})` }} /></div><div style={{ color: C.ts, fontSize: 12, marginTop: 8 }}>{seenCount} თემას უკვე გაეცანი · {totalCorrect} სწორი პასუხი · {totalWrong} შეცდომა</div></div>
    <div style={{ ...gls({ padding: 14, marginBottom: 12 }) }}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔎 მოძებნე გრამატიკული თემა..." style={{ width: '100%', boxSizing: 'border-box', borderRadius: 13, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, padding: '13px 14px', fontFamily: 'inherit', fontSize: 14, outline: 'none' }} /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{[['all', 'ყველა'], ['learning', 'ვწავლობ'], ['mastered', 'ათვისებული'], ['bookmarks', 'რჩეულები']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} style={{ border: `1px solid ${filter === value ? C.a : C.bdL}`, background: filter === value ? `${C.a}18` : C.card3, color: filter === value ? C.a : C.ts, borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{label}</button>)}</div></div>
    <div style={{ display: 'grid', gap: 12 }}>{visibleCategories.map(category => { const categorySeen = category.topics.filter(topic => (progress[keyOf(lang, category.cat, topic.title)]?.times_viewed || 0) > 0).length; return <section key={category.cat} style={gls({ padding: 16 })}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><span style={{ fontSize: 30 }}>{category.icon}</span><div style={{ flex: 1 }}><div style={{ color: C.t, fontWeight: 900, fontSize: 17 }}>{category.cat}</div><div style={{ color: C.ts, fontSize: 12, marginTop: 3 }}>{categorySeen}/{category.topics.length} ნანახი</div></div></div><div style={{ display: 'grid', gap: 8 }}>{category.topics.map(topic => { const id = keyOf(lang, category.cat, topic.title); const row = progress[id]; return <button key={topic.title} onClick={() => openTopic(category, topic)} style={{ textAlign: 'left', border: `1px solid ${C.bdL}`, background: C.card2, borderRadius: 12, padding: 13, cursor: 'pointer', fontFamily: 'inherit' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ color: C.t, fontWeight: 800 }}>{topic.title}</div><span style={{ color: row?.mastery >= 100 ? C.g : C.ts, fontSize: 12 }}>{row?.mastery || 0}%</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 5, lineHeight: 1.6 }}>{topicSummary(topic)}</div></button> })}</div></section> })}</div>
  </div>
}
