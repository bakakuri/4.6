export const C = {
  bg: '#030509', bg1: '#07091a', bg2: '#0b0f22', bg3: '#10162d',
  card: '#0d1224', card2: '#121930', card3: '#18213d', card4: '#1d2745',
  a: '#5d6bff', aH: '#7b87ff', aG: 'rgba(93,107,255,0.18)',
  gold: '#f0a830', goldG: 'rgba(240,168,48,0.18)',
  g: '#11c490', gG: 'rgba(17,196,144,0.18)',
  r: '#ff4f6b', rG: 'rgba(255,79,107,0.18)',
  o: '#ff8c3a', b: '#3d9bff', p: '#a855f7',
  t: '#e0e6f8', ts: '#7d8ab8', tm: '#454d6e',
  bd: '#151d3b', bdL: '#1e2a4a',
};

export const gls = (extra = {}) => ({
  background: 'rgba(13,18,36,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${C.bdL}`,
  borderRadius: 16,
  ...extra,
});

export const LANG = {
  english: { name: 'English',  flag: '🇬🇧', code: 'en-US', ka: 'ინგლისური' },
  russian: { name: 'Русский',  flag: '🇷🇺', code: 'ru-RU', ka: 'რუსული'    },
  spanish: { name: 'Español',  flag: '🇪🇸', code: 'es-ES', ka: 'ესპანური'  },
  french:  { name: 'Français', flag: '🇫🇷', code: 'fr-FR', ka: 'ფრანგული'  },
};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LEVEL_COLORS = {
  A1: '#11c490', A2: '#3d9bff', B1: '#5d6bff',
  B2: '#a855f7', C1: '#ff8c3a', C2: '#ff4f6b',
};

export const CATS = [
  'Greetings','Food & Drink','Places','Objects','Animals','Adjectives',
  'Time','Work','Travel','Education','Finance','Nature','People','Verbs',
  'Success','Society','Technology','Science','Philosophy',
  'Psychology','Literature','Personality','Sound',
];
