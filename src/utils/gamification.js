// ─── XP per correct answer ─────────────────────────────────
export const XP_REWARD = {
  flashcard: 10, multi: 15, fill: 20,
  scramble: 20,  listen: 25, speech: 30,
  sentence: 25,  gender: 20, chat: 15,
}

// ─── Level table ───────────────────────────────────────────
export const LEVEL_TABLE = [
  { level:1,  name:'დამწყები',       icon:'🌱', min:0     },
  { level:2,  name:'სტუდენტი',      icon:'📚', min:100   },
  { level:3,  name:'მოსწავლე',      icon:'🎯', min:300   },
  { level:4,  name:'ენათმეტყ.',     icon:'🗣️', min:600   },
  { level:5,  name:'ოსტატი',        icon:'⚡', min:1000  },
  { level:6,  name:'ლეგენდა',       icon:'🌟', min:1500  },
  { level:7,  name:'ჩემპიონი',      icon:'🏆', min:2200  },
  { level:8,  name:'ელიტა',         icon:'💎', min:3000  },
  { level:9,  name:'გრანდმასტ.',    icon:'👑', min:4000  },
  { level:10, name:'LinguaMaster',  icon:'🌍', min:5500  },
]

export const calcLevel = (xp = 0) => {
  let lvl = LEVEL_TABLE[0]
  for (const l of LEVEL_TABLE) { if (xp >= l.min) lvl = l; else break }
  const nextIdx = LEVEL_TABLE.findIndex(l => l.level === lvl.level + 1)
  const next    = nextIdx >= 0 ? LEVEL_TABLE[nextIdx] : null
  const fromCur = xp - lvl.min
  const toNext  = next ? next.min - lvl.min : 1
  const pct     = next ? Math.min(100, Math.round((fromCur / toNext) * 100)) : 100
  return { lvl, next, fromCur, toNext, pct }
}

// ─── Achievements ──────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id:'first_word',  icon:'🌱', name:'პირველი ნაბიჯი',    desc:'1 სიტყვა ვისწავლე',       check: s => s.learned >= 1    },
  { id:'ten_words',   icon:'📚', name:'მოსწავლე',          desc:'10 სიტყვა',               check: s => s.learned >= 10   },
  { id:'fifty_words', icon:'🎯', name:'მოწინავე',          desc:'50 სიტყვა',               check: s => s.learned >= 50   },
  { id:'hundred',     icon:'💯', name:'ასი სიტყვა',        desc:'100 სიტყვა',              check: s => s.learned >= 100  },
  { id:'streak3',     icon:'🔥', name:'3 დღე',              desc:'3 დღე ზედიზედ',           check: s => s.streak >= 3     },
  { id:'streak7',     icon:'🔥🔥',name:'კვირა',            desc:'7 დღე ზედიზედ',           check: s => s.streak >= 7     },
  { id:'streak30',    icon:'🏅', name:'თვე',                desc:'30 დღე ზედიზედ',          check: s => s.streak >= 30    },
  { id:'xp100',       icon:'⚡', name:'XP დამწყები',       desc:'100 XP',                  check: s => s.xp >= 100       },
  { id:'xp500',       icon:'🌟', name:'XP ოსტატი',         desc:'500 XP',                  check: s => s.xp >= 500       },
  { id:'xp1000',      icon:'💎', name:'XP ლეგენდა',        desc:'1000 XP',                 check: s => s.xp >= 1000      },
  { id:'chat10',      icon:'💬', name:'ჩათის ვარსკვლავი',  desc:'10 ჩათის პასუხი',         check: s => s.totalAns >= 10  },
  { id:'a1done',      icon:'🎓', name:'A1 დასრულება',      desc:'A1 ყველა სიტყვა',         check: s => s.a1done          },
  { id:'daily_done',  icon:'✅', name:'მიზნის შემს.',      desc:'დღიური მიზანი',            check: s => s.dailyDone       },
  { id:'all_levels',  icon:'🌍', name:'LinguaMaster',      desc:'5500 XP',                 check: s => s.xp >= 5500      },
]

export const checkNewAchievements = (stats, alreadyEarned = []) =>
  ACHIEVEMENTS.filter(a => !alreadyEarned.includes(a.id) && a.check(stats))

export const getAchievement = (id) => ACHIEVEMENTS.find(a => a.id === id)
  
