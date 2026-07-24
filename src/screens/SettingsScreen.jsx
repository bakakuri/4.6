import { useEffect, useState } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { supabase } from '../lib/supabase.js'
import { getProgress, updateUserSettings } from '../utils/db.js'
import { allWords } from '../data/words.js'

const FONT_SIZES = [
  { id: 'sm', label: 'პატარა', val: 90 },
  { id: 'md', label: 'ნორმ.', val: 100 },
  { id: 'lg', label: 'დიდი', val: 115 },
  { id: 'xl', label: 'ძალ. დ.', val: 130 },
]

export default function SettingsScreen({ user, lang, onLangChange, onLogout, onNav, onProfileChange }) {
  const { C, gls, isDark, toggle, fontSize, setFontSize } = useTheme()
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [exporting, setExporting] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(Boolean(user?.notif_enabled))

  useEffect(() => {
    setNotifEnabled(Boolean(user?.notif_enabled))
  }, [user?.notif_enabled])

  const applyFont = async (id) => {
    setFontSize(id)
    if (user?.id) {
      await updateUserSettings(user.id, { font_size: id })
      onProfileChange?.({ font_size: id })
    }
  }

  const toggleTheme = async () => {
    toggle()
    if (user?.id) {
      const nextMode = isDark ? 'light' : 'dark'
      await updateUserSettings(user.id, { theme_mode: nextMode })
      onProfileChange?.({ theme_mode: nextMode })
    }
  }

  const requestNotif = async () => {
    if (!('Notification' in window) || !user?.id) return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
    const enabled = perm === 'granted'
    setNotifEnabled(enabled)
    await updateUserSettings(user.id, { notif_enabled: enabled })
    onProfileChange?.({ notif_enabled: enabled })
    if (enabled) {
      new Notification('LinguaMaster', {
        body: 'შეტყობინებები ჩართულია! ყოველდღიური სწავლისთვის გახდები შეხსენება.',
        icon: '/icon.svg',
      })
    }
  }

  const exportCSV = async () => {
    setExporting(true)
    const progress = await getProgress(user.id, lang)
    const words = allWords(lang).filter(w => (progress[w.id]?.mastery || 0) >= 100)
    const bom = '\uFEFF'
    const header = 'სიტყვა,თარგმანი,IPA,კატეგორია,დონე,მასტერი'
    const rows = words.map(w => `"${w.w}","${w.t}","${w.ph}","${w.cat}","${w.id.match(/[A-Z]\d/)?.[0] || ''}","${progress[w.id]?.mastery || 0}"`)
    const csv = bom + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `linguamaster-${lang}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    setExporting(false)
  }

  const clearData = async () => {
    setBusy(true)
    await supabase.from('word_progress').delete().eq('user_id', user.id)
    await supabase.from('profiles').update({ sessions: 0, streak: 0, chat_correct: 0, chat_total: 0, xp: 0, achievements: [], last_active: null }).eq('id', user.id)
    await supabase.from('activity').delete().eq('user_id', user.id)
    setConfirm(false); setDone(true); setBusy(false)
    setTimeout(() => setDone(false), 2500)
  }

  const NotifIcon = () => {
    if (notifPerm === 'granted' || notifEnabled) return <span style={{ color: C.g }}>✅ ჩართული</span>
    if (notifPerm === 'denied') return <span style={{ color: C.r }}>🚫 დაბლოკილი</span>
    return <span style={{ color: C.a, cursor: 'pointer' }} onClick={requestNotif}>📲 ჩართვა</span>
  }

  return (
    <div className="page-enter" style={{ padding: '16px 16px 24px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ color: C.t, fontWeight: 800, fontSize: 22, marginBottom: 20 }}>⚙️ პარამეტრები</div>

      <div style={{ ...gls({ padding: 16 }), marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>👤 ანგარიში</div>
        {[
          { label: 'მომხმარებელი', val: user.username },
          { label: 'სტატუსი', val: user.isAdmin ? 'ადმინი ⚙️' : 'სტუდენტი 📚' },
          { label: 'ენა', val: (LANG[lang]?.flag || '') + ' ' + (LANG[lang]?.name || '') },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.bdL }}>
            <span style={{ color: C.ts, fontSize: 14 }}>{r.label}</span>
            <span style={{ color: C.t, fontSize: 14, fontWeight: 600 }}>{r.val}</span>
          </div>
        ))}
      </div>

      <div style={{ ...gls({ padding: 16 }), marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🎨 გარეგნობა</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={toggleTheme} className="tap" style={{ width: '100%', padding: '12px 14px', background: C.card3, border: '1px solid ' + C.bdL, borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
            <span style={{ color: C.t, fontWeight: 600, fontSize: 14 }}>Theme mode</span>
            <span style={{ color: C.ts, fontSize: 12 }}>{isDark ? 'Dark' : 'Light'}</span>
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {FONT_SIZES.map(f => (
              <button key={f.id} onClick={() => applyFont(f.id)} className="tap" style={{ flex: 1, padding: '9px 4px', background: fontSize === f.id ? C.a : C.card3, border: '1px solid ' + (fontSize === f.id ? C.a : C.bdL), borderRadius: 10, color: fontSize === f.id ? '#fff' : C.ts, fontSize: 11, fontWeight: fontSize === f.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ color: C.ts, fontSize: 11, marginTop: 6, textAlign: 'center' }}>{FONT_SIZES.find(f => f.id === fontSize)?.val}% · ცვლა დაუყოვნებლად ხდება</div>
        </div>
      </div>

      <div style={{ ...gls({ padding: 16 }), marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🔔 შეტყობინებები</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: C.t, fontSize: 13 }}>Push Notifications</div>
            <div style={{ color: C.ts, fontSize: 11, marginTop: 2 }}>&quot;დღეს ჯერ არ გისწავლია!&quot;</div>
          </div>
          <NotifIcon />
        </div>
        {notifPerm === 'denied' && <div style={{ color: C.ts, fontSize: 11, marginTop: 8, background: C.card3, borderRadius: 8, padding: '8px 10px' }}>ბრაუზერის პარამეტრებში ხელით ჩართე შეტყობინებები</div>}
      </div>

      <div style={{ ...gls({ padding: 16 }), marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📤 მონაცემები</div>
        <button onClick={exportCSV} disabled={exporting} className="tap" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: C.card3, border: '1px solid ' + C.bdL, borderRadius: 12, padding: '13px 14px', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: C.t, fontWeight: 600, fontSize: 14 }}>{exporting ? 'ექსპორტი...' : 'CSV ექსპორტი'}</div>
            <div style={{ color: C.ts, fontSize: 11 }}>ნასწავლი სიტყვები Excel/Google Sheets-ში</div>
          </div>
          <span style={{ marginLeft: 'auto', color: C.a }}>↓</span>
        </button>

        <button onClick={() => onNav('customWords')} className="tap" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: C.card3, border: '1px solid ' + C.bdL, borderRadius: 12, padding: '13px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: C.t, fontWeight: 600, fontSize: 14 }}>Custom სიტყვები</div>
            <div style={{ color: C.ts, fontSize: 11 }}>შენი საკუთარი სიტყვების სია</div>
          </div>
          <span style={{ marginLeft: 'auto', color: C.a }}>›</span>
        </button>
      </div>

      <div style={{ ...gls({ padding: 16 }), marginBottom: 12, border: '1px solid ' + C.r + '44' }}>
        <div style={{ color: C.r, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚠️ საფრთხის ზონა</div>
        {done && <div style={{ background: C.g + '22', border: '1px solid ' + C.g + '44', borderRadius: 10, padding: '10px 14px', marginBottom: 10, color: C.g, fontSize: 14, textAlign: 'center' }}>✅ პროგრესი გაიწმინდა!</div>}
        {!confirm ? <button onClick={() => setConfirm(true)} style={{ width: '100%', padding: '13px 0', background: C.r + '22', border: '1px solid ' + C.r + '55', borderRadius: 12, color: C.r, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ პროგრესის წაშლა</button> : <div><div style={{ color: C.ts, fontSize: 13, marginBottom: 6, textAlign: 'center', fontWeight: 700 }}>დარწმუნებული ხარ?</div><div style={{ color: C.ts, fontSize: 12, marginBottom: 12, textAlign: 'center', lineHeight: 1.6 }}>წაიშლება ნასწავლი სიტყვები, XP, Level, Streak, მიღწევები — ყველაფერი!</div><div style={{ display: 'flex', gap: 8 }}><button onClick={() => setConfirm(false)} style={{ flex: 1, padding: '12px 0', background: C.card3, border: '1px solid ' + C.bdL, borderRadius: 10, color: C.ts, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>გაუქმება</button><button onClick={clearData} disabled={busy} style={{ flex: 1, padding: '12px 0', background: C.r, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{busy ? '...' : 'წაშლა ✓'}</button></div></div>}
      </div>

      <button onClick={onLogout} className="tap" style={{ width: '100%', padding: '14px 0', background: 'transparent', border: '1px solid ' + C.bdL, borderRadius: 12, color: C.ts, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 გამოსვლა</button>
    </div>
  )
}
