import { useState, useEffect, useCallback } from 'react';
import { C, gls, LANG } from '../theme.js';
import { allWords } from '../data/words.js';
import { rnd, speakWord } from '../utils/helpers.js'
import { recordCorrect, recordAnswer } from '../utils/db.js';

/* ─── shared button styles ─── */
const exitBtn  = { background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 8, padding: '5px 10px', color: C.ts, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const checkBtn = (disabled) => ({ width: '100%', padding: '13px 0', background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: disabled ? 0.4 : 1, fontFamily: 'inherit' });
const textInp  = (ok) => ({ width: '100%', background: ok === true ? `${C.g}22` : ok === false ? `${C.r}22` : C.card3, border: `1px solid ${ok === true ? C.g : ok === false ? C.r : C.bdL}`, borderRadius: 12, padding: '14px 16px', color: C.t, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit' });

/* ══════════════ 1. Multiple Choice ══════════════ */
function MultiChoice({ user, lang, onExit }) {
  const ws = allWords(lang);
  const [q,     setQ]     = useState(null);
  const [opts,  setOpts]  = useState([]);
  const [sel,   setSel]   = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const next = useCallback(() => {
    const word  = rnd(ws);
    const wrong = ws.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.t);
    setQ(word);
    setOpts([word.t, ...wrong].sort(() => Math.random() - 0.5));
    setSel(null);
  }, [ws]);

  useEffect(() => { next(); }, []); // eslint-disable-line

  const pick = (opt) => {
    if (sel) return;
    setSel(opt);
    recordAnswer(user.username);
    if (opt === q.t) { setScore(s => s + 1); recordCorrect(user.username); }
    setTotal(v => v + 1);
    setTimeout(next, 1200);
  };

  if (!q) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: C.ts, fontSize: 13 }}>სწორი: {score}/{total}</span>
        <button onClick={onExit} style={exitBtn}>გასვლა</button>
      </div>
      <div style={{ ...gls({ padding: 20, marginBottom: 16 }), textAlign: 'center', background: `linear-gradient(135deg,${C.card2},${C.card3})` }}>
        <div style={{ color: C.ts, fontSize: 12, marginBottom: 8 }}>{LANG[lang].flag} {q.ph}</div>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 28, marginBottom: 8 }}>{q.w}</div>
        <div style={{ color: C.ts, fontSize: 13, fontStyle: 'italic' }}>"{q.ex}"</div>
        <button onClick={() => speakWord(q.w, LANG[lang].code)} style={{ marginTop: 10, background: `${C.a}22`, border: 'none', borderRadius: 8, padding: '6px 14px', color: C.a, fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔊 ხმა</button>
      </div>
      <div style={{ color: C.ts, fontSize: 13, marginBottom: 10, textAlign: 'center' }}>📌 აირჩიე სწორი თარგმანი</div>
      {opts.map((opt, i) => {
        const isCorrect = opt === q.t;
        const isWrong   = sel && opt === sel && !isCorrect;
        const bg     = sel ? (isCorrect ? `${C.g}22` : isWrong ? `${C.r}22` : C.card2) : C.card2;
        const border = sel ? (isCorrect ? `1px solid ${C.g}66` : isWrong ? `1px solid ${C.r}66` : `1px solid ${C.bdL}`) : `1px solid ${C.bdL}`;
        const col    = sel ? (isCorrect ? C.g : isWrong ? C.r : C.t) : C.t;
        return (
          <button key={i} onClick={() => pick(opt)} style={{ width: '100%', padding: '14px 16px', background: bg, border, borderRadius: 12, color: col, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 8, textAlign: 'left', fontFamily: 'inherit' }}>
            {sel && isCorrect ? '✅ ' : (sel && isWrong ? '❌ ' : '')}{opt}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════ 2. Fill in the Blank ══════════════ */
function FillBlank({ user, lang, onExit }) {
  const ws = allWords(lang);
  const [q,     setQ]     = useState(null);
  const [inp,   setInp]   = useState('');
  const [res,   setRes]   = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const next = useCallback(() => { setQ(rnd(ws)); setInp(''); setRes(null); }, [ws]);
  useEffect(() => { next(); }, []); // eslint-disable-line

  const check = () => {
    if (!inp.trim() || res !== null) return;
    const ok = inp.trim().toLowerCase() === q.w.toLowerCase();
    setRes(ok);
    setTotal(v => v + 1);
    recordAnswer(user.username);
    if (ok) { setScore(s => s + 1); recordCorrect(user.username); }
    setTimeout(next, 1600);
  };

  if (!q) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: C.ts, fontSize: 13 }}>სწორი: {score}/{total}</span>
        <button onClick={onExit} style={exitBtn}>გასვლა</button>
      </div>
      <div style={{ ...gls({ padding: 20, marginBottom: 16 }), background: C.card2 }}>
        <div style={{ color: C.ts, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>✍️ ჩაწერე ქართული თარგმანიდან</div>
        <div style={{ color: C.gold, fontSize: 24, fontWeight: 900, textAlign: 'center', marginBottom: 10 }}>{q.t}</div>
        <div style={{ color: C.ts, fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>"{q.ext}"</div>
      </div>
      <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder={`${LANG[lang].name}-ად ჩაწერე...`} disabled={res !== null} style={textInp(res)} />
      {res !== null && <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: res ? C.g : C.r, marginBottom: 8 }}>{res ? '✅ სწორია!' : `❌ სწორი: ${q.w}`}</div>}
      <button onClick={check} disabled={res !== null || !inp.trim()} style={checkBtn(res !== null || !inp.trim())}>შემოწმება ✓</button>
    </div>
  );
}

/* ══════════════ 3. Memory Match ══════════════ */
function MemoryGame({ lang, onExit }) {
  const ws = allWords(lang).sort(() => Math.random() - 0.5).slice(0, 6);
  const [cards] = useState(() =>
    [...ws.map((w, i) => ({ id: `w${i}`, word: w.w, pair: w.id })),
     ...ws.map((w, i) => ({ id: `t${i}`, word: w.t,  pair: w.id }))]
    .sort(() => Math.random() - 0.5)
  );
  const [open,    setOpen]    = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves,   setMoves]   = useState(0);

  const flip = (card) => {
    if (open.length === 2 || matched.includes(card.pair) || open.some(c => c.id === card.id)) return;
    const nOpen = [...open, card];
    setOpen(nOpen);
    if (nOpen.length === 2) {
      setMoves(m => m + 1);
      if (nOpen[0].pair === nOpen[1].pair) { setMatched(m => [...m, nOpen[0].pair]); setOpen([]); }
      else setTimeout(() => setOpen([]), 1000);
    }
  };

  const done = matched.length === ws.length;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: C.ts, fontSize: 13 }}>ნაბიჯი: {moves} · {matched.length}/{ws.length} ✅</span>
        <button onClick={onExit} style={exitBtn}>გასვლა</button>
      </div>
      {done && <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 20, color: C.g, fontWeight: 800 }}>🎉 გამარჯვება! {moves} ნაბიჯი</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {cards.map(card => {
          const isOpen = open.some(c => c.id === card.id) || matched.includes(card.pair);
          return (
            <button key={card.id} onClick={() => flip(card)} style={{ height: 70, background: isOpen ? (matched.includes(card.pair) ? `${C.g}22` : C.card3) : C.card2, border: `1px solid ${isOpen ? (matched.includes(card.pair) ? C.g : C.a) : C.bdL}`, borderRadius: 12, cursor: 'pointer', color: isOpen ? C.t : C.bg, fontSize: isOpen ? 12 : 20, fontWeight: 700, transition: 'all 0.3s', fontFamily: 'inherit', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.3 }}>
              {isOpen ? card.word : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════ 4. Word Scramble ══════════════ */
function Scramble({ user, lang, onExit }) {
  const ws = allWords(lang);
  const [q,       setQ]       = useState(null);
  const [letters, setLetters] = useState([]);
  const [ans,     setAns]     = useState([]);
  const [res,     setRes]     = useState(null);
  const [score,   setScore]   = useState(0);
  const [total,   setTotal]   = useState(0);

  const next = useCallback(() => {
    const w    = rnd(ws);
    const lets = [...w.w.toUpperCase()].map((l, i) => ({ l, i, used: false })).sort(() => Math.random() - 0.5);
    setQ(w); setLetters(lets); setAns([]); setRes(null);
  }, [ws]);

  useEffect(() => { next(); }, []); // eslint-disable-line

  const addLetter = (idx) => {
    if (letters[idx].used) return;
    setLetters(prev => prev.map((lt, i) => i === idx ? { ...lt, used: true } : lt));
    setAns(a => [...a, { l: letters[idx].l, fromIdx: idx }]);
  };

  const removeLast = () => {
    if (!ans.length) return;
    const last = ans[ans.length - 1];
    setLetters(prev => prev.map((lt, i) => i === last.fromIdx ? { ...lt, used: false } : lt));
    setAns(a => a.slice(0, -1));
  };

  const check = () => {
    if (!ans.length || res !== null) return;
    const word = ans.map(a => a.l).join('');
    const ok   = word === q.w.toUpperCase();
    setRes(ok); setTotal(v => v + 1);
    recordAnswer(user.username);
    if (ok) { setScore(s => s + 1); recordCorrect(user.username); }
    setTimeout(next, 1500);
  };

  if (!q) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: C.ts, fontSize: 13 }}>სწორი: {score}/{total}</span>
        <button onClick={onExit} style={exitBtn}>გასვლა</button>
      </div>
      <div style={{ ...gls({ padding: 20, marginBottom: 16 }), textAlign: 'center' }}>
        <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>🧩 დაალაგე ასოები</div>
        <div style={{ color: C.gold, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{q.t}</div>
        <div style={{ color: C.ts, fontSize: 12, fontStyle: 'italic' }}>"{q.ext}"</div>
      </div>
      {/* Answer tray */}
      <div style={{ minHeight: 50, background: C.card3, borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', border: `1px solid ${res === true ? C.g : res === false ? C.r : C.bdL}` }}>
        {ans.length === 0 && <span style={{ color: C.tm, fontSize: 13 }}>ასოები გამოჩნდება აქ...</span>}
        {ans.map((a, i) => <span key={i} style={{ background: C.card4, borderRadius: 6, width: 30, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.t, fontWeight: 700, fontSize: 16 }}>{a.l}</span>)}
      </div>
      {/* Letter tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
        {letters.map((lt, i) => (
          <button key={i} onClick={() => addLetter(i)} disabled={lt.used} style={{ width: 38, height: 40, background: lt.used ? C.card3 : C.card2, border: `1px solid ${C.bdL}`, borderRadius: 8, color: lt.used ? C.tm : C.t, fontWeight: 700, fontSize: 16, cursor: lt.used ? 'default' : 'pointer', fontFamily: 'inherit' }}>{lt.l}</button>
        ))}
      </div>
      {res !== null && <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: res ? C.g : C.r, marginBottom: 8 }}>{res ? '✅ სწორია!' : `❌ სწორი: ${q.w}`}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={removeLast} style={{ flex: 1, padding: '11px 0', background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 10, color: C.ts, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>⌫ წაშლა</button>
        <button onClick={check} disabled={!ans.length || res !== null} style={{ flex: 2, ...checkBtn(!ans.length || res !== null), padding: '11px 0' }}>შემოწმება ✓</button>
      </div>
    </div>
  );
}

/* ══════════════ 5. Listening ══════════════ */
function Listening({ user, lang, onExit }) {
  const ws = allWords(lang);
  const lc = LANG[lang];
  const [q,     setQ]     = useState(null);
  const [inp,   setInp]   = useState('');
  const [res,   setRes]   = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const next = useCallback(() => { const w = rnd(ws); setQ(w); setInp(''); setRes(null); }, [ws]);
  useEffect(() => { next(); }, []); // eslint-disable-line
  useEffect(() => { if (q) speakWord(q.w, lc.code); }, [q]); // eslint-disable-line

  const check = () => {
    if (!inp.trim() || res !== null) return;
    const ok = inp.trim().toLowerCase() === q.w.toLowerCase();
    setRes(ok); setTotal(v => v + 1);
    recordAnswer(user.username);
    if (ok) { setScore(s => s + 1); recordCorrect(user.username); }
    setTimeout(next, 1600);
  };

  if (!q) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: C.ts, fontSize: 13 }}>სწორი: {score}/{total}</span>
        <button onClick={onExit} style={exitBtn}>გასვლა</button>
      </div>
      <div style={{ ...gls({ padding: 24, marginBottom: 16 }), textAlign: 'center' }}>
        <div style={{ color: C.ts, fontSize: 13, marginBottom: 16 }}>🎧 მოუსმინე და ჩაწერე</div>
        <button onClick={() => speakWord(q.w, lc.code)} style={{ background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 16, padding: '18px 32px', color: '#fff', fontSize: 32, cursor: 'pointer', boxShadow: `0 4px 20px ${C.aG}`, fontFamily: 'inherit' }}>🔊</button>
        <div style={{ color: C.ts, fontSize: 12, marginTop: 12 }}>დააჭირე სასმენლად</div>
      </div>
      <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="ჩაწერე გაგონილი სიტყვა..." disabled={res !== null} style={textInp(res)} />
      {res !== null && <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: res ? C.g : C.r, marginBottom: 8 }}>{res ? '✅ სწორია!' : `❌ სწორი: ${q.w} (${q.t})`}</div>}
      <button onClick={check} disabled={res !== null || !inp.trim()} style={checkBtn(res !== null || !inp.trim())}>შემოწმება ✓</button>
    </div>
  );
}

/* ══════════════ Main ExercisesScreen ══════════════ */
const EXERCISES = [
  { id: 'multi',    icon: '📝', label: 'მრავლობითი პასუხი', sub: '4 ვარიანტიდან სწორი',    color: C.a    },
  { id: 'fill',     icon: '✍️', label: 'შეავსე ველი',       sub: 'სიტყვის ჩაწერა',         color: C.g    },
  { id: 'memory',   icon: '🧠', label: 'მეხსიერება',         sub: 'წყვილების დაკავშირება',   color: C.p    },
  { id: 'scramble', icon: '🔀', label: 'სიტყვის ასოები',    sub: 'ასოების სწორი თანმიმდევრობა', color: C.gold },
  { id: 'listen',   icon: '🎧', label: 'მოსმენა',            sub: 'მოუსმინე და ჩაწერე',      color: C.o    },
];

export default function ExercisesScreen({ user, lang }) {
  const [type, setType] = useState(null);

  if (type) {
    const exit = () => setType(null);
    return (
      <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
        {type === 'multi'    && <MultiChoice user={user} lang={lang} onExit={exit} />}
        {type === 'fill'     && <FillBlank   user={user} lang={lang} onExit={exit} />}
        {type === 'memory'   && <MemoryGame              lang={lang} onExit={exit} />}
        {type === 'scramble' && <Scramble    user={user} lang={lang} onExit={exit} />}
        {type === 'listen'   && <Listening   user={user} lang={lang} onExit={exit} />}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 22 }}>🎮 სავარჯიშოები</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} {LANG[lang]?.name} · ვარჯიშის ტიპი</div>
      </div>
      {EXERCISES.map(ex => (
        <button key={ex.id} onClick={() => setType(ex.id)} style={{ width: '100%', textAlign: 'left', padding: 18, background: `linear-gradient(135deg,${C.card2},${C.card3})`, border: `1px solid ${C.bdL}`, borderRadius: 16, marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 30, background: `${ex.color}22`, borderRadius: 12, width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ex.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.t, fontWeight: 700, fontSize: 16 }}>{ex.label}</div>
            <div style={{ color: C.ts, fontSize: 13, marginTop: 3 }}>{ex.sub}</div>
          </div>
          <span style={{ color: ex.color, fontSize: 20 }}>›</span>
        </button>
      ))}
    </div>
  );
}
