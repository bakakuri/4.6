import { useState, useEffect } from 'react';
import { C, gls, LANG, LEVEL_COLORS } from '../theme.js';
import { allWords, getWordLevel } from '../data/words.js';
import { getProgress, getNextCard, saveProgress, getStats, speakWord, ls, ss, bumpActivity } from '../utils/helpers.js';

export default function FlashcardScreen({ user, lang }) {
  const [card,    setCard]    = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [done,    setDone]    = useState(false);
  const [count,   setCount]   = useState(0);
  const lc = LANG[lang];

  useEffect(() => { loadCard(); }, [lang]); // eslint-disable-line

  const loadCard = () => {
    const c = getNextCard(user.username, lang);
    setCard(c);
    setFlipped(false);
    setDone(!c);
  };

  const answer = (mastery) => {
    if (!card) return;
    saveProgress(user.username, lang, card.id, mastery);
    ss(`sess_${user.username}`, (ls(`sess_${user.username}`, 0)) + 1);
    bumpActivity(user.username);
    setCount(n => n + 1);
    loadCard();
  };

  const progress     = getProgress(user.username, lang);
  const learnedWords = allWords(lang).filter(w => (progress[w.id]?.mastery || 0) >= 100);
  const stats        = getStats(user.username, lang);

  /* ── All learned ─────────────────────────────────────────────── */
  if (done) {
    return (
      <div style={{ padding: 20, fontFamily: "'Inter',system-ui,sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{ fontSize: 52 }}>🎉</div>
          <div style={{ color: C.t, fontWeight: 800, fontSize: 20, marginTop: 10 }}>ყველა სიტყვა ნასწავლია!</div>
          <div style={{ color: C.ts, fontSize: 14, marginTop: 6 }}>ბრავო! ახლა გააგრძელე ახალ დონეზე.</div>
        </div>
        <div style={{ ...gls({ padding: 20, width: '100%', maxWidth: 380 }), textAlign: 'center' }}>
          <div style={{ color: C.gold, fontSize: 32, fontWeight: 900 }}>{learnedWords.length}</div>
          <div style={{ color: C.ts, fontSize: 13 }}>ნასწავლი სიტყვა</div>
        </div>
        {learnedWords.length > 0 && (
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ color: C.t, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>✅ ნასწავლი სიტყვები</div>
            {learnedWords.map(w => (
              <div key={w.id} style={{ ...gls({ padding: '12px 14px', marginBottom: 8 }), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: C.t, fontWeight: 700 }}>{w.w}</div>
                  <div style={{ color: C.ts, fontSize: 12 }}>{w.ph}</div>
                </div>
                <div style={{ color: C.ts, fontSize: 13 }}>{w.t}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!card) return null;

  const cardLevel = getWordLevel(lang, card.id);
  const mastery   = progress[card.id]?.mastery || 0;
  const mColor    = mastery >= 75 ? C.g : mastery >= 50 ? C.gold : mastery >= 25 ? C.o : C.ts;

  return (
    <div style={{ padding: '16px 16px 20px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: C.ts, fontSize: 13 }}>სესია: {count} სიტყვა</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: C.g, fontSize: 13 }}>✅ {stats.learned}/{stats.total}</span>
          <span style={{ background: C.card3, borderRadius: 6, padding: '3px 8px', fontSize: 12, color: mColor, fontWeight: 700 }}>{mastery}%</span>
        </div>
      </div>

      {/* Flip card */}
      <div onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer', perspective: 1000, marginBottom: 16 }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', height: 310 }}>

          {/* FRONT */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...gls({ padding: 24 }), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: `linear-gradient(160deg,${C.card2},${C.card3})` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {cardLevel && <span style={{ background: LEVEL_COLORS[cardLevel] || C.a, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 800 }}>{cardLevel}</span>}
              <span style={{ color: C.ts, fontSize: 12 }}>{card.cat}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: C.t, letterSpacing: -1, marginBottom: 8 }}>{card.w}</div>
              <div style={{ color: C.a, fontSize: 15, marginBottom: 16, letterSpacing: 0.5 }}>{card.ph}</div>
              <div style={{ borderTop: `1px solid ${C.bdL}`, paddingTop: 14 }}>
                <div style={{ color: C.ts, fontSize: 14, fontStyle: 'italic', marginBottom: 6 }}>"{card.ex}"</div>
                <div style={{ color: C.tm, fontSize: 12 }}>{card.exph}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.tm, fontSize: 12 }}>👆 დააჭირე გადასაბრუნებლად</span>
              <button onClick={e => { e.stopPropagation(); speakWord(card.w, lc.code); }} style={{ background: `linear-gradient(135deg,${C.a},${C.p})`, border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 18, cursor: 'pointer', boxShadow: `0 2px 12px ${C.aG}`, fontFamily: 'inherit' }}>🔊</button>
            </div>
          </div>

          {/* BACK */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', ...gls({ padding: 24 }), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: `linear-gradient(160deg,${C.card3},${C.card4})` }}>
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <div style={{ color: C.ts, fontSize: 12, marginBottom: 6 }}>{lc.flag} თარგმანი</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: C.gold, marginBottom: 16 }}>{card.t}</div>
              <div style={{ borderTop: `1px solid ${C.bdL}`, paddingTop: 14 }}>
                <div style={{ color: C.ts, fontSize: 13, marginBottom: 6 }}>"{card.ex}"</div>
                <div style={{ color: C.t, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>"{card.ext}"</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={e => { e.stopPropagation(); speakWord(card.ex, lc.code); }} style={{ background: `linear-gradient(135deg,${C.g},#0fa37a)`, border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔊 წინადადება</button>
            </div>
          </div>
        </div>
      </div>

      {/* SRS buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'ისევ',    emoji: '🔄', mastery: 25,  bg: C.r    },
          { label: 'რთული',  emoji: '😓', mastery: 50,  bg: C.o    },
          { label: 'ისო რა', emoji: '😐', mastery: 75,  bg: C.gold },
          { label: 'ადვილი', emoji: '😊', mastery: 100, bg: C.g    },
        ].map(btn => (
          <button key={btn.label} onClick={() => answer(btn.mastery)} style={{ padding: '12px 4px', background: `${btn.bg}22`, border: `1px solid ${btn.bg}66`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <span style={{ fontSize: 18 }}>{btn.emoji}</span>
            <span style={{ color: C.t, fontSize: 11, fontWeight: 700 }}>{btn.label}</span>
            <span style={{ color: C.ts, fontSize: 10 }}>{btn.mastery}%</span>
          </button>
        ))}
      </div>

      {/* Learned list */}
      {learnedWords.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: C.t, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>✅ ნასწავლი ({learnedWords.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {learnedWords.map(w => (
              <div key={w.id} style={{ background: `${C.g}22`, border: `1px solid ${C.g}44`, borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: C.t, fontSize: 12, fontWeight: 700 }}>{w.w}</span>
                <span style={{ color: C.ts, fontSize: 11 }}>· {w.t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
