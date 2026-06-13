import { LEVELS, LEVEL_COLORS, CATS } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'

const LEVEL_NAMES = { A1:'დამწყები', A2:'ელემენტარული', B1:'საშუალო', B2:'ზედა-საშუალო', C1:'მოწინავე', C2:'ექსპერტი' }

export default function Sidebar({ open, onClose, onNav, activeCat, onCat }) {
  const { C, isDark } = useTheme()
  const pick = (val) => { onCat(val); onNav('dictionary'); onClose() }
  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200, backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)' }} />}
      <div style={{ position:'fixed', top:0, right: open ? 0 : '-100%', width:282, height:'100vh',
                    background:C.bg2, borderLeft:`1px solid ${C.bdL}`, zIndex:201,
                    transition:'right 0.3s cubic-bezier(0.4,0,0.2,1)', display:'flex', flexDirection:'column',
                    fontFamily:"'Inter',system-ui,sans-serif" }}>
        <div style={{ padding:'16px', borderBottom:`1px solid ${C.bdL}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:800, color:C.t, fontSize:17 }}>📖 ლექსიკონი</div>
          <button onClick={onClose} style={{ background:C.card3, border:`1px solid ${C.bdL}`, borderRadius:8, width:34, height:34, cursor:'pointer', color:C.ts, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'12px' }}>
          <div style={{ fontSize:10, color:C.tm, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1.2 }}>დონეები</div>
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={() => pick('level:'+lvl)}
              style={{ width:'100%', textAlign:'left', padding:'10px 12px',
                       background: activeCat==='level:'+lvl ? `linear-gradient(135deg,${C.aG},rgba(168,85,247,0.1))` : 'transparent',
                       border:`1px solid ${activeCat==='level:'+lvl ? C.a : 'transparent'}`,
                       borderRadius:10, cursor:'pointer', color: activeCat==='level:'+lvl ? C.t : C.ts,
                       fontSize:13, fontWeight:600, marginBottom:4, display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
              <span style={{ background:LEVEL_COLORS[lvl], borderRadius:4, padding:'2px 7px', fontSize:10, color:'#fff', fontWeight:800 }}>{lvl}</span>
              {LEVEL_NAMES[lvl]}
            </button>
          ))}
          <div style={{ fontSize:10, color:C.tm, fontWeight:700, marginTop:14, marginBottom:8, textTransform:'uppercase', letterSpacing:1.2 }}>კატეგორიები</div>
          {CATS.map(cat => (
            <button key={cat} onClick={() => pick('cat:'+cat)}
              style={{ width:'100%', textAlign:'left', padding:'9px 12px',
                       background: activeCat==='cat:'+cat ? `linear-gradient(135deg,${C.aG},rgba(168,85,247,0.1))` : 'transparent',
                       border:`1px solid ${activeCat==='cat:'+cat ? C.a : 'transparent'}`,
                       borderRadius:10, cursor:'pointer', color: activeCat==='cat:'+cat ? C.t : C.ts,
                       fontSize:13, marginBottom:3, fontFamily:'inherit' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
