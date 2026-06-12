import WDB, { allWords } from '../data/words.js';

// ── localStorage ─────────────────────────────────────────────────
export const ls  = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const ss  = (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Speech ────────────────────────────────────────────────────────
export const speakWord = (text, langCode) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCode;
  u.rate = 0.82;
  window.speechSynthesis.speak(u);
};

// ── Random ────────────────────────────────────────────────────────
export const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── SRS helpers ───────────────────────────────────────────────────
export const getProgress = (uid, lang) => ls(`prog_${uid}_${lang}`, {});

export const saveProgress = (uid, lang, wordId, mastery) => {
  const p = getProgress(uid, lang);
  p[wordId] = { mastery, ts: Date.now() };
  ss(`prog_${uid}_${lang}`, p);
};

/** Returns the next word to study (lowest mastery, oldest seen). */
export const getNextCard = (uid, lang) => {
  const p  = getProgress(uid, lang);
  const ws = allWords(lang).filter(w => {
    const x = p[w.id];
    return !x || x.mastery < 100;
  });
  if (!ws.length) return null;
  ws.sort((a, b) => {
    const pa = p[a.id] || { mastery: 0, ts: 0 };
    const pb = p[b.id] || { mastery: 0, ts: 0 };
    if (pa.mastery !== pb.mastery) return pa.mastery - pb.mastery;
    return (pa.ts || 0) - (pb.ts || 0);
  });
  return ws[0];
};

/** Aggregated stats for profile / home screens. */
export const getStats = (uid, lang) => {
  const p  = getProgress(uid, lang);
  const ws = allWords(lang);
  const learned  = ws.filter(w => (p[w.id]?.mastery || 0) >= 100).length;
  const inProg   = ws.filter(w => { const m = p[w.id]?.mastery || 0; return m > 0 && m < 100; }).length;
  const chatOk   = ls(`chat_ok_${uid}`, 0);
  const chatTot  = ls(`chat_tot_${uid}`, 0);
  return {
    learned, inProg, total: ws.length,
    sessions: ls(`sess_${uid}`, 0),
    streak:   ls(`streak_${uid}`, 0),
    chatCorrect: chatOk,
    totalAns:    chatTot,
    accuracy:    chatTot ? Math.round((chatOk / chatTot) * 100) : 0,
  };
};

/** Record a correct answer for analytics. */
export const recordCorrect = (uid) => {
  ss(`chat_ok_${uid}`,  (ls(`chat_ok_${uid}`, 0))  + 1);
  ss(`chat_tot_${uid}`, (ls(`chat_tot_${uid}`, 0)) + 1);
};

/** Record any answer (correct or not) for analytics. */
export const recordAnswer = (uid) => {
  ss(`chat_tot_${uid}`, (ls(`chat_tot_${uid}`, 0)) + 1);
};

/** Bump today's activity bar. */
export const bumpActivity = (uid) => {
  const day = new Date().getDay();
  ss(`act_${uid}_${day}`, Math.min(100, (ls(`act_${uid}_${day}`, 0) || 0) + 10));
};
