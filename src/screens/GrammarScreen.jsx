import { useTheme } from '../lib/ThemeContext.jsx'
import { useState } from 'react';
import { LANG } from '../theme.js';
import GR from '../data/grammar.js';

function renderBody(body) {
  return body.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    // Bold line (entire line is **text**)
    if (/^\*\*.*\*\*$/.test(line.trim())) {
      return <div key={i} style={{ color: C.t, fontWeight: 700, fontSize: 14, marginTop: 10, marginBottom: 2 }}>{line.replace(/\*\*/g, '')}</div>;
    }
    // Line with inline bold
    if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} style={{ color: C.ts, fontSize: 14, lineHeight: 1.7, marginBottom: 2 }}>
          {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: C.t }}>{p.replace(/\*\*/g, '')}</strong> : p)}
        </div>
      );
    }
    return <div key={i} style={{ color: C.ts, fontSize: 14, lineHeight: 1.7, marginBottom: 2 }}>{line}</div>;
  });
}

function TopicView({ cat, topic, onBack }) {
  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10, padding: '8px 14px', color: C.ts, fontSize: 14, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>{cat}</div>
      <div style={{ color: C.t, fontWeight: 800, fontSize: 20, marginBottom: 20 }}>{topic.title}</div>
      <div style={{ ...gls({ padding: 20 }), marginBottom: 16 }}>{renderBody(topic.body)}</div>
      {topic.ex && (
        <div style={{ ...gls({ padding: 16 }) }}>
          <div style={{ color: C.a, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📌 მაგალითები</div>
          {topic.ex.map((ex, i) => (
            <div key={i} style={{ background: C.card3, borderRadius: 10, padding: '10px 14px', marginBottom: 8, borderLeft: `3px solid ${C.a}`, color: C.t, fontSize: 14 }}>{ex}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryView({ catObj, onBack, onTopic }) {
  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10, padding: '8px 14px', color: C.ts, fontSize: 14, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ color: C.t, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{catObj.icon} {catObj.cat}</div>
      <div style={{ color: C.ts, fontSize: 13, marginBottom: 20 }}>{catObj.topics.length} თემა</div>
      {catObj.topics.map((t, i) => (
        <button key={i} onClick={() => onTopic(t)} style={{ width: '100%', textAlign: 'left', padding: 16, background: C.card2, border: `1px solid ${C.bdL}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
          <div style={{ color: C.ts, fontSize: 12 }}>{t.ex?.[0] || ''}</div>
          <div style={{ color: C.a, fontSize: 12, marginTop: 6 }}>→ სწავლა</div>
        </button>
      ))}
    </div>
  );
}

export default function GrammarScreen({ lang }) {
  const { C, gls } = useTheme()
  const [selCat,   setSelCat]   = useState(null);
  const [selTopic, setSelTopic] = useState(null);
  const cats = GR[lang] || GR['english'];

  if (selCat && selTopic) return <TopicView cat={selCat.cat} topic={selTopic} onBack={() => setSelTopic(null)} />;
  if (selCat)             return <CategoryView catObj={selCat} onBack={() => setSelCat(null)} onTopic={setSelTopic} />;

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 22 }}>📖 გრამატიკა</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} {LANG[lang]?.name} · კატეგორიები</div>
      </div>
      {cats.map((cat, i) => (
        <button key={i} onClick={() => setSelCat(cat)} style={{ width: '100%', textAlign: 'left', padding: 18, background: `linear-gradient(135deg,${C.card2},${C.card3})`, border: `1px solid ${C.bdL}`, borderRadius: 16, marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 28 }}>{cat.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.t, fontWeight: 700, fontSize: 16 }}>{cat.cat}</div>
            <div style={{ color: C.ts, fontSize: 12, marginTop: 3 }}>{cat.topics.length} თემა: {cat.topics.map(t => t.title).join(', ').slice(0, 55)}…</div>
          </div>
          <span style={{ color: C.a, fontSize: 18 }}>›</span>
        </button>
      ))}
    </div>
  );
}
