import { C, gls, LANG } from '../theme.js';
import { ls, getStats } from '../utils/helpers.js';

export default function HomeScreen({ user, lang, onNav }) {
  const st  = getStats(user.username, lang);
  const lc  = LANG[lang];
  const pct = st.total ? Math.round((st.learned / st.total) * 100) : 0;
  const days = ['კვ', 'ორ', 'სამ', 'ოთ', 'ხუთ', 'პარ', 'შაბ'];
  const today = new Date().getDay();
  const acts  = Array.from({ length: 7 }, (_, i) => ls(`act_${user.username}_${i}`, 0));

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, color: C.ts }}>გამარჯობა, {user.username}! 👋</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.t, marginTop: 2 }}>სწავლის დრო!</div>
      </div>

      {/* Progress card */}
      <div style={{ ...gls({ padding: 20, marginBottom: 14 }), background: `linear-gradient(135deg,rgba(93,107,255,0.15),rgba(168,85,247,0.08))` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ color: C.ts, fontSize: 12 }}>{lc.flag} {lc.name} · პროგრესი</div>
            <div style={{ color: C.t, fontSize: 22, fontWeight: 900, marginTop: 2 }}>{pct}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: C.gold, fontSize: 26, fontWeight: 900 }}>{st.learned}</div>
            <div style={{ color: C.ts, fontSize: 11 }}>ნასწავლი / {st.total}</div>
          </div>
        </div>
        <div style={{ background: C.card3, borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${C.a},${C.p})`, borderRadius: 6, transition: 'width 0.6s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: C.ts }}>
          <span>🔥 {st.streak} დღე streak</span>
          <span>⚡ {st.inProg} სწავლის პროცესში</span>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { icon: '🃏', label: 'ფლეშქარდები', sub: 'სიტყვების სწავლა',    page: 'flashcards' },
          { icon: '🎮', label: 'ვარჯიში',      sub: 'სხვადასხვა სავარჯიშო', page: 'exercises'  },
          { icon: '📖', label: 'გრამატიკა',    sub: 'წესები და ახსნები',    page: 'grammar'    },
          { icon: '💬', label: 'ჩათი',          sub: 'ვარჯიში სხვებთან',     page: 'chat'       },
        ].map(a => (
          <button key={a.page} onClick={() => onNav(a.page)} style={{ padding: '16px 14px', background: C.card2, border: `1px solid ${C.bdL}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ color: C.t, fontWeight: 700, fontSize: 13 }}>{a.label}</div>
            <div style={{ color: C.ts, fontSize: 11, marginTop: 2 }}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Weekly activity */}
      <div style={{ ...gls({ padding: 16 }), marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>კვირის აქტივობა</div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {days.map((d, i) => {
            const v = Math.min(100, acts[i] || 0);
            const isT = i === today;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 44, background: C.card3, borderRadius: 6, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: `${v}%`, background: isT ? `linear-gradient(180deg,${C.a},${C.p})` : C.a, opacity: isT ? 1 : 0.5, borderRadius: 6, minHeight: v > 0 ? 4 : 0, transition: 'height 0.4s' }} />
                </div>
                <span style={{ fontSize: 9, color: isT ? C.a : C.tm, fontWeight: isT ? 700 : 400 }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'ნასწავლი', val: st.learned,       icon: '✅', col: C.g    },
          { label: 'სესია',    val: st.sessions,       icon: '📅', col: C.a    },
          { label: 'სიზუსტე',  val: `${st.accuracy}%`, icon: '🎯', col: C.gold },
        ].map(s => (
          <div key={s.label} style={{ ...gls({ padding: '12px 10px' }), textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ color: s.col, fontWeight: 900, fontSize: 19, marginTop: 2 }}>{s.val}</div>
            <div style={{ color: C.ts, fontSize: 10, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
