import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import {
  getAllProfiles,
  getSiteStats,
  adminSetXP,
  adminSetStreak,
  adminToggleAdmin,
  adminToggleBlock,
  adminDeleteMessage,
  adminDeleteUserMessages,
  adminBroadcast,
} from '../utils/db.js'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const EX_TYPES = ['multiple_choice', 'fill_blank', 'translation', 'word_order', 'correction']

const EMPTY_TOPIC = { level: 'A1', title: '', description: '', category: '', order_index: 0, is_active: true }
const EMPTY_EX = { topic_id: '', level: 'A1', exercise_type: 'multiple_choice', question: '', options: '[]', correct_answer: '', explanation: '', xp_reward: 5, is_active: true }
const EMPTY_WORD = { word: '', translation: '', article: '', plural: '', phonetic: '', example: '', level: 'A1', image_url: '', is_active: true }
const EMPTY_LESSON = { title: '', level: 'A1', description: '', order_index: 0, is_locked: false }

const jsonText = value => {
  try { return JSON.stringify(value ?? [], null, 2) } catch { return '[]' }
}

const parseJson = value => {
  const text = String(value ?? '').trim()
  if (!text) return []
  try { return JSON.parse(text) } catch { return text }
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return <input type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #dbe1ef)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', outline: 'none' }} />
}

function Button({ children, onClick, danger = false, disabled = false }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ border: danger ? '1px solid rgba(239,68,68,.35)' : 'none', background: danger ? 'rgba(239,68,68,.14)' : 'linear-gradient(135deg,#5d6bff,#a855f7)', color: danger ? '#ef4444' : '#fff', borderRadius: 10, padding: '9px 12px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1, fontWeight: 800, fontFamily: 'inherit', fontSize: 12 }}>{children}</button>
}

function Card({ children, gls }) {
  return <div style={{ ...gls({ padding: 14 }), marginBottom: 12 }}>{children}</div>
}

export default function AdminControlCenter({ user }) {
  const { C, gls } = useTheme()
  const [tab, setTab] = useState('users')
  const [contentTab, setContentTab] = useState('grammar')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [stats, setStats] = useState(null)
  const [messages, setMessages] = useState([])
  const [topics, setTopics] = useState([])
  const [exercises, setExercises] = useState([])
  const [words, setWords] = useState([])
  const [lessons, setLessons] = useState([])
  const [settings, setSettings] = useState([])
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [contentSearch, setContentSearch] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [broadcast, setBroadcast] = useState('')
  const [topicForm, setTopicForm] = useState(EMPTY_TOPIC)
  const [exerciseForm, setExerciseForm] = useState(EMPTY_EX)
  const [wordForm, setWordForm] = useState(EMPTY_WORD)
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON)
  const [editing, setEditing] = useState(null)

  const notify = (message, error = false) => {
    setToast(message)
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setToast(''), 2800)
    if (error) console.error(message)
  }

  const audit = useCallback(async (action, entityType, entityId, details = {}) => {
    if (!user?.id) return
    const { error } = await supabase.from('admin_audit_log').insert({ admin_id: user.id, action, entity_type: entityType, entity_id: entityId, details })
    if (error) console.error('Audit log error:', error)
  }, [user?.id])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profilesResult, statsResult, messagesResult, topicsResult, exercisesResult, wordsResult, lessonsResult, settingsResult, logsResult] = await Promise.all([
        getAllProfiles(),
        getSiteStats(),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('grammar_topics').select('*').order('level').order('order_index'),
        supabase.from('grammar_exercises').select('*').order('created_at', { ascending: false }),
        supabase.from('vocabulary_items').select('*').order('level').order('created_at', { ascending: false }),
        supabase.from('lessons').select('*').order('level').order('order_index'),
        supabase.from('site_settings').select('*').order('key'),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      ])
      setProfiles(profilesResult || [])
      setStats(statsResult || null)
      setMessages(messagesResult.data || [])
      setTopics(topicsResult.data || [])
      setExercises(exercisesResult.data || [])
      setWords(wordsResult.data || [])
      setLessons(lessonsResult.data || [])
      setSettings(settingsResult.data || [])
      setLogs(logsResult.data || [])
      const firstError = messagesResult.error || topicsResult.error || exercisesResult.error || wordsResult.error || lessonsResult.error || settingsResult.error || logsResult.error
      if (firstError) notify(firstError.message, true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredProfiles = useMemo(() => profiles.filter(p => !search || String(p.username || '').toLowerCase().includes(search.toLowerCase())), [profiles, search])
  const filteredMessages = useMemo(() => messages.filter(m => !search || `${m.username || ''} ${m.text || ''}`.toLowerCase().includes(search.toLowerCase())), [messages, search])
  const filteredTopics = useMemo(() => topics.filter(t => `${t.level} ${t.title} ${t.category || ''} ${t.description || ''}`.toLowerCase().includes(contentSearch.toLowerCase())), [topics, contentSearch])
  const filteredExercises = useMemo(() => exercises.filter(e => `${e.level} ${e.exercise_type} ${e.question} ${e.correct_answer}`.toLowerCase().includes(contentSearch.toLowerCase())), [exercises, contentSearch])
  const filteredWords = useMemo(() => words.filter(w => `${w.level} ${w.word} ${w.translation}`.toLowerCase().includes(contentSearch.toLowerCase())), [words, contentSearch])
  const filteredLessons = useMemo(() => lessons.filter(l => `${l.level} ${l.title} ${l.description || ''}`.toLowerCase().includes(contentSearch.toLowerCase())), [lessons, contentSearch])
  const filteredLogs = useMemo(() => logs.filter(l => `${l.action} ${l.entity_type || ''} ${l.entity_id || ''} ${JSON.stringify(l.details || {})}`.toLowerCase().includes(logSearch.toLowerCase())), [logs, logSearch])

  const run = async (fn, success = 'შენახულია') => {
    setSaving(true)
    try { await fn(); notify(success); await load() } catch (error) { notify(error.message || 'შეცდომა', true) } finally { setSaving(false) }
  }

  const saveTopic = () => run(async () => {
    const payload = { ...topicForm, order_index: Number(topicForm.order_index || 0), updated_at: new Date().toISOString() }
    if (editing?.type === 'topic') await supabase.from('grammar_topics').update(payload).eq('id', editing.id)
    else await supabase.from('grammar_topics').insert(payload)
    await audit(editing ? 'update_grammar_topic' : 'create_grammar_topic', 'grammar_topic', editing?.id || null, payload)
    setTopicForm(EMPTY_TOPIC); setEditing(null)
  })

  const saveExercise = () => run(async () => {
    const payload = { ...exerciseForm, options: parseJson(exerciseForm.options), xp_reward: Number(exerciseForm.xp_reward || 5) }
    delete payload.optionsText
    if (editing?.type === 'exercise') await supabase.from('grammar_exercises').update(payload).eq('id', editing.id)
    else await supabase.from('grammar_exercises').insert(payload)
    await audit(editing ? 'update_grammar_exercise' : 'create_grammar_exercise', 'grammar_exercise', editing?.id || null, payload)
    setExerciseForm(EMPTY_EX); setEditing(null)
  })

  const saveWord = () => run(async () => {
    if (editing?.type === 'word') await supabase.from('vocabulary_items').update(wordForm).eq('id', editing.id)
    else await supabase.from('vocabulary_items').insert(wordForm)
    setWordForm(EMPTY_WORD); setEditing(null)
  })

  const saveLesson = () => run(async () => {
    const payload = { ...lessonForm, order_index: Number(lessonForm.order_index || 0) }
    if (editing?.type === 'lesson') await supabase.from('lessons').update(payload).eq('id', editing.id)
    else await supabase.from('lessons').insert(payload)
    setLessonForm(EMPTY_LESSON); setEditing(null)
  })

  const editRow = (type, row) => {
    setEditing({ type, id: row.id })
    if (type === 'topic') setTopicForm({ level: row.level || 'A1', title: row.title || '', description: row.description || '', category: row.category || '', order_index: row.order_index || 0, is_active: row.is_active ?? true })
    if (type === 'exercise') setExerciseForm({ topic_id: row.topic_id || '', level: row.level || 'A1', exercise_type: row.exercise_type || 'multiple_choice', question: row.question || '', options: jsonText(row.options), correct_answer: row.correct_answer || '', explanation: row.explanation || '', xp_reward: row.xp_reward ?? 5, is_active: row.is_active ?? true })
    if (type === 'word') setWordForm({ word: row.word || '', translation: row.translation || '', article: row.article || '', plural: row.plural || '', phonetic: row.phonetic || '', example: row.example || '', level: row.level || 'A1', image_url: row.image_url || '', is_active: row.is_active ?? true })
    if (type === 'lesson') setLessonForm({ title: row.title || '', level: row.level || 'A1', description: row.description || '', order_index: row.order_index || 0, is_locked: row.is_locked ?? false })
  }

  const remove = (table, id, label) => run(async () => { if (!window.confirm(`წაიშალოს ${label}?`)) return; const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error })

  const toggleUser = async (profile, field, fn) => {
    if (profile.id === user?.id) return notify('საკუთარ ანგარიშზე ეს მოქმედება არ შეიძლება', true)
    await fn(profile.id, !profile[field], user?.id)
    await load()
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: C.ts }}>იტვირთება...</div>

  const tabs = [['users', '👥 მომხმარებლები'], ['stats', '📊 სტატისტიკა'], ['chat', '💬 ჩატი'], ['broadcast', '📢 Broadcast'], ['content', '🧩 კონტენტი']]
  const contentTabs = [['grammar', '📚 Grammar'], ['vocabulary', '📝 Vocabulary'], ['lessons', '🎓 Lessons'], ['settings', '⚙️ Settings'], ['logs', '🧾 Logs']]

  return <div className="page-enter" style={{ padding: 14, color: C.t }}>
    {toast && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.a, color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>{toast}</div>}
    <h2 style={{ margin: '0 0 4px' }}>⚙️ ადმინ პანელი</h2>
    <div style={{ color: C.ts, fontSize: 12, marginBottom: 14 }}>👥 {profiles.length} · ⚡ {stats?.totalXP || 0} XP · 💬 {stats?.totalMsgs || 0}</div>
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>{tabs.map(([id, label]) => <Button key={id} onClick={() => setTab(id)}>{label}</Button>)}</div>

    {tab === 'users' && <Card gls={gls}><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 მომხმარებლის ძებნა..." />{filteredProfiles.map(p => <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.bdL}` }}><div><b>{p.username || 'User'}</b><div style={{ fontSize: 11, color: C.ts }}>⚡ {p.xp || 0} XP · 🔥 {p.streak || 0} · {p.is_admin ? 'ADMIN' : 'USER'}</div></div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}><Button disabled={saving} onClick={() => toggleUser(p, 'is_admin', adminToggleAdmin)}>{p.is_admin ? 'Admin−' : 'Admin+'}</Button><Button disabled={saving} onClick={() => toggleUser(p, 'chat_blocked', adminToggleBlock)}>{p.chat_blocked ? 'Unblock' : 'Block'}</Button><Button disabled={saving} onClick={() => adminSetXP(p.id, Number(p.xp || 0) + 100, user?.id).then(load)}>+100 XP</Button></div></div>)}</Card>}

    {tab === 'stats' && <Card gls={gls}><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(stats, null, 2)}</pre></Card>}

    {tab === 'chat' && <Card gls={gls}><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ჩატის ძებნა..." />{filteredMessages.map(m => <div key={m.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}><b>{m.username || 'User'}</b><div>{m.text}</div><Button danger onClick={() => run(() => adminDeleteMessage(m.id, user?.id), 'წაიშალა')}>წაშლა</Button></div>)}</Card>}

    {tab === 'broadcast' && <Card gls={gls}><textarea value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="შეტყობინება..." style={{ width: '100%', minHeight: 120, boxSizing: 'border-box', padding: 12, borderRadius: 10, background: 'transparent', color: 'inherit' }} /><Button onClick={() => run(() => adminBroadcast(broadcast, user?.username || 'Admin', user?.id), 'გაიგზავნა')}>📢 გაგზავნა</Button></Card>}

    {tab === 'content' && <>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>{contentTabs.map(([id, label]) => <Button key={id} onClick={() => setContentTab(id)}>{label}</Button>)}</div>
      <Input value={contentSearch} onChange={e => setContentSearch(e.target.value)} placeholder="🔍 კონტენტის ძებნა..." />

      {contentTab === 'grammar' && <Card gls={gls}><h3>Grammar Topics</h3><div style={{ display: 'grid', gap: 8 }}><Input value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="Topic title" /><Input value={topicForm.description} onChange={e => setTopicForm({ ...topicForm, description: e.target.value })} placeholder="Description" /><select value={topicForm.level} onChange={e => setTopicForm({ ...topicForm, level: e.target.value })}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select><Button onClick={saveTopic} disabled={saving}>{editing?.type === 'topic' ? 'განახლება' : 'დამატება'}</Button></div>{filteredTopics.map(t => <div key={t.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}><b>{t.level} · {t.title}</b><div>{t.description}</div><Button onClick={() => editRow('topic', t)}>რედაქტირება</Button> <Button danger onClick={() => remove('grammar_topics', t.id, t.title)}>წაშლა</Button></div>)}</Card>}

      {contentTab === 'vocabulary' && <Card gls={gls}><h3>Vocabulary</h3><div style={{ display: 'grid', gap: 8 }}><Input value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} placeholder="Word" /><Input value={wordForm.translation} onChange={e => setWordForm({ ...wordForm, translation: e.target.value })} placeholder="Translation" /><Button onClick={saveWord} disabled={saving}>{editing?.type === 'word' ? 'განახლება' : 'დამატება'}</Button></div>{filteredWords.map(w => <div key={w.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}><b>{w.word}</b> · {w.translation}<br /><Button onClick={() => editRow('word', w)}>რედაქტირება</Button> <Button danger onClick={() => remove('vocabulary_items', w.id, w.word)}>წაშლა</Button></div>)}</Card>}

      {contentTab === 'lessons' && <Card gls={gls}><h3>Lessons</h3><div style={{ display: 'grid', gap: 8 }}><Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Lesson title" /><Input value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Description" /><Button onClick={saveLesson} disabled={saving}>{editing?.type === 'lesson' ? 'განახლება' : 'დამატება'}</Button></div>{filteredLessons.map(l => <div key={l.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}><b>{l.level} · {l.title}</b><br /><Button onClick={() => editRow('lesson', l)}>რედაქტირება</Button> <Button danger onClick={() => remove('lessons', l.id, l.title)}>წაშლა</Button></div>)}</Card>}

      {contentTab === 'settings' && <Card gls={gls}>{settings.map(s => <div key={s.key} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}><b>{s.key}</b><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(s.value, null, 2)}</pre></div>)}</Card>}

      {contentTab === 'logs' && <Card gls={gls}><Input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="🔍 Audit log search..." />{filteredLogs.map(row => <div key={row.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}><b>{row.action}</b><div style={{ fontSize: 11, color: C.ts }}>{row.entity_type || 'system'} · {row.entity_id || 'n/a'}</div>{row.details && <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(row.details, null, 2)}</pre>}</div>)}</Card>}
    </>}
  </div>
}
