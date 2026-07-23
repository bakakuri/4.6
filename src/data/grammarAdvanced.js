export const GRAMMAR_COMPARISONS = [
  {
    id: 'nom-akk',
    title: 'Nominativ vs Akkusativ',
    left: 'Der Mann sieht den Hund.',
    right: 'Der Mann ist groß.',
    note: 'Nominativ = subject; Akkusativ = direct object.',
  },
  {
    id: 'akk-dat',
    title: 'Akkusativ vs Dativ',
    left: 'Ich sehe den Mann.',
    right: 'Ich helfe dem Mann.',
    note: 'sehen → Akkusativ, helfen → Dativ.',
  },
  {
    id: 'pr-pos',
    title: 'Präsens vs Perfekt',
    left: 'Ich lerne Deutsch.',
    right: 'Ich habe Deutsch gelernt.',
    note: 'Präsens = now, Perfekt = completed past.',
  },
  {
    id: 'weil-dass',
    title: 'weil vs dass',
    left: 'Ich bleibe zu Hause, weil ich krank bin.',
    right: 'Ich weiß, dass du Deutsch lernst.',
    note: 'Both push the conjugated verb to the end.',
  },
]

export const GRAMMAR_REFERENCE = [
  {
    id: 'cases',
    title: 'Cases',
    items: ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'],
  },
  {
    id: 'verbs',
    title: 'Verb systems',
    items: ['Präsens', 'Perfekt', 'Präteritum', 'Modalverben', 'Trennbare Verben'],
  },
  {
    id: 'word-order',
    title: 'Sentence structure',
    items: ['Verbzweitstellung', 'Nebensätze', 'Satzklammer', 'weil', 'dass', 'wenn'],
  },
  {
    id: 'articles',
    title: 'Articles & determiners',
    items: ['der / die / das', 'ein / eine', 'kein / keine', 'Possessivartikel'],
  },
  {
    id: 'prepositions',
    title: 'Prepositions',
    items: ['mit', 'für', 'ohne', 'aus', 'bei', 'in', 'zu', 'nach'],
  },
]

export function buildGrammarChallenges({ accuracy = 0, dueCount = 0, mastered = 0, averageMastery = 0 }) {
  const streakReady = accuracy >= 80
  return [
    { id: 'daily-10', title: 'Complete 10 exercises', progress: Math.min(10, Math.round((averageMastery / 100) * 10)), total: 10, reward: '+50 XP' },
    { id: 'review-5', title: 'Review 5 mistakes', progress: Math.min(5, dueCount), total: 5, reward: '+30 XP' },
    { id: 'accuracy-80', title: 'Hit 80% accuracy', progress: Math.min(80, accuracy), total: 80, reward: '+40 XP' },
    { id: 'master-3', title: 'Master 3 topics', progress: Math.min(3, mastered), total: 3, reward: '+60 XP' },
    { id: 'streak', title: 'Keep a grammar streak', progress: streakReady ? 1 : 0, total: 1, reward: 'Badge' },
  ]
}

export function buildGrammarMilestones({ mastered = 0, totalTopics = 0, accuracy = 0, sessions = [] }) {
  return [
    { id: 'first-topic', title: 'First topic completed', achieved: mastered >= 1, detail: `${mastered}/${totalTopics} mastered` },
    { id: 'ten-mastered', title: '10 topics mastered', achieved: mastered >= 10, detail: `${mastered}/10` },
    { id: 'accuracy-90', title: '90% accuracy week', achieved: accuracy >= 90, detail: `${accuracy}% accuracy` },
    { id: 'sessions-20', title: '20 learning sessions', achieved: sessions.length >= 20, detail: `${sessions.length}/20 sessions` },
    { id: 'curriculum-a1', title: 'A1 foundation', achieved: totalTopics >= 20, detail: `${totalTopics} topics available` },
  ]
}
