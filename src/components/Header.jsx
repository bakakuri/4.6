import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'

export default function Header({ lang, onSidebar }) {
  const { C, isDark, toggle } = useTheme()
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:56,
                  background: isDark ? 'rgba(7,9,26,0.95)' : 'rgba(244,246,255,0.95)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  borderBottom:`1px solid ${C.bdL}`, display:'flex', alignItems:'center',
                  justifyContent:'space-between', padding:'0 16px',
                  fontFamily:"'Inter',system-ui,sans-serif", transition:'background 0.3s, border-color 0.3s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:24 }}>🌍</span>
        <span style={{ fontWeight:900, fontSize:17, background:`linear-gradient(135deg,${C.a},${C.p})`,
                       WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:-0.5 }}>LinguaMaster</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ background:C.card3, border:`1px solid ${C.bdL}`, borderRadius:8,
                      padding:'4px 10px', fontSize:12, color:C.ts }}>
          {LANG[lang]?.flag} {LANG[lang]?.name}
        </div>
        {/* Theme toggle */}
        <button onClick={toggle}
          style={{ background:C.card3, border:`1px solid ${C.bdL}`, borderRadius:8,
                   width:38, height:38, cursor:'pointer', display:'flex', alignItems:'center',
                   justifyContent:'center', fontSize:18, transition:'all 0.2s' }}
          title={isDark ? 'ღია თემა' : 'მუქი თემა'}>
          {isDark ? '☀️' : '🌙'}
        </button>
        <button onClick={onSidebar}
          style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none', borderRadius:8,
                   width:38, height:38, cursor:'pointer', display:'flex', alignItems:'center',
                   justifyContent:'center', fontSize:18, boxShadow:`0 2px 12px ${C.aG}` }}>📚</button>
      </div>
    </div>
  )
}
