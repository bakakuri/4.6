import { useState } from 'react';
import { C, gls, LANG, LEVELS, LEVEL_COLORS } from '../theme.js';
import WDB, { allWords } from '../data/words.js';
import { getProgress, getStats, ls, ss } from '../utils/helpers.js';

export default function ProfileScreen({ user, lang, onNav }) {
  const [photo, setPhoto] = useState(ls('users', {})[user.username]?.photo || null);
  const st   = getStats(user.username, lang);
  const prog = getProgress(user.username, lang);
  const lc   = LANG[lang];

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setPhoto(url);
      const users = ls('users', {});
      if (users[user.username]) { users[user.username].photo = url; ss('users', users); }
    };
    reader.readAsDataURL(file);
  };

  // per-level stats
  const levelStats = LEVELS.map(lvl => {
    const ws      = WDB[lang]?.[lvl] || [];
    const learned = ws.filter(w => (prog[w.id]?.mastery || 0) >= 100).length;
    return { lvl, total: ws.length, learned, pct: ws.length ? Math.round((learned / ws.length) * 100) : 0 };
  });

  // recent learned words (last 8 with 100% mastery)
  const recentLearned = allWords(lang)
    .filter(w => (prog[w.id]?.mastery || 0) >= 100)
    .sort((a, b) => (prog[b.id]?.ts || 0) - (prog[a.id]?.ts || 0))
    .slice(0, 8);

  const initials = user.username.slice(0, 2).toUpperCase();
  const joined   = ls('users', {})[user.username]?.joined;
  const joinedStr = joined ? new Date(joined).toLocaleDateString('ka-GE') : '—';

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Avatar + user info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <label style={{ cursor: 'pointer', position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.a}`, background: C.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {photo
              ? <img src={photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 26, fontWeight: 800, color: C.a }}>{initials}</span>}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: C.a, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📷</div>
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </label>
        <div>
          <div style={{ color: C.t, fontWeight: 800, fontSize: 20 }}>{user.username}</div>
          <div style={{ color: C.ts, fontSize: 13, marginTop: 2 }}>{lc.flag} {lc.ka} · {joinedStr}-იდან</div>
          {user.isAdmin && <span style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: C.gold, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>⚙️ ადმინი</span>}
        </div>
      </div>

      {/* Overall stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '✅', val: st.learned,       label: 'ნასწავლი', col: C.g    },
          { icon: '🔥', val: st.streak,        label: 'Streak',   col: C.o    },
          { icon: '🎯', val: `${st.accuracy}%`,label: 'სიზუსტე',  col: C.gold },
          { icon: '📅', val: st.sessions,      label: 'სესია',    col: C.a    },
        ].map(s => (
          <div key={s.label} style={{ ...gls({ padding: '12px 8px' }), textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ color: s.col, fontWeight: 900, fontSize: 18, marginTop: 2 }}>{s.val}</div>
            <div style={{ color: C.ts, fontSize: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div style={{ ...gls({ padding: 16 }), marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📊 დონეების პროგრესი</div>
        {levelStats.map(({ lvl, total, learned, pct }) => (
          <div key={lvl} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: LEVEL_COLORS[lvl], borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 800 }}>{lvl}</span>
              </div>
              <span style={{ color: C.ts, fontSize: 12 }}>{learned}/{total}</span>
            </div>
            <div style={{ background: C.card3, borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${LEVEL_COLORS[lvl]},${LEVEL_COLORS[lvl]}88)`, borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chat stats */}
      <div style={{ ...gls({ padding: 16 }), marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>💬 ჩათის სტატისტიკა</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: C.card3, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ color: C.g, fontSize: 22, fontWeight: 900 }}>{st.chatCorrect}</div>
            <div style={{ color: C.ts, fontSize: 12, marginTop: 2 }}>სწორი პასუხი</div>
          </div>
          <div style={{ background: C.card3, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ color: C.a, fontSize: 22, fontWeight: 900 }}>{st.totalAns}</div>
            <div style={{ color: C.ts, fontSize: 12, marginTop: 2 }}>სულ პასუხი</div>
          </div>
        </div>
      </div>

      {/* Recently learned */}
      {recentLearned.length > 0 && (
        <div style={{ ...gls({ padding: 16 }), marginBottom: 14 }}>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🕐 ბოლოს ნასწავლი</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recentLearned.map(w => (
              <div key={w.id} style={{ background: `${C.g}18`, border: `1px solid ${C.g}33`, borderRadius: 8, padding: '5px 10px' }}>
                <span style={{ color: C.t, fontSize: 12, fontWeight: 700 }}>{w.w}</span>
                <span style={{ color: C.ts, fontSize: 11 }}> · {w.t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings link */}
      <button onClick={() => onNav('settings')} style={{ width: '100%', padding: '14px 16px', background: C.card2, border: `1px solid ${C.bdL}`, borderRadius: 14, color: C.t, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
        <span>⚙️ პარამეტრები</span>
        <span style={{ color: C.ts }}>›</span>
      </button>
    </div>
  );
}
