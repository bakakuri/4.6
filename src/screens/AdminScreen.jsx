import { useState } from 'react';
import { C, gls } from '../theme.js';
import WDB from '../data/words.js';
import { ls, ss, getStats } from '../utils/helpers.js';

export default function AdminScreen({ lang }) {
  const [tab,     setTab]     = useState('users');
  const [newWord, setNewWord] = useState({ w: '', t: '', ph: '', cat: '', lvl: 'A1' });
  const [added,   setAdded]   = useState(false);

  const users      = ls('users', {});
  const customWds  = ls('custom_words', []);
  const chatMsgs   = ls('chat_messages', []);

  /* ─── Users tab ─── */
  const UsersTab = () => (
    <div>
      <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>👥 მომხმარებლები ({Object.keys(users).length})</div>
      {Object.entries(users).map(([uname, udata]) => {
        const st = getStats(uname, lang);
        return (
          <div key={uname} style={{ ...gls({ padding: '14px 16px', marginBottom: 10 }), background: C.card2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.a},${C.p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>{uname.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ color: C.t, fontWeight: 700, fontSize: 14 }}>{uname}</div>
                  {udata.isAdmin && <span style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}44`, borderRadius: 4, padding: '1px 6px', fontSize: 10, color: C.gold }}>ადმინი</span>}
                </div>
              </div>
              <div style={{ color: C.ts, fontSize: 11 }}>{udata.joined ? new Date(udata.joined).toLocaleDateString('ka-GE') : '—'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { label: 'ნასწავლი',  val: st.learned       },
                { label: 'სტრიქი',   val: `${st.streak}🔥`  },
                { label: 'სიზუსტე',  val: `${st.accuracy}%` },
              ].map(s => (
                <div key={s.label} style={{ background: C.card3, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: C.a, fontWeight: 800, fontSize: 16 }}>{s.val}</div>
                  <div style={{ color: C.ts, fontSize: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {Object.keys(users).length === 0 && <div style={{ color: C.tm, textAlign: 'center', padding: 30 }}>მომხმარებელი არ არის</div>}
    </div>
  );

  /* ─── Words tab ─── */
  const total = Object.values(WDB[lang] || {}).flat().length;
  const WordsTab = () => (
    <div>
      <div style={{ ...gls({ padding: 14, marginBottom: 14 }), display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: C.ts, fontSize: 12 }}>ჩაშენებული სიტყვები</div>
          <div style={{ color: C.t, fontWeight: 800, fontSize: 20 }}>{total}</div>
        </div>
        <div>
          <div style={{ color: C.ts, fontSize: 12 }}>კასტომი სიტყვები</div>
          <div style={{ color: C.gold, fontWeight: 800, fontSize: 20 }}>{customWds.length}</div>
        </div>
      </div>
      <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>➕ ახალი სიტყვის დამატება</div>
      {[
        { k: 'w',  ph: 'სიტყვა (ორიგინალი)',   type: 'text'   },
        { k: 't',  ph: 'თარგმანი (ქართულად)',  type: 'text'   },
        { k: 'ph', ph: 'ფონეტიკა (/ˈwɜːrd/)', type: 'text'   },
        { k: 'cat',ph: 'კატეგორია',             type: 'text'   },
      ].map(f => (
        <input key={f.k} value={newWord[f.k]} onChange={e => setNewWord(v => ({ ...v, [f.k]: e.target.value }))} placeholder={f.ph}
          style={{ width: '100%', background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10, padding: '11px 14px', color: C.t, fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }} />
      ))}
      <select value={newWord.lvl} onChange={e => setNewWord(v => ({ ...v, lvl: e.target.value }))} style={{ width: '100%', background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10, padding: '11px 14px', color: C.t, fontSize: 14, outline: 'none', marginBottom: 10, fontFamily: 'inherit' }}>
        {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      {added && <div style={{ color: C.g, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>✅ სიტყვა დამატებულია!</div>}
      <button onClick={() => {
        if (!newWord.w || !newWord.t) return;
        const words = ls('custom_words', []);
        words.push({ id: 'cw_' + Date.now(), ...newWord, lang });
        ss('custom_words', words);
        setNewWord({ w: '', t: '', ph: '', cat: '', lvl: 'A1' });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }} style={{ width: '100%', padding: '13px 0', background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        დამატება ➕
      </button>
      {customWds.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>კასტომი სიტყვები:</div>
          {customWds.filter(w => w.lang === lang).map(w => (
            <div key={w.id} style={{ background: C.card3, borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: C.t, fontWeight: 700, fontSize: 13 }}>{w.w}</span>
                <span style={{ color: C.ts, fontSize: 12 }}> · {w.t}</span>
              </div>
              <span style={{ background: C.card4, borderRadius: 4, padding: '2px 6px', fontSize: 10, color: C.ts }}>{w.lvl}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ─── Stats tab ─── */
  const StatsTab = () => {
    const leaderboard = Object.entries(users).map(([uname]) => {
      const st = getStats(uname, lang);
      return { uname, ...st };
    }).sort((a, b) => b.learned - a.learned);

    return (
      <div>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏆 ლიდერბორდი</div>
        {leaderboard.map((u, i) => (
          <div key={u.uname} style={{ ...gls({ padding: '12px 16px', marginBottom: 8 }), display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? C.gold : i === 1 ? '#9ba3af' : '#cd7c3a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 13 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.t, fontWeight: 700, fontSize: 14 }}>{u.uname}</div>
              <div style={{ color: C.ts, fontSize: 11 }}>🔥{u.streak} · 🎯{u.accuracy}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: C.g, fontWeight: 900, fontSize: 16 }}>{u.learned}</div>
              <div style={{ color: C.ts, fontSize: 10 }}>ნასწავლი</div>
            </div>
          </div>
        ))}
        {leaderboard.length === 0 && <div style={{ color: C.tm, textAlign: 'center', padding: 30 }}>მონაცემები არ არის</div>}
      </div>
    );
  };

  /* ─── Chat tab ─── */
  const ChatTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 700, fontSize: 15 }}>💬 ბოლო შეტყობინებები ({chatMsgs.length})</div>
        <button onClick={() => { ss('chat_messages', []); window.location.reload(); }} style={{ background: `${C.r}22`, border: `1px solid ${C.r}44`, borderRadius: 8, padding: '5px 10px', color: C.r, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>გაწმენდა</button>
      </div>
      {chatMsgs.slice(-20).reverse().map(m => (
        <div key={m.id} style={{ background: C.card2, borderRadius: 10, padding: '10px 14px', marginBottom: 6, borderLeft: `3px solid ${m.isBot ? C.a : m.isOwn ? C.p : C.bdL}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: m.isBot ? C.a : C.t, fontWeight: 700, fontSize: 12 }}>{m.from}</span>
            <span style={{ color: C.tm, fontSize: 10 }}>{new Date(m.ts).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ color: C.ts, fontSize: 13, lineHeight: 1.4 }}>{m.text}</div>
        </div>
      ))}
      {chatMsgs.length === 0 && <div style={{ color: C.tm, textAlign: 'center', padding: 30 }}>შეტყობინებები არ არის</div>}
    </div>
  );

  const TABS = [
    { id: 'users', label: 'მომხმარ.', icon: '👥' },
    { id: 'words', label: 'სიტყვები', icon: '📝' },
    { id: 'stats', label: 'სტატ.',    icon: '📊' },
    { id: 'chat',  label: 'ჩათი',     icon: '💬' },
  ];

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ color: C.t, fontWeight: 800, fontSize: 22, marginBottom: 16 }}>⚙️ ადმინ პანელი</div>

      <div style={{ display: 'flex', background: C.card3, borderRadius: 12, padding: 4, marginBottom: 18, gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 0', background: tab === t.id ? C.a : 'transparent', border: 'none', borderRadius: 9, cursor: 'pointer', color: tab === t.id ? '#fff' : C.ts, fontSize: 11, fontWeight: tab === t.id ? 700 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontFamily: 'inherit' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'words' && <WordsTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'chat'  && <ChatTab  />}
    </div>
  );
}
