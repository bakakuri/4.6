import { useState } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function AuthScreen() {
  const { C, gls } = useTheme()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username:'', password:'', confirm:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inp = (k, type, ph) => (
    <input key={k} type={type} placeholder={ph} value={form[k]} onChange={set(k)}
      onKeyDown={e => e.key==='Enter' && handle()}
      style={{ width:'100%', background:C.card3, border:`1px solid ${C.bdL}`, borderRadius:12,
               padding:'14px 16px', color:C.t, fontSize:15, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
  )

  const handle = async () => {
    setErr('')
    const { username, password, confirm } = form
    if (!username.trim() || !password.trim()) { setErr('შეავსე ყველა ველი'); return }
    if (mode==='register' && password!==confirm) { setErr('პაროლები არ ემთხვევა'); return }
    if (password.length < 6) { setErr('პაროლი მინ. 6 სიმბოლო'); return }
    setBusy(true)
    const email = `${username.trim().toLowerCase()}@lm.app`
    if (mode==='register') {
      const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ username:username.trim() } } })
      if (error) { setErr(error.message.includes('already registered') ? 'მომხმარებელი უკვე არსებობს' : error.message); setBusy(false); return }
      const { error: le } = await supabase.auth.signInWithPassword({ email, password })
      if (le) { setErr('რეგისტრაცია მოხდა! Supabase → Authentication → Email → "Confirm email" გამორთე.'); setBusy(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Email not confirmed')) setErr('Supabase → Authentication → Providers → Email → "Confirm email" გამორთე.')
        else setErr('არასწორი მომხმარებელი ან პაროლი')
        setBusy(false); return
      }
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.bg} 0%,${C.bg2} 50%,${C.bg} 100%)`,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  padding:24, fontFamily:"'Inter',system-ui,sans-serif", transition:'background 0.3s' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:10 }}>🌍</div>
        <div style={{ fontSize:30, fontWeight:900, background:`linear-gradient(135deg,${C.a},${C.p})`,
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:-1 }}>LinguaMaster</div>
        <div style={{ color:C.ts, fontSize:14, marginTop:4 }}>ენების სწავლის პლატფორმა</div>
      </div>
      <div style={{ width:'100%', maxWidth:380, ...gls({ padding:28 }) }}>
        <div style={{ display:'flex', marginBottom:24, background:C.card3, borderRadius:10, padding:4 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr('') }}
              style={{ flex:1, padding:'9px 0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:14, fontFamily:'inherit', transition:'all .2s', background: mode===m ? C.a : 'transparent', color: mode===m ? '#fff' : C.ts }}>
              {m==='login' ? 'შესვლა' : 'რეგისტრაცია'}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {inp('username','text','მომხმარებლის სახელი')}
          {inp('password','password','პაროლი (მინ. 6 სიმბოლო)')}
          {mode==='register' && inp('confirm','password','გაიმეორე პაროლი')}
          {err && <div style={{ color:C.r, fontSize:12, textAlign:'center', background:`${C.r}11`, border:`1px solid ${C.r}33`, borderRadius:10, padding:'10px 14px', lineHeight:1.5 }}>{err}</div>}
          <button onClick={handle} disabled={busy}
            style={{ width:'100%', padding:'14px 0', background: busy ? C.card3 : `linear-gradient(135deg,${C.a},${C.p})`,
                     border:'none', borderRadius:12, color: busy ? C.ts : '#fff', fontSize:16, fontWeight:700,
                     cursor: busy ? 'default' : 'pointer', fontFamily:'inherit', transition:'all .2s' }}>
            {busy ? '...' : mode==='login' ? 'შესვლა →' : 'რეგისტრაცია →'}
          </button>
          {mode==='login' && <div style={{ textAlign:'center', color:C.tm, fontSize:12 }}>ადმინი: admin / admin123456</div>}
        </div>
      </div>
    </div>
  )
}
