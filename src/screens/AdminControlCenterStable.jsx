import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import {
  getAllProfiles,
  getSiteStats,
  adminSetXP,
  adminToggleAdmin,
  adminToggleBlock,
  adminDeleteMessage,
  adminBroadcast,
} from '../utils/db.js'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const EXERCISE_TYPES = ['multiple_choice', 'fill_blank', 'translation', 'word_order', 'correction']

const emptyTopic = { level: 'A1', title: '', description: '', category: '', order_index: 0, is_active: true }
const emptyExercise = { topic_id: '', level: 'A1', exercise_type: 'multiple_choice', question: '', options: '[]', correct_answer: '', explanation: '', xp_reward: 5, is_active: true }
const emptyWord = { word: '', translation: '', article: '', plural: '', phonetic: '', example: '', level: 'A1', image_url: '', is_active: true }
const emptyLesson = { title: '', level: 'A1', description: '', order_index: 0, is_locked: false }

function Box({ children, style = {} }) {
  return <div style={{ border: '1px solid rgba(148,163,184,.22)', borderRadius: 16, background: 'rgba(15,23,42,.35)', padding: 14, ...style }}>{children}</div>
}

function Btn({ children, onClick, danger = false, active = false, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        border: danger ? '1px solid rgba(239,68,68,.3)' : active ? '1px solid rgba(93,107,255,.45)' : '1px solid rgba(148,163,184,.22)',
        background: danger ? 'rgba(239,68,68,.12)' : active ? 'rgba(93,107,255,.16)' : 'rgba(148,163,184,.08)',
        color: danger ? '#ef4444' : 'inherit',
        borderRadius: 12,
        padding: '9px 12px',
        fontWeight: 800,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, opacity: 0.72 }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 10, opacity: 0.55, lineHeight: 1.35 }}>{hint}</span> : null}
    </label>
  )
}

const asArray = (value) => {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(String(value ?? '[]'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const safeText = (v) => String(v ?? '')

export default function AdminControlCenterStable({ user }) {
  const { C } = useTheme()
  const [tab, setTab] = useState('users')
  const [subTab, setSubTab] = useState('grammar')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const [profiles, setProfiles] = useState([])
  const [stats, setStats] = useState(null)
  const [messages, setMessages] = useState([])
  const [topics, setTopics] = useState([])
  const [exercises, setExercises] = useState([])
  const [words, setWords] = useState([])
  const [lessons, setLessons] = useState([])

  const [userSearch, setUserSearch] = useState('')
  const [contentSearch, setContentSearch] = useState('')
  const [chatSearch, setChatSearch] = useState('')
  const [broadcast, setBroadcast] = useState('')

  const [editingTopic, setEditingTopic] = useState(null)
  const [topicForm, setTopicForm] = useState(emptyTopic)
  const [editingExercise, setEditingExercise] = useState(null)
  const [exerciseForm, setExerciseForm] = useState(emptyExercise)
  const [editingWord, setEditingWord] = useState(null)
  const [wordForm, setWordForm] = useState(emptyWord)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState(emptyLesson)

  const notify = useCallback((message, error = false) => {
    setToast(message)
    if (error) console.error(message)
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setToast(''), 2600)
  }, [])

  const reload = useCallback(async () => {
    const [profilesRes, statsRes, messagesRes, topicsRes, exercisesRes, wordsRes, lessonsRes] = await Promise.all([
      getAllProfiles(),
      getSiteStats(),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('grammar_topics').select('*').order('level', { ascending: true }).order('order_index', { ascending: true }),
      supabase.from('grammar_exercises').select('*').order('created_at', { ascending: false }),
      supabase.from('vocabulary_items').select('*').order('level', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('lessons').select('*').order('level', { ascending: true }).order('order_index', { ascending: true }),
    ])

    setProfiles(profilesRes || [])
    setStats(statsRes || null)
    setMessages(messagesRes.data || [])
    setTopics(topicsRes.data || [])
    setExercises(exercisesRes.data || [])
    setWords(wordsRes.data || [])
    setLessons(lessonsRes.data || [])

    const err = profilesRes?.error || messagesRes.error || topicsRes.error || exercisesRes.error || wordsRes.error || lessonsRes.error
    if (err) notify(err.message, true)
  }, [notify])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await reload()
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [reload])

  const filteredProfiles = useMemo(
    () => profiles.filter(p => !userSearch || safeText(p.username).toLowerCase().includes(userSearch.toLowerCase())),
    [profiles, userSearch]
  )
  const filteredMessages = useMemo(
    () => messages.filter(m => !chatSearch || `${safeText(m.username)} ${safeText(m.text)}`.toLowerCase().includes(chatSearch.toLowerCase())),
    [messages, chatSearch]
  )
  const filteredTopics = useMemo(
    () => topics.filter(t => `${safeText(t.level)} ${safeText(t.title)} ${safeText(t.category)} ${safeText(t.description)}`.toLowerCase().includes(contentSearch.toLowerCase())),
    [topics, contentSearch]
  )
  const filteredExercises = useMemo(
    () => exercises.filter(e => `${safeText(e.level)} ${safeText(e.exercise_type)} ${safeText(e.question)} ${safeText(e.correct_answer)}`.toLowerCase().includes(contentSearch.toLowerCase())),
    [exercises, contentSearch]
  )
  const filteredWords = useMemo(
    () => words.filter(w => `${safeText(w.level)} ${safeText(w.word)} ${safeText(w.translation)} ${safeText(w.example)}`.toLowerCase().includes(contentSearch.toLowerCase())),
    [words, contentSearch]
  )
  const filteredLessons = useMemo(
    () => lessons.filter(l => `${safeText(l.level)} ${safeText(l.title)} ${safeText(l.description)}`.toLowerCase().includes(contentSearch.toLowerCase())),
    [lessons, contentSearch]
  )

  const run = async (action, successMsg) => {
    setSaving(true)
    try {
      const result = await action()
      if (result?.error) throw result.error
      if (successMsg) notify(successMsg)
      await reload()
    } catch (error) {
      notify(error.message || 'შეცდომა', true)
    } finally {
      setSaving(false)
    }
  }

  const editTopic = (row) => {
    setEditingTopic(row.id)
    setTopicForm({
      level: row.level || 'A1',
      title: row.title || '',
      description: row.description || '',
      category: row.category || '',
      order_index: row.order_index || 0,
      is_active: row.is_active ?? true,
    })
  }

  const editExercise = (row) => {
    setEditingExercise(row.id)
    setExerciseForm({
      topic_id: row.topic_id || '',
      level: row.level || 'A1',
      exercise_type: row.exercise_type || 'multiple_choice',
      question: row.question || '',
      options: JSON.stringify(asArray(row.options), null, 2),
      correct_answer: row.correct_answer || '',
      explanation: row.explanation || '',
      xp_reward: row.xp_reward ?? 5,
      is_active: row.is_active ?? true,
    })
  }

  const editWord = (row) => {
    setEditingWord(row.id)
    setWordForm({
      word: row.word || '',
      translation: row.translation || '',
      article: row.article || '',
      plural: row.plural || '',
      phonetic: row.phonetic || '',
      example: row.example || '',
      level: row.level || 'A1',
      image_url: row.image_url || '',
      is_active: row.is_active ?? true,
    })
  }

  const editLesson = (row) => {
    setEditingLesson(row.id)
    setLessonForm({
      title: row.title || '',
      level: row.level || 'A1',
      description: row.description || '',
      order_index: row.order_index || 0,
      is_locked: row.is_locked ?? false,
    })
  }

  const saveTopic = () => run(async () => {
    if (!topicForm.title.trim()) throw new Error('Topic title აუცილებელია')
    const payload = { ...topicForm, order_index: Number(topicForm.order_index || 0), updated_at: new Date().toISOString() }
    const query = editingTopic
      ? supabase.from('grammar_topics').update(payload).eq('id', editingTopic)
      : supabase.from('grammar_topics').insert({ ...payload, created_at: new Date().toISOString() })
    const result = await query
    if (!result.error) {
      setTopicForm(emptyTopic)
      setEditingTopic(null)
    }
    return result
  }, editingTopic ? 'Grammar topic განახლდა' : 'Grammar topic დაემატა')

  const saveExercise = () => run(async () => {
    if (!exerciseForm.topic_id) throw new Error('Topic აირჩიე')
    if (!exerciseForm.question.trim()) throw new Error('Question აუცილებელია')
    let options = []
    try {
      options = asArray(exerciseForm.options)
    } catch {
      throw new Error('Options JSON არასწორია')
    }
    const payload = {
      topic_id: exerciseForm.topic_id,
      level: exerciseForm.level,
      exercise_type: exerciseForm.exercise_type,
      question: exerciseForm.question,
      options,
      correct_answer: exerciseForm.correct_answer,
      explanation: exerciseForm.explanation,
      xp_reward: Number(exerciseForm.xp_reward || 5),
      is_active: Boolean(exerciseForm.is_active),
    }
    const query = editingExercise
      ? supabase.from('grammar_exercises').update(payload).eq('id', editingExercise)
      : supabase.from('grammar_exercises').insert({ ...payload, created_at: new Date().toISOString() })
    const result = await query
    if (!result.error) {
      setExerciseForm(emptyExercise)
      setEditingExercise(null)
    }
    return result
  }, editingExercise ? 'Exercise განახლდა' : 'Exercise დაემატა')

  const saveWord = () => run(async () => {
    if (!wordForm.word.trim()) throw new Error('Word აუცილებელია')
    const payload = { ...wordForm }
    const query = editingWord
      ? supabase.from('vocabulary_items').update(payload).eq('id', editingWord)
      : supabase.from('vocabulary_items').insert({ ...payload, created_at: new Date().toISOString() })
    const result = await query
    if (!result.error) {
      setWordForm(emptyWord)
      setEditingWord(null)
    }
    return result
  }, editingWord ? 'Vocabulary განახლდა' : 'Vocabulary დაემატა')

  const saveLesson = () => run(async () => {
    if (!lessonForm.title.trim()) throw new Error('Lesson title აუცილებელია')
    const payload = { ...lessonForm, order_index: Number(lessonForm.order_index || 0) }
    const query = editingLesson
      ? supabase.from('lessons').update(payload).eq('id', editingLesson)
      : supabase.from('lessons').insert({ ...payload, created_at: new Date().toISOString() })
    const result = await query
    if (!result.error) {
      setLessonForm(emptyLesson)
      setEditingLesson(null)
    }
    return result
  }, editingLesson ? 'Lesson განახლდა' : 'Lesson დაემატა')

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.ts }}>იტვირთება...</div>
  }

  const tabs = [
    ['users', '👥 Users'],
    ['stats', '📊 Stats'],
    ['chat', '💬 Chat'],
    ['broadcast', '📢 Broadcast'],
    ['content', '🧩 Content'],
  ]

  const contentTabs = [
    ['grammar', '📚 Grammar'],
    ['vocabulary', '📝 Vocabulary'],
    ['lessons', '🎓 Lessons'],
    ['exercises', '🧪 Exercises'],
  ]

  return (
    <div className="page-enter" style={{ padding: 14, color: C.t }}>
      {toast ? (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.a, color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 800 }}>
          {toast}
        </div>
      ) : null}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>⚙️ Admin Control Center 2.0</div>
        <div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>👥 {profiles.length} users · ⚡ {stats?.totalXP || 0} XP · 💬 {stats?.totalMsgs || 0}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {tabs.map(([id, label]) => (
          <Btn key={id} onClick={() => setTab(id)} active={tab === id}>{label}</Btn>
        ))}
      </div>

      {tab === 'users' ? (
        <Box>
          <Field label="Search users">
            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="🔍 მომხმარებლის ძებნა..." style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }} />
          </Field>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {filteredProfiles.map((profile) => (
              <div key={profile.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{profile.username || 'User'} {profile.is_admin ? '👑' : ''}</div>
                  <div style={{ color: C.ts, fontSize: 11 }}>⚡ {profile.xp || 0} XP · 🔥 {profile.streak || 0} streak</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn disabled={saving} onClick={() => adminSetXP(profile.id, Number(profile.xp || 0) + 100, user?.id).then(reload)}>+100 XP</Btn>
                  <Btn disabled={saving} onClick={() => adminToggleAdmin(profile.id, !profile.is_admin, user?.id).then(reload)}>{profile.is_admin ? 'Remove admin' : 'Make admin'}</Btn>
                  <Btn disabled={saving} onClick={() => adminToggleBlock(profile.id, !profile.chat_blocked, user?.id).then(reload)}>{profile.chat_blocked ? 'Unblock' : 'Block'}</Btn>
                </div>
              </div>
            ))}
          </div>
        </Box>
      ) : null}

      {tab === 'stats' ? (
        <Box>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{JSON.stringify(stats, null, 2)}</pre>
        </Box>
      ) : null}

      {tab === 'chat' ? (
        <Box>
          <Field label="Search chat">
            <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="🔍 ჩატის ძებნა..." style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }} />
          </Field>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {filteredMessages.map((message) => (
              <div key={message.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <b>{message.username || 'User'}</b>
                  <Btn danger disabled={saving} onClick={() => run(() => adminDeleteMessage(message.id, user?.id), 'Message deleted')}>Delete</Btn>
                </div>
                <div style={{ marginTop: 6, color: C.ts }}>{message.text}</div>
              </div>
            ))}
          </div>
        </Box>
      ) : null}

      {tab === 'broadcast' ? (
        <Box>
          <textarea value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="შეტყობინება..." rows={5} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} />
          <div style={{ marginTop: 10 }}>
            <Btn disabled={saving || !broadcast.trim()} onClick={() => run(() => adminBroadcast(broadcast, user?.username || 'Admin', user?.id), 'Broadcast sent')}>📢 Send broadcast</Btn>
          </div>
        </Box>
      ) : null}

      {tab === 'content' ? (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {contentTabs.map(([id, label]) => (
              <Btn key={id} onClick={() => setSubTab(id)} active={subTab === id}>{label}</Btn>
            ))}
          </div>
          <Field label="Search content">
            <input value={contentSearch} onChange={(e) => setContentSearch(e.target.value)} placeholder="🔍 კონტენტის ძებნა..." style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }} />
          </Field>

          {subTab === 'grammar' ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>{editingTopic ? '✏️ Edit grammar topic' : '➕ Add grammar topic'}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <Field label="Level"><select value={topicForm.level} onChange={(e) => setTopicForm({ ...topicForm, level: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, background: 'transparent', color: 'inherit' }}>{LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></Field>
                  <Field label="Category"><input value={topicForm.category} onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }} /></Field>
                  <Field label="Title"><input value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }} /></Field>
                  <Field label="Description"><textarea value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Btn disabled={saving} onClick={saveTopic}>{editingTopic ? 'Save topic' : 'Create topic'}</Btn>
                  <Btn disabled={saving} onClick={() => { setEditingTopic(null); setTopicForm(emptyTopic) }}>Reset</Btn>
                </div>
              </Box>

              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Grammar topics ({filteredTopics.length})</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {filteredTopics.map((topic) => (
                    <div key={topic.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <b>{topic.level} · {topic.title}</b>
                          <div style={{ color: C.ts, fontSize: 11 }}>{topic.category || 'No category'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Btn disabled={saving} onClick={() => editTopic(topic)}>Edit</Btn>
                          <Btn danger disabled={saving} onClick={() => run(() => supabase.from('grammar_topics').delete().eq('id', topic.id), 'Topic deleted')}>Delete</Btn>
                        </div>
                      </div>
                      {topic.description ? <div style={{ marginTop: 8, color: C.ts }}>{topic.description}</div> : null}
                    </div>
                  ))}
                </div>
              </Box>
            </div>
          ) : null}

          {subTab === 'vocabulary' ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>{editingWord ? '✏️ Edit vocabulary item' : '➕ Add vocabulary item'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                  <Field label="Word"><input value={wordForm.word} onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })} /></Field>
                  <Field label="Translation"><input value={wordForm.translation} onChange={(e) => setWordForm({ ...wordForm, translation: e.target.value })} /></Field>
                  <Field label="Article"><input value={wordForm.article} onChange={(e) => setWordForm({ ...wordForm, article: e.target.value })} /></Field>
                  <Field label="Plural"><input value={wordForm.plural} onChange={(e) => setWordForm({ ...wordForm, plural: e.target.value })} /></Field>
                  <Field label="Phonetic"><input value={wordForm.phonetic} onChange={(e) => setWordForm({ ...wordForm, phonetic: e.target.value })} /></Field>
                  <Field label="Level"><select value={wordForm.level} onChange={(e) => setWordForm({ ...wordForm, level: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, background: 'transparent', color: 'inherit' }}>{LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></Field>
                  <Field label="Image URL"><input value={wordForm.image_url} onChange={(e) => setWordForm({ ...wordForm, image_url: e.target.value })} /></Field>
                  <Field label="Example"><textarea value={wordForm.example} onChange={(e) => setWordForm({ ...wordForm, example: e.target.value })} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Btn disabled={saving} onClick={saveWord}>{editingWord ? 'Save word' : 'Create word'}</Btn>
                  <Btn disabled={saving} onClick={() => { setEditingWord(null); setWordForm(emptyWord) }}>Reset</Btn>
                </div>
              </Box>

              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Vocabulary ({filteredWords.length})</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {filteredWords.map((word) => (
                    <div key={word.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <b>{word.word}</b> <span style={{ color: C.ts }}>{word.article ? `· ${word.article}` : ''}</span>
                          <div style={{ color: C.ts, fontSize: 11 }}>{word.level} · {word.translation}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Btn disabled={saving} onClick={() => editWord(word)}>Edit</Btn>
                          <Btn danger disabled={saving} onClick={() => run(() => supabase.from('vocabulary_items').delete().eq('id', word.id), 'Word deleted')}>Delete</Btn>
                        </div>
                      </div>
                      {word.example ? <div style={{ marginTop: 8, color: C.ts }}>{word.example}</div> : null}
                    </div>
                  ))}
                </div>
              </Box>
            </div>
          ) : null}

          {subTab === 'lessons' ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>{editingLesson ? '✏️ Edit lesson' : '➕ Add lesson'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                  <Field label="Title"><input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></Field>
                  <Field label="Level"><select value={lessonForm.level} onChange={(e) => setLessonForm({ ...lessonForm, level: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, background: 'transparent', color: 'inherit' }}>{LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></Field>
                  <Field label="Order"><input type="number" value={lessonForm.order_index} onChange={(e) => setLessonForm({ ...lessonForm, order_index: e.target.value })} /></Field>
                  <Field label="Locked"><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={lessonForm.is_locked} onChange={(e) => setLessonForm({ ...lessonForm, is_locked: e.target.checked })} /> <span style={{ fontSize: 12, color: C.ts }}>{lessonForm.is_locked ? 'Locked' : 'Open'}</span></label></Field>
                  <Field label="Description"><textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Btn disabled={saving} onClick={saveLesson}>{editingLesson ? 'Save lesson' : 'Create lesson'}</Btn>
                  <Btn disabled={saving} onClick={() => { setEditingLesson(null); setLessonForm(emptyLesson) }}>Reset</Btn>
                </div>
              </Box>

              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Lessons ({filteredLessons.length})</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {filteredLessons.map((lesson) => (
                    <div key={lesson.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <b>{lesson.level} · {lesson.title}</b>
                          <div style={{ color: C.ts, fontSize: 11 }}>Order #{lesson.order_index || 0}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Btn disabled={saving} onClick={() => editLesson(lesson)}>Edit</Btn>
                          <Btn danger disabled={saving} onClick={() => run(() => supabase.from('lessons').delete().eq('id', lesson.id), 'Lesson deleted')}>Delete</Btn>
                        </div>
                      </div>
                      {lesson.description ? <div style={{ marginTop: 8, color: C.ts }}>{lesson.description}</div> : null}
                    </div>
                  ))}
                </div>
              </Box>
            </div>
          ) : null}

          {subTab === 'exercises' ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>{editingExercise ? '✏️ Edit exercise' : '➕ Add exercise'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                  <Field label="Topic ID"><input value={exerciseForm.topic_id} onChange={(e) => setExerciseForm({ ...exerciseForm, topic_id: e.target.value })} /></Field>
                  <Field label="Level"><select value={exerciseForm.level} onChange={(e) => setExerciseForm({ ...exerciseForm, level: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, background: 'transparent', color: 'inherit' }}>{LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></Field>
                  <Field label="Type"><select value={exerciseForm.exercise_type} onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_type: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 12, background: 'transparent', color: 'inherit' }}>{EXERCISE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></Field>
                  <Field label="XP"><input type="number" value={exerciseForm.xp_reward} onChange={(e) => setExerciseForm({ ...exerciseForm, xp_reward: e.target.value })} /></Field>
                  <Field label="Question"><textarea value={exerciseForm.question} onChange={(e) => setExerciseForm({ ...exerciseForm, question: e.target.value })} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} /></Field>
                  <Field label="Options JSON"><textarea value={exerciseForm.options} onChange={(e) => setExerciseForm({ ...exerciseForm, options: e.target.value })} rows={4} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} /></Field>
                  <Field label="Correct answer"><input value={exerciseForm.correct_answer} onChange={(e) => setExerciseForm({ ...exerciseForm, correct_answer: e.target.value })} /></Field>
                  <Field label="Explanation"><textarea value={exerciseForm.explanation} onChange={(e) => setExerciseForm({ ...exerciseForm, explanation: e.target.value })} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: 'inherit', fontFamily: 'inherit', resize: 'vertical' }} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Btn disabled={saving} onClick={saveExercise}>{editingExercise ? 'Save exercise' : 'Create exercise'}</Btn>
                  <Btn disabled={saving} onClick={() => { setEditingExercise(null); setExerciseForm(emptyExercise) }}>Reset</Btn>
                </div>
              </Box>

              <Box>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Exercises ({filteredExercises.length})</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {filteredExercises.map((exercise) => (
                    <div key={exercise.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <b>{exercise.level} · {exercise.exercise_type}</b>
                          <div style={{ color: C.ts, fontSize: 11 }}>XP {exercise.xp_reward || 0}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Btn disabled={saving} onClick={() => editExercise(exercise)}>Edit</Btn>
                          <Btn danger disabled={saving} onClick={() => run(() => supabase.from('grammar_exercises').delete().eq('id', exercise.id), 'Exercise deleted')}>Delete</Btn>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, color: C.ts, whiteSpace: 'pre-wrap' }}>{exercise.question}</div>
                    </div>
                  ))}
                </div>
              </Box>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
