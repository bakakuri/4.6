import { useTheme } from '../lib/ThemeContext.jsx'

const TABS = [
  { id:'home',       icon:'🏠', label:'მთავარი'   },
  { id:'flashcards', icon:'🃏', label:'ფლეშქარდ'  },
  { id:'grammar',    icon:'📖', label:'გრამატიკა' },
  { id:'exercises',  icon:'🎮', label:'ვარჯიში'   },
  { id:'chat',       icon:'💬', label:'ჩათი'      },
  { id:'profile',    icon:'👤', label:'პროფილი'   },
]

export default function BottomNav({ page, onNav, isAdmin }) {
  const { C, isDark } = useTheme()
  const tabs = isAdmin ? [...TABS, { id:'admin', icon:'⚙️', label:'ადმინი' }] : TABS
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100,
                  background: isDark ? 'rgba(7,9,26,0.97)' : 'rgba(244,246,255,0.97)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  borderTop:`1px solid ${C.bdL}`, display:'flex', justifyContent:'space-around',
                  padding:'max(6px,env(safe-area-inset-bottom)) 0 6px',
                  fontFamily:"'Inter',system-ui,sans-serif", transition:'background 0.3s' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onNav(t.id)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                   background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'inherit' }}>
          <span style={{ fontSize:18, filter: page===t.id ? 'none' : 'grayscale(60%) opacity(0.45)', transition:'filter 0.2s' }}>{t.icon}</span>
          <span style={{ fontSize:9, fontWeight: page===t.id ? 700 : 400, color: page===t.id ? C.a : C.tm, transition:'color 0.2s' }}>{t.label}</span>
          {page===t.id && <div style={{ width:18, height:2, background:`linear-gradient(90deg,${C.a},${C.p})`, borderRadius:1, marginTop:1 }} />}
        </button>
      ))}
    </div>
  )
}
