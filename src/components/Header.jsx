import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'

export default function Header({ lang, onSidebar }) {
  const { C, isDark, toggle } = useTheme()
  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100, height:56,
      background: isDark ? 'rgba(7,9,26,0.95)' : 'rgba(244,246,255,0.95)',
      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      borderBottom:`1px solid ${C.bdL}`,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 14px', fontFamily:"'Inter',system-ui,sans-serif",
      transition:'background 0.3s'
    }}>

      {/* ── Logo ─────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        {/* Globe badge */}
        <div style={{
          width:36, height:36, borderRadius:10,
          background:`linear-gradient(135deg,${C.a},${C.p})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:20, boxShadow:`0 2px 14px ${C.aG}`, flexShrink:0
        }}>🌍</div>

        {/* Two-line wordmark */}
        <div style={{ lineHeight:1.1 }}>
          <div style={{ color:C.t, fontWeight:900, fontSize:13, letterSpacing:0.5 }}>LINGUA</div>
          <div style={{ color:C.a,  fontWeight:900, fontSize:13, letterSpacing:0.5 }}>MASTER</div>
        </div>
      </div>

      {/* ── Right controls ────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        {/* Language pill */}
        <div style={{
          background:C.card3, border:`1px solid ${C.bdL}`,
          borderRadius:8, padding:'4px 10px', fontSize:12, color:C.ts,
          display:'flex', alignItems:'center', gap:5
        }}>
          <span>{LANG[lang]?.flag}</span>
          <span style={{ color:C.t, fontWeight:600 }}>{LANG[lang]?.name}</span>
        </div>

        {/* Theme toggle */}
        <button onClick={toggle} title={isDark ? 'ღია თემა' : 'მუქი თემა'}
          style={{
            background:C.card3, border:`1px solid ${C.bdL}`,
            borderRadius:8, width:36, height:36, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:17, transition:'all 0.2s'
          }}>
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Dictionary button */}
        <button onClick={onSidebar}
          style={{
            background:`linear-gradient(135deg,${C.a},${C.p})`,
            border:'none', borderRadius:8, width:36, height:36,
            cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:18,
            boxShadow:`0 2px 12px ${C.aG}`
          }}>📚</button>
      </div>
    </div>
  )
}
