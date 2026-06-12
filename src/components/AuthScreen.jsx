import { useState } from 'react';
import { C, gls } from '../theme.js';
import { ls, ss } from '../utils/helpers.js';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [err,  setErr]  = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = (k, type = 'text', ph) => (
    <input
      key={k} type={type} placeholder={ph}
      value={form[k]} onChange={set(k)}
      onKeyDown={(e) => e.key === 'Enter' && handle()}
      style={{ width: '100%', background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 12, padding: '14px 16px', color: C.t, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
    />
  );

  const handle = () => {
    setErr('');
    if (!form.username.trim() || !form.password.trim()) { setErr('შეავსე ყველა ველი'); return; }

    if (mode === 'register') {
      if (form.password !== form.confirm) { setErr('პაროლები არ ემთხვევა'); return; }
      const users = ls('users', {});
      if (users[form.username]) { setErr('მომხმარებელი უკვე არსებობს'); return; }
      users[form.username] = { pw: form.password, isAdmin: form.username === 'admin', joined: Date.now(), photo: null };
      ss('users', users);
      onAuth({ username: form.username, ...users[form.username] });
    } else {
      // Built-in admin shortcut
      if (form.username === 'admin' && form.password === 'admin123') {
        const users = ls('users', {});
        if (!users.admin) { users.admin = { pw: 'admin123', isAdmin: true, joined: Date.now(), photo: null }; ss('users', users); }
        onAuth({ username: 'admin', isAdmin: true, ...users.admin });
        return;
      }
      const users = ls('users', {});
      if (!users[form.username] || users[form.username].pw !== form.password) {
        setErr('არასწორი მომხმარებელი ან პაროლი'); return;
      }
      onAuth({ username: form.username, ...users[form.username] });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg,${C.bg} 0%,#080d2a 50%,${C.bg} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 10 }}>🌍</div>
        <div style={{ fontSize: 30, fontWeight: 900, background: `linear-gradient(135deg,${C.a},${C.p})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -1 }}>LinguaMaster</div>
        <div style={{ color: C.ts, fontSize: 14, marginTop: 4 }}>ენების სწავლის პლატფორმა</div>
      </div>

      <div style={{ width: '100%', maxWidth: 380, ...gls({ padding: 28 }) }}>
        {/* Tab toggle */}
        <div style={{ display: 'flex', marginBottom: 24, background: C.card3, borderRadius: 10, padding: 4 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(''); }} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: mode === m ? C.a : 'transparent', color: mode === m ? '#fff' : C.ts, fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {m === 'login' ? 'შესვლა' : 'რეგისტრაცია'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inp('username', 'text',     'მომხმარებლის სახელი')}
          {inp('password', 'password', 'პაროლი')}
          {mode === 'register' && inp('confirm', 'password', 'გაიმეორე პაროლი')}
          {err && <div style={{ color: C.r, fontSize: 13, textAlign: 'center' }}>{err}</div>}
          <button onClick={handle} style={{ width: '100%', padding: '14px 0', background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4, boxShadow: `0 4px 20px ${C.aG}`, fontFamily: 'inherit' }}>
            {mode === 'login' ? 'შესვლა →' : 'რეგისტრაცია →'}
          </button>
          {mode === 'login' && <div style={{ textAlign: 'center', color: C.tm, fontSize: 12 }}>ადმინი: admin / admin123</div>}
        </div>
      </div>
    </div>
  );
}
