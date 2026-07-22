import { useEffect, useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getNextInterval, getNextReviewDate } from '../data/grammarReview.js'

export default function GrammarReviewScreen({ lang, onBack }) {
  const { C, gls } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError) setError(authError.message)
      if (!user) {
        setItems([])
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('grammar_mistakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('lang', lang)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true })
        .limit(50)

      if (!active) return

      if (queryError) setError(queryError.message)
      setItems(data || [])
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [lang])

  const current = items[0]
  const progress = items.length ? Math.round((done / (done + items.length)) * 100) : 100
  const stats = useMemo(() => ({ total: done + items.length, remaining: items.length }), [done, items.length])

  const answer = async isCorrect => {
    if (!current) return

    const previousReviewCount = current.review_count || 0
    const previousMistakeCount = current.mistake_count || 1
    const interval = getNextInterval(previousReviewCount, isCorrect)
    const nextReviewAt = getNextReviewDate(interval)

    const payload = {
      mistake_count: isCorrect ? previousMistakeCount : previousMistakeCount + 1,
      review_count: isCorrect ? previousReviewCount + 1 : 0,
      next_review_at: nextReviewAt,
      updated_at: new Date().toISOString(),
    }

    const { error: saveError } = await supabase
      .from('grammar_mistakes')
      .update(payload)
      .eq('id', current.id)

    if (saveError) setError(saveError.message)

    setDone(value => value + 1)
    setRevealed(false)
    setItems(list => list.slice(1))
  }

  if (loading) {
    return <div style={{ padding: 18, color: C.ts }}>🔁 გამეორებები იტვირთება...</div>
  }

  if (error) {
    return <div style={{ padding: 18, color: C.r }}>⚠️ {error}</div>
  }

  if (!current) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          ← უკან
        </button>
        <div style={{ ...gls({ padding: 24, marginTop: 14 }), textAlign: 'center' }}>
          <div style={{ fontSize: 42 }}>🎉</div>
          <h2 style={{ color: C.t }}>დღევანდელი გამეორება დასრულებულია</h2>
          <p style={{ color: C.ts, lineHeight: 1.7 }}>ყველა დაგროვილი შეცდომა გადაიხედა. ტვინმა დღეს თავისი წილი სამუშაო შეასრულა.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
        ← უკან
      </button>

      <div style={{ marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🔁 Grammar Review</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} {stats.remaining} საკითხი დარჩა</div>
      </div>

      <div style={{ ...gls({ padding: 14, marginBottom: 12 }) }}>
        <div style={{ height: 8, background: C.card3, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.g})` }} />
        </div>
        <div style={{ color: C.ts, fontSize: 12, marginTop: 7 }}>{done}/{stats.total} დასრულებული</div>
      </div>

      <section style={gls({ padding: 18 })}>
        <div style={{ color: C.ts, fontSize: 12 }}>{current.topic}</div>
        <h2 style={{ color: C.t, fontSize: 20, lineHeight: 1.5 }}>{current.question}</h2>

        <div style={{ marginTop: 16, background: C.card3, borderRadius: 12, padding: 14 }}>
          <div style={{ color: C.ts, fontSize: 13 }}>შენი პასუხი</div>
          <div style={{ color: C.t, fontWeight: 800, marginTop: 6 }}>{current.user_answer || 'პასუხი არ არის'}</div>
        </div>

        {revealed && (
          <div style={{ marginTop: 12, borderLeft: `3px solid ${C.g}`, background: C.card3, borderRadius: 10, padding: 13, color: C.ts, lineHeight: 1.7 }}>
            <strong style={{ color: C.g }}>სწორი პასუხი: {current.correct_answer}</strong>
            <br />
            {current.explanation}
          </div>
        )}

        <button onClick={() => setRevealed(true)} disabled={revealed} style={{ width: '100%', marginTop: 14, border: `1px solid ${C.bdL}`, borderRadius: 11, padding: 12, background: C.card2, color: C.t, cursor: revealed ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 800 }}>
          👁️ პასუხის ნახვა
        </button>

        {revealed && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button onClick={() => answer(false)} style={{ border: 'none', borderRadius: 11, padding: 12, background: `${C.r}20`, color: C.r, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800 }}>
              ❌ ისევ რთულია
            </button>
            <button onClick={() => answer(true)} style={{ border: 'none', borderRadius: 11, padding: 12, background: `${C.g}20`, color: C.g, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800 }}>
              ✅ ვიცი
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
