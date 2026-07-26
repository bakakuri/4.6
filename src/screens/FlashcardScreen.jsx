import { useTheme } from '../lib/ThemeContext.jsx'
import { useState, useEffect, useRef } from 'react'
import { LANG, LEVEL_COLORS } from '../theme.js'
import { allWords, getWordLevel } from '../data/words.js'
import * as DB from '../utils/db.js'
import { speakWord } from '../utils/helpers.js'
import { preload } from '../utils/tts.js'
import { XP_REWARD } from '../utils/gamification.js'

export default function FlashcardScreen({ user, lang }) {
  const { C, gls } = useTheme()

  const [progress, setProgress] = useState(null)
  const [card, setCard] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [xpFloat, setXpFloat] = useState(null)
  const xpTimer = useRef(null)

  const [weakMode, setWeakMode] = useState(false)
  const [weakIds, setWeakIds] = useState([])
  const [practiceIds, setPracticeIds] = useState(new Set())
  const [pqBusy, setPqBusy] = useState(false)

  const lc = LANG[lang] || LANG.de || { code: 'en-US', flag: '🌐' }
  const words = allWords(lang) || []

  // Load weak word IDs when weakMode is on
  useEffect(() => {
    let alive = true

    if (weakMode) {
      DB.getWeakWordIds(user.id, lang)
        .then((ids) => {
          if (alive) setWeakIds(Array.isArray(ids) ? ids : [])
        })
        .catch((err) => {
          console.error('Failed to load weak word IDs:', err)
          if (alive) setWeakIds([])
        })
    } else {
      setWeakIds([])
    }

    return () => {
      alive = false
    }
  }, [weakMode, user.id, lang])

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const p = await DB.getProgress(user.id, lang)
      if (!alive) return
      setProgress(p)
      setCard(DB.nextCardFromProgress(p, lang, weakMode ? weakIds : null))
      setCount(0)
      setLoading(false)
      DB.bumpSession(user.id)
      DB.bumpActivity(user.id)
    }
    load()
    return () => { alive = false }
  }, [user.id, lang, weakMode, weakIds])

  useEffect(() => {
    const loadQueue = async () => {
      const { data } = await DB.supabase.from('practice_queue').select('word_id').eq('user_id', user.id).eq('lang', lang).eq('status', 'active')
      setPracticeIds(new Set((data || []).map(r => r.word_id).filter(Boolean)))
    }
    loadQueue()
  }, [user.id, lang])

  const next = async (result) => {
    if (!card) return
    const newMastery = result ? Math.min(100, (progress?.[card.id]?.mastery || 0) + 20) : Math.max(0, (progress?.[card.id]?.mastery || 0) - 10)
    await DB.saveProgress(user.id, lang, card.id, newMastery)
    await DB.addXP(user.id, result ? XP_REWARD.flashcard : 1)
    setXpFloat(result ? XP_REWARD.flashcard : 1)
    clearTimeout(xpTimer.current)
    xpTimer.current = setTimeout(() => setXpFloat(null), 1200)
    const p = await DB.getProgress(user.id, lang)
    setProgress(p)
    setCard(DB.nextCardFromProgress(p, lang, weakMode ? weakIds : null))
    setFlipped(false)
    setCount(c => c + 1)
  }

  const toggleQueue = async () => {
    if (!card) return
    setPqBusy(true)
    try {
      const active = practiceIds.has(card.id)
      if (active) {
        await DB.removeFromPracticeQueue(user.id, lang, card.id)
        setPracticeIds(prev => { const next = new Set(prev); next.delete(card.id); return next })
      } else {
        await DB.addToPracticeQueue(user.id, lang, card.id)
        setPracticeIds(prev => new Set(prev).add(card.id))
      }
    } finally {
      setPqBusy(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20, color: C.ts }}>იტვირთება...</div>
  }

  if (!card) {
    return <div style={{ padding: 20, color: C.ts }}>სავარჯიშო აღარ არის</div>
  }

  const lvl = getWordLevel(card, lang)

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 10, color: C.ts }}>📈 {count} cards</div>
      <div style={{ ...gls({ padding: 18 }), position: 'relative' }}>
        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>{card.word}</div>
        <div style={{ color: C.ts }}>{card.translation}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={() => next(false)} style={{ padding: '10px 14px' }}>არ ვიცოდი</button>
          <button onClick={() => next(true)} style={{ padding: '10px 14px' }}>ვიცოდი</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={toggleQueue} disabled={pqBusy} style={{ padding: '10px 14px' }}>{practiceIds.has(card.id) ? 'queue-დან ამოღება' : 'queue-ში დამატება'}</button>
          <button onClick={() => speakWord(card.word, lc.code)} style={{ padding: '10px 14px' }}>🔊</button>
        </div>
        {xpFloat ? <div style={{ position: 'absolute', top: 10, right: 10, fontWeight: 900 }}>+{xpFloat} XP</div> : null}
        <div style={{ marginTop: 12, color: C.ts, fontSize: 12 }}>Level: {lvl.level}</div>
      </div>
    </div>
  )
}
