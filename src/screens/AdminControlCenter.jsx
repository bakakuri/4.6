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
const EMPTY_TOPIC = { level: 'A1', title: '', description: '', category: '', order_index: 0, is_active: true }
const EMPTY_WORD = { word: '', translation: '', article: '', plural: '', phonetic: '', example: '', level: 'A1', image_url: '', is_active: true }
const EMPTY_LESSON = { title: '', level: 'A1', description: '', order_index: 0, is_locked: false }

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--border, #dbe1ef)',
        background: 'transparent',
        color: 'inherit',
        fontFamily: 'inherit',
        outline: 'none',
      }}
    />
  )
}

function Button({ children, onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: danger ? '1px solid rgba(239,68,68,.35)' : 'none',
        background: danger ? 'rgba(239,68,68,.14)' : 'linear-gradient(135deg,#5d6bff,#a855f7)',
        color: danger ? '#ef4444' : '#fff',
        borderRadius: 10,
        padding: '9px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontWeight: 800,
        fontFamily: 'inherit',
        fontSize: 12,
      }}
    >
      {children}
    </button>
  )
}

function Card({ children, gls }) {
  return <div style={{ ...gls({ padding: 14 }), marginBottom: 12 }}>{children}</div>
}

export default function AdminControlCenter({ user }) {
  const { C, gls } = useTheme()
  const [tab, setTab] = useState('users')
  const [contentTab, setContentTab] = useState('grammar')
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
  const [settings, setSettings] = useState([])
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [contentSearch, setContentSearch] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [broadcast, setBroadcast] = useState('')
  const [topicForm, setTopicForm] = useState(EMPTY_TOPIC)
  const [wordForm, setWordForm] = useState(EMPTY_WORD)
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON)
  const [editing, setEditing] = useState(null)

  const notify = useCallback((message, error = false) => {
    setToast(message)
    if (error) console.error(message)
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setToast(''), 2800)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
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

      const [profileData, statsData, messageData, topicData, exerciseData, wordData, lessonData, settingData, logData] = results
      setProfiles(profileData || [])
      setStats(statsData || null)
      setMessages(messageData.data || [])
      setTopics(topicData.data || [])
      setExercises(exerciseData.data || [])
      setWords(wordData.data || [])
      setLessons(lessonData.data || [])
      setSettings(settingData.data || [])
      setLogs(logData.data || [])

      const firstError = messageData.error || topicData.error || exerciseData.error || wordData.error || lessonData.error || settingData.error || logData.error
      if (firstError) notify(firstError.message, true)
    } catch (error) {
      notify(error.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა', true)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action, success = 'შენახულია') => {
    setSaving(true)
    try {
      const result = await action()
      if (result?.error) throw result.error
      notify(success)
      await load()
    } catch (error) {
      notify(error.message || 'შეცდომა', true)
    } finally {
      setSaving(false)
    }
  }

  const audit = async (action, entityType, entityId, details = {}) => {
    if (!user?.id) return
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    })
    if (error) console.error('Audit log error:', error)
  }

  const saveTopic = () => run(async () => {
    const payload = { ...topicForm, order_index: Number(topicForm.order_index || 0), updated_at: new Date().toISOString() }
    const query = editing?.type === 'topic'
      ? supabase.from('grammar_topics').update(payload).eq('id', editing.id)
      : supabase.from('grammar_topics').insert(payload)
    const result = await query
    if (!result.error) await audit(editing ? 'update_grammar_topic' : 'create_grammar_topic', 'grammar_topic', editing?.id || null, payload)
    setTopicForm(EMPTY_TOPIC)
    setEditing(null)
    return result
  })

  const saveWord = () => run(async () => {
    const result = editing?.type === 'word'
      ? await supabase.from('vocabulary_items').update(wordForm).eq('id', editing.id)
      : await supabase.from('vocabulary_items').insert(wordForm)
    setWordForm(EMPTY_WORD)
    setEditing(null)
    return result
  })

  const saveLesson = () => run(async () => {
    const payload = { ...lessonForm, order_index: Number(lessonForm.order_index || 0) }
    const result = editing?.type === 'lesson'
      ? await supabase.from('lessons').update(payload).eq('id', editing.id)
      : await supabase.from('lessons').insert(payload)
    setLessonForm(EMPTY_LESSON)
    setEditing(null)
    return result
  })

  const remove = (table, id, label) => run(async () => {
    if (!window.confirm(`წაიშალოს ${label}?`)) return null
    return supabase.from(table).delete().eq('id', id)
  }, 'წაიშალა')

  const editRow = (type, row) => {
    setEditing({ type, id: row.id })
    if (type === 'topic') setTopicForm({ ...EMPTY_TOPIC, ...row })
    if (type === 'word') setWordForm({ ...EMPTY_WORD, ...row })
    if (type === 'lesson') setLessonForm({ ...EMPTY_LESSON, ...row })
  }

  const filteredProfiles = useMemo(() => profiles.filter((p) => !search || String(p.username || '').toLowerCase().includes(search.toLowerCase())), [profiles, search])
  const filteredMessages = useMemo(() => messages.filter((m) => !search || `${m.username || ''} ${m.text || ''}`.toLowerCase().includes(search.toLowerCase())), [messages, search])
  const filteredTopics = useMemo(() => topics.filter((t) => `${t.level} ${t.title} ${t.category || ''} ${t.description || ''}`.toLowerCase().includes(contentSearch.toLowerCase())), [topics, contentSearch])
  const filteredExercises = useMemo(() => exercises.filter((e) => `${e.level} ${e.exercise_type} ${e.question} ${e.correct_answer}`.toLowerCase().includes(contentSearch.toLowerCase())), [exercises, contentSearch])
  const filteredWords = useMemo(() => words.filter((w) => `${w.level} ${w.word} ${w.translation}`.toLowerCase().includes(contentSearch.toLowerCase())), [words, contentSearch])
  const filteredLessons = useMemo(() => lessons.filter((l) => `${l.level} ${l.title} ${l.description || ''}`.toLowerCase().includes(contentSearch.toLowerCase())), [lessons, contentSearch])
  const filteredLogs = useMemo(() => logs.filter((l) => `${l.action} ${l.entity_type || ''} ${l.entity_id || ''} ${JSON.stringify(l.details || {})}`.toLowerCase().includes(logSearch.toLowerCase())), [logs, logSearch])

  const toggleUser = async (profile, field, fn) => {
    if (profile.id === user?.id) return notify('საკუთარ ანგარიშზე ეს მოქმედება არ შეიძლება', true)
    await fn(profile.id, !profile[field], user?.id)
    await load()
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: C.ts }}>იტვირთება...</div>

  const tabs = [
    ['users', '👥 მომხმარებლები'],
    ['stats', '📊 სტატისტიკა'],
    ['chat', '💬 ჩატი'],
    ['broadcast', '📢 Broadcast'],
    ['content', '🧩 კონტენტი'],
  ]

  const contentTabs = [
    ['grammar', '📚 Grammar'],
    ['vocabulary', '📝 Vocabulary'],
    ['lessons', '🎓 Lessons'],
    ['settings', '⚙️ Settings'],
    ['logs', '🧾 Logs'],
  ]

  return (
    <div className="page-enter" style={{ padding: 14, color: C.t }}>
      {toast && (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: C.a, color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <h2 style={{ margin: '0 0 4px' }}>⚙️ ადმინ პანელი</h2>
      <div style={{ color: C.ts, fontSize: 12, marginBottom: 14 }}>
        👥 {profiles.length} · ⚡ {stats?.totalXP || 0} XP · 💬 {stats?.totalMsgs || 0}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {tabs.map(([id, label]) => (
          <Button key={id} onClick={() => setTab(id)}>{label}</Button>
        ))}
      </div>

      {tab === 'users' && (
        <Card gls={gls}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 მომხმარებლის ძებნა..." />
          {filteredProfiles.map((profile) => (
            <div key={profile.id} style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.bdL}` }}>
              <div>
                <b>{profile.username || 'User'}</b>
                <div style={{ fontSize: 11, color: C.ts }}>⚡ {profile.xp || 0} XP · 🔥 {profile.streak || 0} · {profile.is_admin ? 'ADMIN' : 'USER'}</div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button disabled={saving} onClick={() => toggleUser(profile, 'is_admin', adminToggleAdmin)}>{profile.is_admin ? 'Admin−' : 'Admin+'}</Button>
                <Button disabled={saving} onClick={() => toggleUser(profile, 'chat_blocked', adminToggleBlock)}>{profile.chat_blocked ? 'Unblock' : 'Block'}</Button>
                <Button disabled={saving} onClick={() => adminSetXP(profile.id, Number(profile.xp || 0) + 100, user?.id).then(load)}>+100 XP</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'stats' && <Card gls={gls}><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(stats, null, 2)}</pre></Card>}

      {tab === 'chat' && (
        <Card gls={gls}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 ჩატის ძებნა..." />
          {filteredMessages.map((message) => (
            <div key={message.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}>
              <b>{message.username || 'User'}</b>
              <div>{message.text}</div>
              <Button danger onClick={() => run(() => adminDeleteMessage(message.id, user?.id), 'წაიშალა')}>წაშლა</Button>
            </div>
          ))}
        </Card>
      )}

      {tab === 'broadcast' && (
        <Card gls={gls}>
          <textarea value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="შეტყობინება..." style={{ width: '100%', minHeight: 120, boxSizing: 'border-box', padding: 12, borderRadius: 10, background: 'transparent', color: 'inherit' }} />
          <Button onClick={() => run(() => adminBroadcast(broadcast, user?.username || 'Admin', user?.id), 'გაიგზავნა')}>📢 გაგზავნა</Button>
        </Card>
      )}

      {tab === 'content' && (
        <>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {contentTabs.map(([id, label]) => <Button key={id} onClick={() => setContentTab(id)}>{label}</Button>)}
          </div>
          <Input value={contentSearch} onChange={(e) => setContentSearch(e.target.value)} placeholder="🔍 კონტენტის ძებნა..." />

          {contentTab === 'grammar' && (
            <Card gls={gls}>
              <h3>Grammar Topics</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <Input value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="Topic title" />
                <Input value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} placeholder="Description" />
                <select value={topicForm.level} onChange={(e) => setTopicForm({ ...topicForm, level: e.target.value })}>
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
                <Button onClick={saveTopic} disabled={saving}>{editing?.type === 'topic' ? 'განახლება' : 'დამატება'}</Button>
              </div>
              {filteredTopics.map((topic) => (
                <div key={topic.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}>
                  <b>{topic.level} · {topic.title}</b>
                  <div>{topic.description}</div>
                  <Button onClick={() => editRow('topic', topic)}>რედაქტირება</Button>{' '}
                  <Button danger onClick={() => remove('grammar_topics', topic.id, topic.title)}>წაშლა</Button>
                </div>
              ))}
              <div style={{ marginTop: 12, color: C.ts, fontSize: 12 }}>სავარჯიშოები: {filteredExercises.length}</div>
            </Card>
          )}

          {contentTab === 'vocabulary' && (
            <Card gls={gls}>
              <h3>Vocabulary</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <Input value={wordForm.word} onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })} placeholder="Word" />
                <Input value={wordForm.translation} onChange={(e) => setWordForm({ ...wordForm, translation: e.target.value })} placeholder="Translation" />
                <Button onClick={saveWord} disabled={saving}>{editing?.type === 'word' ? 'განახლება' : 'დამატება'}</Button>
              </div>
              {filteredWords.map((word) => (
                <div key={word.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}>
                  <b>{word.word}</b> · {word.translation}<br />
                  <Button onClick={() => editRow('word', word)}>რედაქტირება</Button>{' '}
                  <Button danger onClick={() => remove('vocabulary_items', word.id, word.word)}>წაშლა</Button>
                </div>
              ))}
            </Card>
          )}

          {contentTab === 'lessons' && (
            <Card gls={gls}>
              <h3>Lessons</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Lesson title" />
                <Input value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Description" />
                <Button onClick={saveLesson} disabled={saving}>{editing?.type === 'lesson' ? 'განახლება' : 'დამატება'}</Button>
              </div>
              {filteredLessons.map((lesson) => (
                <div key={lesson.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}>
                  <b>{lesson.level} · {lesson.title}</b><br />
                  <Button onClick={() => editRow('lesson', lesson)}>რედაქტირება</Button>{' '}
                  <Button danger onClick={() => remove('lessons', lesson.id, lesson.title)}>წაშლა</Button>
                </div>
              ))}
            </Card>
          )}

          {contentTab === 'settings' && (
            <Card gls={gls}>
              {settings.map((setting) => (
                <div key={setting.key} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}>
                  <b>{setting.key}</b>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(setting.value, null, 2)}</pre>
                </div>
              ))}
            </Card>
          )}

          {contentTab === 'logs' && (
            <Card gls={gls}>
              <Input value={logSearch} onChange={(e) => setLogSearch(e.target.value)} placeholder="🔍 Audit log search..." />
              {filteredLogs.map((log) => (
                <div key={log.id} style={{ padding: 10, borderBottom: `1px solid ${C.bdL}` }}>
                  <b>{log.action}</b>
                  <div style={{ fontSize: 11, color: C.ts }}>{log.entity_type || 'system'} · {log.entity_id || 'n/a'}</div>
                  {log.details && <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(log.details, null, 2)}</pre>}
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
