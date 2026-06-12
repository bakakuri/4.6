import { useState } from 'react';
import { C, LANG } from '../theme.js';

export default function LangSelect({ onSelect }) {
  const [sel, setSel] = useState('');
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎯</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.t }}>რომელ ენას ისწავლი?</div>
        <div style={{ color: C.ts, fontSize: 14, marginTop: 6 }}>ახლა ერთი ენა — შეგიძლია მოგვიანებით შეცვალო</div>
      </div>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(LANG).map(([key, { name, flag, ka }]) => (
          <button key={key} onClick={() => setSel(key)} style={{ padding: '18px 20px', background: sel === key ? `linear-gradient(135deg,${C.aG},rgba(168,85,247,0.15))` : C.card2, border: `2px solid ${sel === key ? C.a : C.bdL}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 32 }}>{flag}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: C.t, fontWeight: 700, fontSize: 17 }}>{name}</div>
              <div style={{ color: C.ts, fontSize: 13, marginTop: 2 }}>{ka}</div>
            </div>
            {sel === key && <span style={{ marginLeft: 'auto', fontSize: 22, color: C.g }}>✓</span>}
          </button>
        ))}
        <button onClick={() => sel && onSelect(sel)} disabled={!sel} style={{ marginTop: 8, padding: '15px 0', background: sel ? `linear-gradient(135deg,${C.a},${C.p})` : C.card3, border: 'none', borderRadius: 12, color: sel ? '#fff' : C.tm, fontSize: 16, fontWeight: 700, cursor: sel ? 'pointer' : 'default', boxShadow: sel ? `0 4px 20px ${C.aG}` : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
          გაგრძელება →
        </button>
      </div>
    </div>
  );
}
