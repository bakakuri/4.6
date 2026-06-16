import { useTheme } from '../lib/ThemeContext.jsx'

const TABS = [
  { id:'home',       icon:'🏠', label:'მთავარი'   },
  { id:'flashcards', icon:'🃏', label:'ფლეშქარდ'  },
  { id:'grammar',    icon:'📖', label:'გრამატიკა' },
  { id:'exercises',  icon:'🎮', label:'ვარჯიში'   },
  { id:'chat',       icon:'💬', label:'ჩათი'      },
  { id:'profile',    icon:'👤', label:'პროფილი'   },
]

export default function BottomNav({ page, onNav, isAdmin, friendReqCount = 0, dmCount = 0 }) {
  const { C, isDark } = useTheme()
  const tabs = isAdmin ? [...TABS, { id:'admin', icon:'⚙️', label:'ადმინი' }] : TABS
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100,
                  background: isDark ? 'rgba(7,9,26,0.97)' : 'rgba(244,246,255,0.97)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  borderTop:`1px solid ${C.bdL}`,
                  fontFamily:"'Inter',system-ui,sans-serif", transition:'background 0.3s' }}>
      <div style={{ maxWidth:480, margin:'0 auto', display:'flex', justifyContent:'space-around',
                    padding:'max(6px,env(safe-area-inset-bottom)) 0 6px' }}>
        {tabs.map(t => {
          const active = page === t.id
          const badge = t.id === 'chat' ? dmCount : t.id === 'profile' ? friendReqCount : 0
          return (
            <button key={t.id} onClick={() => onNav(t.id)}
              className="tap"
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                       background:'none', border:'none', cursor:'pointer', padding:'4px 0',
                       fontFamily:'inherit', position:'relative' }}>
              <span key={active ? t.id+'-on' : t.id+'-off'}
                className={active ? 'pop-in' : ''}
                style={{ fontSize:18, filter: active ? 'none' : 'grayscale(60%) opacity(0.45)',
                         transition:'filter 0.2s', display:'inline-block' }}>
                {t.icon}
              </span>
              {badge > 0 && (
                <div style={{ position:'absolute', top:0, right:'18%',
                  background:C.r, color:'#fff', borderRadius:8,
                  minWidth:16, height:16, fontSize:9, fontWeight:800,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  padding:'0 4px', lineHeight:1, pointerEvents:'none' }}>
                  {badge > 9 ? '9+' : badge}
                </div>
              )}
              <span style={{ fontSize:9, fontWeight: active ? 700 : 400,
                color: active ? C.a : C.tm, transition:'color 0.2s' }}>
                {t.label}
              </span>
              {active && (
                <div style={{ width:18, height:2,
                  background:`linear-gradient(90deg,${C.a},${C.p})`,
                  borderRadius:1, marginTop:1 }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
