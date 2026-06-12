import { useState, useEffect, useRef } from 'react';
import { C, LANG } from '../theme.js';
import { allWords } from '../data/words.js';
import { ls, ss, rnd, recordCorrect, recordAnswer } from '../utils/helpers.js';

const BOT = 'LinguaBot 🤖';
const INTERVAL_MS = 15000; // bot posts every 15 seconds

export default function ChatScreen({ user, lang }) {
  const [msgs, setMsgs] = useState(() => ls('chat_messages', []));
  const [inp,  setInp]  = useState('');
  const [curr, setCurr] = useState(null); // current challenge word
  const bottomRef = useRef(null);

  // Load / post initial challenge
  useEffect(() => {
    if (msgs.length === 0) postChallenge();
  }, []); // eslint-disable-line

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Bot interval
  useEffect(() => {
    const id = setInterval(() => {
      // Only post new challenge when no active one (or old one expired)
      if (!ls('chat_challenge_active', false)) postChallenge();
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [lang]); // eslint-disable-line

  const save = (list) => { ss('chat_messages', list.slice(-80)); setMsgs(list.slice(-80)); };

  const postChallenge = () => {
    const ws   = allWords(lang);
    const word = rnd(ws);
    setCurr(word);
    ss('chat_challenge_active', true);
    ss('chat_current_word', word.id);

    const lc = LANG[lang];
    const botMsg = {
      id:   Date.now() + Math.random(),
      from: BOT,
      text: `${lc.flag} ახალი გამოწვევა! სიტყვა: "${word.w}" (${word.ph})\n🎯 ჩაწერე ქართული თარგმანი!`,
      ts:   Date.now(),
      isBot: true,
      wordId: word.id,
    };
    save([...ls('chat_messages', []), botMsg]);
  };

  const sendMsg = () => {
    if (!inp.trim()) return;
    const text = inp.trim();
    setInp('');

    // Add user message
    const userMsg = { id: Date.now() + Math.random(), from: user.username, text, ts: Date.now(), isOwn: true };
    const updated = [...ls('chat_messages', []), userMsg];
    save(updated);

    // Check if it's an answer to the current challenge
    const activeId = ls('chat_current_word', null);
    if (activeId) {
      const ws   = allWords(lang);
      const word = ws.find(w => w.id === activeId);
      if (word) {
        const isCorrect = text.trim() === word.t.trim() ||
                          text.trim().toLowerCase() === word.t.trim().toLowerCase();
        recordAnswer(user.username);
        if (isCorrect) {
          recordCorrect(user.username);
          ss('chat_challenge_active', false);
          ss('chat_current_word', null);
          const reply = {
            id:    Date.now() + Math.random() + 0.1,
            from:  BOT,
            text:  `✅ სწორია, ${user.username}! 🎉 "${word.w}" = "${word.t}" 🔥 +10 ქულა!`,
            ts:    Date.now() + 1,
            isBot: true,
          };
          setTimeout(() => save([...ls('chat_messages', []), reply]), 600);
        } else {
          const hint = word.t.slice(0, Math.ceil(word.t.length / 2)) + '...';
          const reply = {
            id:    Date.now() + Math.random() + 0.1,
            from:  BOT,
            text:  `❌ არასწორია. მინიშნება: "${hint}"`,
            ts:    Date.now() + 1,
            isBot: true,
          };
          setTimeout(() => save([...ls('chat_messages', []), reply]), 600);
        }
      }
    }
  };

  const fmt = (ts) => new Date(ts).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.bdL}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>💬</span>
        <div>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 15 }}>სწავლის ჩათი</div>
          <div style={{ color: C.ts, fontSize: 11 }}>{LANG[lang]?.flag} ბოტი ყოველ 15 წამში სიტყვას პოსტავს</div>
        </div>
        <button onClick={postChallenge} style={{ marginLeft: 'auto', background: `${C.a}22`, border: `1px solid ${C.a}44`, borderRadius: 8, padding: '5px 10px', color: C.a, fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>+ ახალი</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map(m => {
          const isOwn = m.isOwn;
          const isBot = m.isBot;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
              {!isOwn && <div style={{ color: C.tm, fontSize: 10, marginBottom: 3, paddingLeft: 4 }}>{m.from} · {fmt(m.ts)}</div>}
              <div style={{
                maxWidth: '82%',
                padding: '10px 14px',
                borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isOwn
                  ? `linear-gradient(135deg,${C.a},${C.p})`
                  : isBot ? C.card3 : C.card2,
                border: isOwn ? 'none' : `1px solid ${isBot ? C.a + '44' : C.bdL}`,
                color: C.t,
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: isOwn ? `0 2px 12px ${C.aG}` : 'none',
              }}>{m.text}</div>
              {isOwn && <div style={{ color: C.tm, fontSize: 10, marginTop: 3, paddingRight: 4 }}>{fmt(m.ts)}</div>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.bdL}`, display: 'flex', gap: 8, background: 'rgba(7,9,26,0.97)' }}>
        <input
          value={inp}
          onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder="ჩაწერე პასუხი..."
          style={{ flex: 1, background: C.card3, border: `1px solid ${C.bdL}`, borderRadius: 12, padding: '12px 14px', color: C.t, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={sendMsg} style={{ background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 12, width: 46, height: 46, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 12px ${C.aG}`, flexShrink: 0 }}>➤</button>
      </div>
    </div>
  );
}
