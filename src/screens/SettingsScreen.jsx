import { useTheme } from '../lib/ThemeContext.jsx'
import { useState } from 'react'
import { LANG } from '../theme.js'
import { supabase } from '../lib/supabase.js'

export default function SettingsScreen({ user, lang, onLangChange, onLogout }) {
  const { C, gls } = useTheme()
  const [confirm, setConfirm] = useState(false)
  const [done,    setDone]    = useState(false)
  const [busy,    setBusy]    = useState(false)

  const clearData = async () => {
    setBusy(true)
    // Delete all word progress for this user
    await supabase.from('word_progress').delete().eq('user_id', user.id)
    // Reset analytics in profile
    await supabase.from('profiles').update({ sessions: 0, streak: 0, chat_correct: 0, chat_total: 0 }).eq('id', user.id)
    // Delete activity
    await supabase.from('activity').delete().eq('user_id', user.id)
    setConfirm(false); setDone(true); setBusy(false)
    setTimeout(() => setDone(false), 2500)
  }

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 22 }}>⚙️ პარამეტრები</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{user.username}</div>
      </div>

      {/* Account */}
      <div style={{ ...gls({ padding: 16 }), marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>👤 ანგარიში</div>
        {[
          { label: 'მომხმარებელი', val: user.username },
          { label: 'სტატუსი',       val: user.isAdmin ? 'ადმინი ⚙️' : 'სტუდენტი 📚' },
          { label: 'ენა',           val: `${LANG[lang]?.flag} ${LANG[lang]?.name}` },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.bdL}` }}>
            <span style={{ color: C.ts, fontSize: 14 }}>{r.label}</span>
            <span style={{ color: C.t, fontSize: 14, fontWeight: 600 }}>{r.val}</span>
          </div>
        ))}
      </div>

      {/* Language change */}
      <div style={{ ...gls({ padding: 16 }), marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🌍 ენის შეცვლა</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(LANG).map(([key, { name, flag, ka }]) => (
            <button key={key} onClick={() => onLangChange(key)}
              style={{ padding: '12px 14px', background: lang === key ? `linear-gradient(135deg,${C.aG},rgba(168,85,247,.1))` : C.card3,
                       border: `1px solid ${lang === key ? C.a : 'transparent'}`, borderRadius: 10, cursor: 'pointer',
                       display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
              <span style={{ fontSize: 24 }}>{flag}</span>
              <span style={{ color: C.t, fontWeight: lang === key ? 700 : 400, fontSize: 14 }}>{name}</span>
              <span style={{ color: C.ts, fontSize: 12 }}>({ka})</span>
              {lang === key && <span style={{ marginLeft: 'auto', color: C.g }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div style={{ ...gls({ padding: 16 }), marginBottom: 12, border: `1px solid ${C.r}44` }}>
        <div style={{ color: C.r, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚠️ საფრთხის ზონა</div>
        {done && <div style={{ background: `${C.g}22`, border: `1px solid ${C.g}44`, borderRadius: 10, padding: '10px 14px', marginBottom: 10, color: C.g, fontSize: 14, textAlign: 'center' }}>✅ პროგრესი გაიწმინდა!</div>}
        {!confirm
          ? <button onClick={() => setConfirm(true)}
              style={{ width: '100%', padding: '13px 0', background: `${C.r}22`, border: `1px solid ${C.r}55`, borderRadius: 12, color: C.r, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ პროგრესის გაწმენდა</button>
          : <div>
              <div style={{ color: C.ts, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>დარწმუნებული ხარ? ყველა პროგრესი Supabase-დანაც წაიშლება!</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: '12px 0', background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10, color: C.ts, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>გაუქმება</button>
                <button onClick={clearData} disabled={busy} style={{ flex: 1, padding: '12px 0', background: C.r, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{busy ? '...' : 'წაშლა ✓'}</button>
              </div>
            </div>
        }
      </div>

      <button onClick={onLogout}
        style={{ width: '100%', padding: '14px 0', background: 'transparent', border: `1px solid ${C.bdL}`, borderRadius: 12, color: C.ts, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        🚪 გამოსვლა
      </button>
    </div>
  )
}
