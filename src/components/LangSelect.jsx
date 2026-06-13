import { useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'

export default function LangSelect({ onSelect, isFirstTime = false }) {
  const { C } = useTheme()
  const [sel, setSel] = useState('')

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Inter',system-ui,sans-serif",
      transition: 'background 0.3s'
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {isFirstTime ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.t, marginBottom: 8 }}>
              კეთილი იყოს შენი მობრძანება!
            </div>
            <div style={{ fontSize: 15, color: C.ts, lineHeight: 1.5 }}>
              სანამ დაიწყებ — აირჩიე ენა,<br/>რომლის სწავლასაც გეგმავ
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🌍</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.t }}>ენის შეცვლა</div>
            <div style={{ color: C.ts, fontSize: 14, marginTop: 6 }}>
              ახალი ენა — ახლიდან დაიწყება
            </div>
          </>
        )}
      </div>

      {/* Language buttons */}
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(LANG).map(([key, { name, flag, ka }]) => (
          <button key={key} onClick={() => setSel(key)}
            style={{
              padding: '18px 20px',
              background: sel === key
                ? `linear-gradient(135deg,${C.aG},rgba(168,85,247,0.15))`
                : C.card2,
              border: `2px solid ${sel === key ? C.a : C.bdL}`,
              borderRadius: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              fontFamily: 'inherit', transition: 'all 0.2s',
              transform: sel === key ? 'scale(1.02)' : 'scale(1)',
            }}>
            <span style={{ fontSize: 36 }}>{flag}</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ color: C.t, fontWeight: 700, fontSize: 18 }}>{name}</div>
              <div style={{ color: C.ts, fontSize: 13, marginTop: 2 }}>{ka}</div>
            </div>
            {sel === key && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: C.a, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800
              }}>✓</div>
            )}
          </button>
        ))}

        {/* Continue button */}
        <button onClick={() => sel && onSelect(sel)} disabled={!sel}
          style={{
            marginTop: 12, padding: '16px 0',
            background: sel
              ? `linear-gradient(135deg,${C.a},${C.p})`
              : C.card3,
            border: 'none', borderRadius: 14,
            color: sel ? '#fff' : C.tm, fontSize: 17,
            fontWeight: 800, cursor: sel ? 'pointer' : 'default',
            boxShadow: sel ? `0 4px 24px ${C.aG}` : 'none',
            transition: 'all 0.2s', fontFamily: 'inherit',
            letterSpacing: 0.3,
          }}>
          {sel
            ? `${LANG[sel].flag} ${isFirstTime ? 'სწავლის დაწყება' : 'შეცვლა'} →`
            : 'აირჩიე ენა'}
        </button>

        {/* Info for first time */}
        {isFirstTime && (
          <div style={{
            textAlign: 'center', color: C.tm, fontSize: 12, marginTop: 4, lineHeight: 1.6
          }}>
            შემდეგ ნებისმიერ დროს შეგიძლია შეცვლა<br/>
            პარამეტრები → ენის შეცვლა
          </div>
        )}
      </div>
    </div>
  )
}
