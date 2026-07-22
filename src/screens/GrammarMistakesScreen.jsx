import { useEffect, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function GrammarMistakesScreen({ lang, onBack, onReview }) {
  const { C, gls } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error: queryError } = await supabase.from('grammar_mistakes').select('*').eq('user_id', user.id).eq('lang', lang).order('mistake_count', { ascending: false }).order('updated_at', { ascending: false }).limit(100)
      if (!active) return
      if (queryError) setError(queryError.message)
      setItems(data || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [lang])

  const remove = async id => {
    const { error: e } = await supabase.from('grammar_mistakes').delete().eq('id', id)
    if (e) return setError(e.message)
    setItems(items => items.filter(item => item.id !== id))
  }

  if (loading) return <div style={{ padding: 18, color: C.ts }}>❌ შეცდომები იტვირთება...</div>
  if (error) return <div style={{ padding: 18, color: C.r }}>⚠️ {error}</div>

  return <div style={{ padding: 16 }}>
    <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', marginBottom: 14 }}>← უკან</button>
    <div style={{ marginBottom: 14 }}><div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>❌ ჩემი შეცდომები</div><div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} სულ {items.length} შეცდომა</div></div>
    {items.length === 0 ? <section style={{ ...gls({ padding: 24 }), textAlign: 'center' }}><div style={{ fontSize: 40 }}>🎉</div><h3 style={{ color: C.t }}>შეცდომები არ გაქვს</h3><p style={{ color: C.ts }}>ეს იშვიათი მომენტია. ისიამოვნე, სანამ შემდეგი გრამატიკული წესი მოვა.</p></section> : <div style={{ display: 'grid', gap: 10 }}>{items.map(item => <section key={item.id} style={gls({ padding: 14 })}><div style={{ color: C.ts, fontSize: 12 }}>{item.topic} · {item.exercise_type}</div><div style={{ color: C.t, fontWeight: 800, marginTop: 6, lineHeight: 1.5 }}>{item.question}</div><div style={{ marginTop: 9, color: C.r }}>შენი პასუხი: {item.user_answer || '—'}</div><div style={{ marginTop: 4, color: C.g }}>სწორი პასუხი: {item.correct_answer}</div><div style={{ marginTop: 6, color: C.ts, fontSize: 12 }}>შეცდომები: {item.mistake_count || 1}</div><div style={{ display: 'flex', gap: 8, marginTop: 11 }}><button onClick={() => onReview?.()} style={{ flex: 1, border: 'none', borderRadius: 10, padding: 10, background: C.a, color: '#fff', fontWeight: 800 }}>🔁 Review</button><button onClick={() => remove(item.id)} style={{ border: `1px solid ${C.bdL}`, borderRadius: 10, padding: '10px 12px', background: C.card2, color: C.ts }}>🗑️</button></div></section>)}</div>}
  </div>
}
