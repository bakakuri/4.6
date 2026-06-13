import { useTheme } from '../lib/ThemeContext.jsx'
import { useState } from 'react';
import { LANG, LEVEL_COLORS } from '../theme.js';
import WDB, { allWords, getWordLevel } from '../data/words.js';
import { speakWord } from '../utils/helpers.js';

export default function DictionaryScreen({ lang, activeCat }) {
  const { C, gls } = useTheme()
  const [search, setSearch] = useState('');
  const lc = LANG[lang];
  const ws = allWords(lang);

  const filtered = ws.filter(w => {
    const matchSearch = !search || w.w.toLowerCase().includes(search.toLowerCase()) || w.t.includes(search);
    if (!activeCat || activeCat === 'all') return matchSearch;
    if (activeCat.startsWith('level:')) {
      const lvl  = activeCat.slice(6);
      const lws  = WDB[lang]?.[lvl] || [];
      return matchSearch && lws.some(lw => lw.id === w.id);
    }
    if (activeCat.startsWith('cat:')) return matchSearch && w.cat === activeCat.slice(4);
    return matchSearch;
  });

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 22 }}>📚 ლექსიკონი</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 2 }}>
          {activeCat && activeCat !== 'all' ? `ფილტრი: ${activeCat.split(':')[1]}` : `${ws.length} სიტყვა სულ`}
        </div>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 სიტყვის ძიება..."
        style={{ width: '100%', background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 12, padding: '12px 16px', color: C.t, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'inherit' }}
      />
      <div style={{ color: C.ts, fontSize: 12, marginBottom: 10 }}>{filtered.length} სიტყვა</div>

      {filtered.map(w => {
        const lvl = getWordLevel(lang, w.id);
        return (
          <div key={w.id} style={{ ...gls({ padding: '14px 16px', marginBottom: 10 }), background: C.card2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: C.t, fontWeight: 800, fontSize: 17 }}>{w.w}</span>
                  <button onClick={() => speakWord(w.w, lc.code)} style={{ background: `${C.a}22`, border: 'none', borderRadius: 6, padding: '3px 8px', color: C.a, fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔊</button>
                </div>
                <div style={{ color: C.a, fontSize: 13 }}>{w.ph}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {lvl && <span style={{ background: LEVEL_COLORS[lvl] || C.a, borderRadius: 5, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 800 }}>{lvl}</span>}
                <span style={{ background: C.card3, borderRadius: 5, padding: '2px 6px', fontSize: 10, color: C.ts }}>{w.cat}</span>
              </div>
            </div>
            <div style={{ color: C.gold, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{w.t}</div>
            <div style={{ borderTop: `1px solid ${C.bdL}`, paddingTop: 8 }}>
              <div style={{ color: C.ts, fontSize: 13, fontStyle: 'italic', marginBottom: 3 }}>"{w.ex}"</div>
              <div style={{ color: C.t, fontSize: 13 }}>{w.ext}</div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.tm }}>სიტყვა ვერ მოიძებნა 🔍</div>
      )}
    </div>
  );
}
