import { useEffect, useMemo, useState } from 'react'
import { LANG, LEVELS } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GR from '../data/grammar.js'

const STORAGE_PREFIX = 'lm_grammar'

function storageKey(lang, suffix) {
  return `${STORAGE_PREFIX}:${lang}:${suffix}`
}

function safeRead(key, fallback) {
  try {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can fail in private modes or locked-down contexts.
  }
}

function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function topicId(lang, cat, title) {
  return `${lang}::${cat}::${title}`
}

function renderInline(line, C) {
  return line.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ color: C.t }}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function extractHighlights(body = '') {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false
      return line.startsWith('•') || line.startsWith('⚠️') || line.startsWith('✅') || /^\*\*.*\*\*$/.test(line)
    })
    .slice(0, 8)
}

function renderBody(body, C) {
  return body.split('\n').map((line, i) => {
    const trimmed = line.trim()

    if (!trimmed) return <div key={i} style={{ height: 10 }} />

    if (/^\*\*.*\*\*$/.test(trimmed)) {
      return (
        <div key={i} style={{ color: C.t, fontWeight: 800, fontSize: 15, marginTop: 14, marginBottom: 4 }}>
          {trimmed.replace(/\*\*/g, '')}
        </div>
      )
    }

    if (trimmed.startsWith('•')) {
      return (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ color: C.a, fontWeight: 900, lineHeight: 1.7 }}>•</span>
          <div style={{ color: C.ts, fontSize: 14, lineHeight: 1.7, flex: 1 }}>
            {renderInline(trimmed.replace(/^•\s*/, ''), C)}
          </div>
        </div>
      )
    }

    if (trimmed.startsWith('⚠️') || trimmed.startsWith('✅') || trimmed.startsWith('💡')) {
      const tone = trimmed.startsWith('⚠️') ? C.o : trimmed.startsWith('✅') ? C.g : C.a
      return (
        <div
          key={i}
          style={{
            borderLeft: `3px solid ${tone}`,
            background: C.card3,
            borderRadius: 10,
            padding: '10px 12px',
            margin: '8px 0 6px',
            color: C.ts,
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {renderInline(trimmed, C)}
        </div>
      )
    }

    return (
      <div key={i} style={{ color: C.ts, fontSize: 14, lineHeight: 1.75, marginBottom: 4 }}>
        {renderInline(trimmed, C)}
      </div>
    )
  })
}

function topicSummary(topic) {
  const raw = topic?.ex?.[0] || topic?.body || ''
  return raw
    .split('\n')
    .map(line => line.replace(/^\*\*|\*\*$/g, '').replace(/^•\s*/, '').trim())
    .find(Boolean)
    ?.slice(0, 120) || ''
}

function TopicView({ lang, cat, topic, bookmarked, onBack, onToggleBookmark, onOpenTopic, relatedTopics, seenCount }) {
  const { C, gls } = useTheme()
  const highlights = extractHighlights(topic.body)

  return (
    <div className="page-enter" style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: C.card3,
          border: `1px solid ${C.bdL}`,
          borderRadius: 12,
          padding: '8px 14px',
          color: C.ts,
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 16,
          fontFamily: 'inherit',
        }}
      >
        ← უკან
      </button>

      <div style={{ ...gls({ padding: 18, marginBottom: 12 }), background: `linear-gradient(135deg,${C.card2},${C.card3})` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>
              {LANG[lang]?.flag} {cat.cat} · თემა
            </div>
            <div style={{ color: C.t, fontWeight: 900, fontSize: 22, lineHeight: 1.2 }}>{topic.title}</div>
            <div style={{ color: C.ts, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
              {topicSummary(topic) || 'კომპაქტური ახსნა, მაგალითები და დასამახსოვრებელი წესები ერთ გვერდზე.'}
            </div>
          </div>
          <button
            onClick={onToggleBookmark}
            style={{
              minWidth: 44,
              minHeight: 44,
              borderRadius: 14,
              border: `1px solid ${bookmarked ? C.gold : C.bdL}`,
              background: bookmarked ? `${C.gold}18` : C.card,
              color: bookmarked ? C.gold : C.ts,
              cursor: 'pointer',
              fontSize: 18,
            }}
            aria-label="bookmark topic"
            title="რჩეულებში დამატება"
          >
            {bookmarked ? '★' : '☆'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: C.bg, color: C.ts, fontSize: 12, border: `1px solid ${C.bdL}` }}>
            📘 ახსნა
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: C.bg, color: C.ts, fontSize: 12, border: `1px solid ${C.bdL}` }}>
            🧠 {seenCount > 0 ? `${seenCount} ნანახი თემა` : 'პირველი ნაბიჯი'}
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: C.bg, color: C.ts, fontSize: 12, border: `1px solid ${C.bdL}` }}>
            ⭐ {bookmarked ? 'რჩეულებშია' : 'შეინახე'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ ...gls({ padding: 18 }) }}>
          <div style={{ color: C.t, fontWeight: 800, fontSize: 16, marginBottom: 12 }}>თემის ახსნა</div>
          {renderBody(topic.body, C)}
        </div>

        {topic.ex?.length > 0 && (
          <div style={{ ...gls({ padding: 18 }) }}>
            <div style={{ color: C.a, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>📌 მაგალითები</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {topic.ex.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    background: C.card3,
                    borderRadius: 12,
                    padding: '11px 14px',
                    borderLeft: `3px solid ${C.a}`,
                    color: C.t,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {ex}
                </div>
              ))}
            </div>
          </div>
        )}

        {highlights.length > 0 && (
          <div style={{ ...gls({ padding: 18 }) }}>
            <div style={{ color: C.t, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>💡 დასამახსოვრებელი წერტილები</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {highlights.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    background: C.card3,
                    borderRadius: 12,
                    padding: '10px 12px',
                    color: C.ts,
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  <span style={{ color: C.g, fontWeight: 900 }}>▸</span>
                  <div>{renderInline(line.replace(/^•\s*/, ''), C)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...gls({ padding: 18 }) }}>
          <div style={{ color: C.t, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>🎯 როგორ გამოიყენო ეს თემა</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              'წაიკითხე ახსნა ერთხელ ბოლომდე.',
              'გაიმეორე მაგალითები ხმამაღლა.',
              'შემდეგ მონიშნე რთული ნაწილი და ისევ დაბრუნდი.',
            ].map((item, idx) => (
              <div key={idx} style={{ color: C.ts, fontSize: 14, lineHeight: 1.7 }}>
                {idx + 1}. {item}
              </div>
            ))}
          </div>
        </div>

        {relatedTopics.length > 0 && (
          <div style={{ ...gls({ padding: 18 }) }}>
            <div style={{ color: C.t, fontWeight: 800, fontSize: 15, marginBottom: 12 }}>🔁 დაკავშირებული თემები</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {relatedTopics.map((t) => (
                <button
                  key={t.title}
                  onClick={() => onOpenTopic(t)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 14,
                    background: C.card2,
                    border: `1px solid ${C.bdL}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ color: C.ts, fontSize: 12, lineHeight: 1.6 }}>{topicSummary(t)}</div>
                  <div style={{ color: C.a, fontSize: 12, marginTop: 6 }}>→ გახსნა</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryView({ catObj, lang, onBack, onTopic, onToggleBookmark, bookmarks, seen }) {
  const { C, gls } = useTheme()
  const catId = catObj.cat
  const seenCount = catObj.topics.filter(t => seen.has(topicId(lang, catId, t.title))).length
  const bookmarkCount = catObj.topics.filter(t => bookmarks.has(topicId(lang, catId, t.title))).length
  const progress = catObj.topics.length ? Math.round((seenCount / catObj.topics.length) * 100) : 0

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: C.card3,
          border: `1px solid ${C.bdL}`,
          borderRadius: 12,
          padding: '8px 14px',
          color: C.ts,
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 16,
          fontFamily: 'inherit',
        }}
      >
        ← ყველა კატეგორია
      </button>

      <div style={{ ...gls({ padding: 18, marginBottom: 12 }), background: `linear-gradient(135deg,${C.card2},${C.card3})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ fontSize: 34 }}>{catObj.icon}</span>
          <div>
            <div style={{ color: C.t, fontWeight: 900, fontSize: 22 }}>{catObj.cat}</div>
            <div style={{ color: C.ts, fontSize: 13, marginTop: 3 }}>
              {catObj.topics.length} თემა · {seenCount} ნანახი · {bookmarkCount} ფავორიტი
            </div>
          </div>
        </div>

        <div style={{ background: C.card3, borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.p})` }} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {catObj.topics.map((t) => {
          const id = topicId(lang, catObj.cat, t.title)
          const saved = bookmarks.has(id)
          return (
            <div
              key={t.title}
              style={{
                padding: 14,
                background: C.card,
                border: `1px solid ${C.bdL}`,
                borderRadius: 16,
                boxShadow: `0 8px 22px ${C.bg1 || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <button
                onClick={() => onTopic(t)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.t, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
                    <div style={{ color: C.ts, fontSize: 12, lineHeight: 1.6 }}>{topicSummary(t)}</div>
                  </div>
                  <span style={{ color: C.a, fontSize: 20, lineHeight: 1 }}>›</span>
                </div>
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '5px 9px', borderRadius: 999, background: C.card3, color: C.ts, fontSize: 11, border: `1px solid ${C.bdL}` }}>
                    {saved ? '★ saved' : '☆ save'}
                  </span>
                  <span style={{ padding: '5px 9px', borderRadius: 999, background: C.card3, color: C.ts, fontSize: 11, border: `1px solid ${C.bdL}` }}>
                    {t.ex?.length || 0} examples
                  </span>
                </div>
                <button
                  onClick={() => onToggleBookmark(t)}
                  style={{
                    border: `1px solid ${saved ? C.gold : C.bdL}`,
                    background: saved ? `${C.gold}18` : C.card2,
                    color: saved ? C.gold : C.ts,
                    borderRadius: 12,
                    padding: '7px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {saved ? '★' : '☆'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function GrammarScreen({ lang }) {
  const { C, gls } = useTheme()
  const cats = GR[lang] || GR.english || GR.german || []

  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all')
  const [bookmarks, setBookmarks] = useState([])
  const [seen, setSeen] = useState([])
  const [lastTopicId, setLastTopicId] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSelectedCat(null)
    setSelectedTopic(null)
    setQuery('')
    setMode('all')

    const b = safeRead(storageKey(lang, 'bookmarks'), [])
    const s = safeRead(storageKey(lang, 'seen'), [])
    const last = safeRead(storageKey(lang, 'last'), null)

    setBookmarks(Array.isArray(b) ? b : [])
    setSeen(Array.isArray(s) ? s : [])
    setLastTopicId(typeof last === 'string' ? last : null)
    setMounted(true)
  }, [lang])

  useEffect(() => {
    if (!mounted) return
    safeWrite(storageKey(lang, 'bookmarks'), bookmarks)
  }, [bookmarks, lang, mounted])

  useEffect(() => {
    if (!mounted) return
    safeWrite(storageKey(lang, 'seen'), seen)
  }, [seen, lang, mounted])

  useEffect(() => {
    if (!mounted) return
    safeWrite(storageKey(lang, 'last'), lastTopicId)
  }, [lastTopicId, lang, mounted])

  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks])
  const seenSet = useMemo(() => new Set(seen), [seen])

  const totalTopics = useMemo(() => cats.reduce((sum, cat) => sum + (cat.topics?.length || 0), 0), [cats])
  const visibleCats = useMemo(() => {
    const q = normalize(query.trim())
    return cats
      .map(cat => {
        const topics = (cat.topics || []).filter(topic => {
          const id = topicId(lang, cat.cat, topic.title)
          const haystack = normalize([cat.cat, topic.title, topic.body, ...(topic.ex || [])].join(' '))
          const matchQuery = !q || haystack.includes(q)
          const matchMode =
            mode === 'all' ||
            (mode === 'bookmarks' && bookmarkSet.has(id)) ||
            (mode === 'seen' && seenSet.has(id))
          return matchQuery && matchMode
        })
        return { ...cat, topics }
      })
      .filter(cat => cat.topics.length > 0)
  }, [cats, lang, query, mode, bookmarkSet, seenSet])

  const bookmarkedTopics = useMemo(() => bookmarks.length, [bookmarks])
  const seenTopics = useMemo(() => seen.length, [seen])
  const progressPct = totalTopics ? Math.round((seenTopics / totalTopics) * 100) : 0
  const currentLang = LANG[lang] || LANG.english

  const lastTopic = useMemo(() => {
    if (!lastTopicId) return null
    for (const cat of cats) {
      for (const topic of cat.topics || []) {
        if (topicId(lang, cat.cat, topic.title) === lastTopicId) {
          return { cat, topic }
        }
      }
    }
    return null
  }, [cats, lang, lastTopicId])

  const openTopic = (cat, topic) => {
    setSelectedCat(cat)
    setSelectedTopic(topic)
    const id = topicId(lang, cat.cat, topic.title)
    if (!seenSet.has(id)) {
      setSeen(prev => [id, ...prev].slice(0, 120))
    }
    setLastTopicId(id)
  }

  const toggleBookmark = (cat, topic) => {
    const id = topicId(lang, cat.cat, topic.title)
    setBookmarks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev])
  }

  const relatedTopics = useMemo(() => {
    if (!selectedCat || !selectedTopic) return []
    return (selectedCat.topics || [])
      .filter(t => t.title !== selectedTopic.title)
      .slice(0, 4)
  }, [selectedCat, selectedTopic])

  if (!cats.length) {
    return (
      <div style={{ padding: 16, color: C.ts, fontFamily: "'Inter',system-ui,sans-serif" }}>
        გრამატიკის კონტენტი ჯერ არ მოიძებნა.
      </div>
    )
  }

  if (selectedCat && selectedTopic) {
    const topicIdValue = topicId(lang, selectedCat.cat, selectedTopic.title)
    return (
      <TopicView
        lang={lang}
        cat={selectedCat}
        topic={selectedTopic}
        bookmarked={bookmarkSet.has(topicIdValue)}
        onBack={() => setSelectedTopic(null)}
        onToggleBookmark={() => toggleBookmark(selectedCat, selectedTopic)}
        onOpenTopic={(topic) => openTopic(selectedCat, topic)}
        relatedTopics={relatedTopics}
        seenCount={seenTopics}
      />
    )
  }

  if (selectedCat) {
    return (
      <CategoryView
        catObj={selectedCat}
        lang={lang}
        onBack={() => setSelectedCat(null)}
        onTopic={(topic) => openTopic(selectedCat, topic)}
        onToggleBookmark={(topic) => toggleBookmark(selectedCat, topic)}
        bookmarks={bookmarkSet}
        seen={seenSet}
      />
    )
  }

  const roadmap = [
    { level: 'A1', note: 'საფუძვლები' },
    { level: 'A2', note: 'გავრცობა' },
    { level: 'B1', note: 'თვითგამოხატვა' },
    { level: 'B2', note: 'წინადადებების გაძლიერება' },
    { level: 'C1', note: 'ნიუანსები' },
    { level: 'C2', note: 'სრული სიზუსტე' },
  ]

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>📖 გრამატიკა</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 5, lineHeight: 1.6 }}>
          {currentLang.flag} {currentLang.name} · გაკვეთილები, მაგალითები, ფავორიტები და პროგრესი ერთ სივრცეში
        </div>
      </div>

      <div style={{ ...gls({ padding: 14, marginBottom: 12 }) }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ძიება: ბრუნვა, ზმნა, არტიკლი, მაგალითი..."
              style={{
                width: '100%',
                borderRadius: 14,
                border: `1px solid ${C.bdL}`,
                background: C.card2,
                color: C.t,
                fontSize: 14,
                padding: '13px 14px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { key: 'all', label: 'ყველა' },
              { key: 'bookmarks', label: 'რჩეულები' },
              { key: 'seen', label: 'ნანახი' },
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => setMode(chip.key)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px solid ${mode === chip.key ? C.a : C.bdL}`,
                  background: mode === chip.key ? `${C.a}18` : C.card3,
                  color: mode === chip.key ? C.a : C.ts,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'კატეგორიები', value: cats.length, icon: '🗂️' },
          { label: 'თემები', value: totalTopics, icon: '📚' },
          { label: 'ფავორიტები', value: bookmarkedTopics, icon: '★' },
          { label: 'ნანახი', value: seenTopics, icon: '👀' },
        ].map(item => (
          <div key={item.label} style={{ ...gls({ padding: 14 }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div>
                <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>{item.icon} {item.label}</div>
                <div style={{ color: C.t, fontWeight: 900, fontSize: 22 }}>{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...gls({ padding: 14, marginBottom: 12 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ color: C.t, fontWeight: 800, fontSize: 15 }}>📈 საერთო პროგრესი</div>
            <div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{progressPct}% ნანახი თემებიდან</div>
          </div>
          <div style={{ color: C.a, fontWeight: 900, fontSize: 18 }}>{progressPct}%</div>
        </div>
        <div style={{ background: C.card3, borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.p})` }} />
        </div>
      </div>

      <div style={{ ...gls({ padding: 14, marginBottom: 12 }) }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 15, marginBottom: 10 }}>🧭 სწავლის გზა</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {roadmap.map(item => (
            <div
              key={item.level}
              style={{
                padding: '8px 10px',
                borderRadius: 999,
                border: `1px solid ${C.bdL}`,
                background: C.card2,
                color: C.t,
                fontSize: 12,
              }}
            >
              <strong>{item.level}</strong> · {item.note}
            </div>
          ))}
        </div>
        <div style={{ color: C.ts, fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>
          ეს ხედვა გეხმარება თემების სწორად დალაგებაში. შენს კონტენტს უკვე აქვს მასალა, ახლა მხოლოდ სარწმუნო ნავიგაცია სჭირდება.
        </div>
      </div>

      {lastTopic && (
        <div style={{ ...gls({ padding: 16, marginBottom: 12 }), background: `linear-gradient(135deg,${C.card2},${C.card3})` }}>
          <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>⏭️ გაგრძელება იქიდან, სადაც შეჩერდი</div>
          <div style={{ color: C.t, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{lastTopic.topic.title}</div>
          <div style={{ color: C.ts, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>{topicSummary(lastTopic.topic)}</div>
          <button
            onClick={() => openTopic(lastTopic.cat, lastTopic.topic)}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg,${C.a},${C.p})`,
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            განაგრძე სწავლა
          </button>
        </div>
      )}

      {visibleCats.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {visibleCats.map((cat) => (
            <button
              key={cat.cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 18,
                background: `linear-gradient(135deg,${C.card2},${C.card3})`,
                border: `1px solid ${C.bdL}`,
                borderRadius: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 30 }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.t, fontWeight: 800, fontSize: 16 }}>{cat.cat}</div>
                <div style={{ color: C.ts, fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
                  {cat.topics.length} თემა · {cat.topics.map(t => t.title).slice(0, 3).join(', ')}{cat.topics.length > 3 ? '…' : ''}
                </div>
                <div style={{ marginTop: 10, background: C.card3, borderRadius: 999, height: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${cat.topics.length ? Math.round((cat.topics.filter(t => seenSet.has(topicId(lang, cat.cat, t.title))).length / cat.topics.length) * 100) : 0}%`,
                      height: '100%',
                      background: `linear-gradient(90deg,${C.a},${C.g})`,
                    }}
                  />
                </div>
              </div>
              <span style={{ color: C.a, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ ...gls({ padding: 18 }), color: C.ts, fontSize: 14, lineHeight: 1.7 }}>
          შედეგი ვერ მოიძებნა. ძიება ან ფილტრი ზედმეტად მკაცრი აღმოჩნდა, როგორც ხშირად ხდება ადამიანებთან, როცა ყველაფერს ერთ ღილაკზე ეძებენ.
        </div>
      )}
    </div>
  )
}
