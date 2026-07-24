import { buildLearningState, buildGrammarAnalytics, buildGrammarRoadmap, levelFromCategory, topicKey, topicSummary } from './grammarInsights.js'
import { getGrammarExercises } from './grammarExercises.js'

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export function buildMasteryMap({ categories = [], progress = {}, lang = 'german' }) {
  return categories.map(category => ({
    level: levelFromCategory(category.cat),
    category: category.cat,
    icon: category.icon,
    topics: (category.topics || []).map(topic => {
      const row = progress[topicKey(lang, category.cat, topic.title)] || {}
      const mastery = row.mastery || 0
      return {
        key: topicKey(lang, category.cat, topic.title),
        category: category.cat,
        topic: topic.title,
        summary: topicSummary(topic),
        mastery,
        status: row.status || 'new',
        due: Boolean(row.next_review_at && new Date(row.next_review_at) <= new Date()),
      }
    }),
  })).filter(group => group.topics.length > 0)
}

export function buildPrerequisiteGraph({ categories = [], lang = 'german' }) {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const topicsByLevel = levels.map(level => {
    const category = categories.find(cat => levelFromCategory(cat.cat) === level)
    return {
      level,
      topics: (category?.topics || []).map(topic => topic.title),
    }
  }).filter(item => item.topics.length > 0)

  const graph = []
  for (let i = 0; i < topicsByLevel.length; i += 1) {
    const current = topicsByLevel[i]
    const previous = topicsByLevel[i - 1]
    current.topics.forEach((topic, index) => {
      graph.push({
        topic: `${current.level} · ${topic}`,
        prerequisites: previous ? previous.topics.slice(Math.max(0, index - 1), index + 1).map(t => `${previous.level} · ${t}`) : [],
      })
    })
  }
  return graph
}

export function buildCertificates({ learningState = {}, analytics = {}, sessions = [] }) {
  const mastered = learningState.knows?.length || 0
  const weak = learningState.doesNotKnow?.length || 0
  const topicCount = analytics.totalTopics || 0
  const accuracy = analytics.accuracy || 0
  return [
    { id: 'first-step', title: 'First Grammar Step', achieved: mastered >= 1, detail: `${mastered}/${topicCount} mastered` },
    { id: 'a1-complete', title: 'A1 Foundation', achieved: topicCount >= 10 && accuracy >= 60, detail: `${accuracy}% accuracy` },
    { id: 'master-10', title: '10 Topics Mastered', achieved: mastered >= 10, detail: `${mastered}/10` },
    { id: 'mistake-crusher', title: 'Mistake Crusher', achieved: weak <= 5, detail: `${weak} weak topics` },
    { id: 'sessions-20', title: '20 Learning Sessions', achieved: sessions.length >= 20, detail: `${sessions.length}/20 sessions` },
  ]
}

export function buildErrorPatterns({ mistakes = [] }) {
  const map = new Map()
  mistakes.forEach(item => {
    const key = `${item.category} · ${item.topic}`
    const current = map.get(key) || { key, category: item.category, topic: item.topic, count: 0, types: new Map(), latest: item }
    current.count += 1
    current.latest = item
    current.types.set(item.exercise_type || 'unknown', (current.types.get(item.exercise_type || 'unknown') || 0) + 1)
    map.set(key, current)
  })

  return [...map.values()].map(item => {
    const [topType, topCount] = [...item.types.entries()].sort((a, b) => b[1] - a[1])[0] || ['unknown', 0]
    return {
      key: item.key,
      category: item.category,
      topic: item.topic,
      count: item.count,
      topType,
      topCount,
      latestQuestion: item.latest?.question || '',
      latestAnswer: item.latest?.correct_answer || '',
    }
  }).sort((a, b) => b.count - a.count)
}

export function buildGoalPlans({ learningState = {}, goal = 'balanced' }) {
  const weak = (learningState.doesNotKnow || []).slice(0, 3)
  const next = (learningState.nextToLearn || []).slice(0, 3)
  const pools = {
    exam: ['Timed exam simulation', 'Review weak rules', 'Mixed topic drill'],
    work: ['Formal grammar', 'Word order', 'Cases in workplace phrases'],
    speaking: ['Modal verbs', 'Word order', 'High-frequency patterns'],
    balanced: ['5 review', '5 weak drills', '5 new exercises'],
  }
  return { goal, items: pools[goal] || pools.balanced, weak, next }
}

export function buildDailyPlan({ due = [], learningState = {}, sessions = [], target = 30 }) {
  const reviewCount = Math.min(5, due.length)
  const weakCount = Math.min(5, learningState.doesNotKnow?.length || 0)
  const practiceCount = Math.max(10, target - (reviewCount * 3 + weakCount * 2))
  return {
    target,
    totalMinutes: target,
    items: [
      { label: 'Review', minutes: reviewCount * 3, count: reviewCount },
      { label: 'Weak topic practice', minutes: weakCount * 2, count: weakCount },
      { label: 'New exercises', minutes: practiceCount, count: practiceCount },
    ],
    sessions7d: sessions.filter(s => new Date(s.completed_at || s.started_at || 0) >= Date.now() - 7 * 24 * 60 * 60 * 1000).length,
  }
}

export function buildLongTermAnalytics({ sessions = [], progress = {} }) {
  const byDay = new Map()
  sessions.forEach(session => {
    const day = (session.completed_at || session.started_at || '').slice(0, 10)
    if (!day) return
    const entry = byDay.get(day) || { day, count: 0, totalScore: 0 }
    entry.count += 1
    entry.totalScore += session.score || 0
    byDay.set(day, entry)
  })
  const trend = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)).map(item => ({ ...item, avgScore: item.count ? Math.round(item.totalScore / item.count) : 0 }))
  const masteryValues = Object.values(progress).map(r => r.mastery || 0)
  const average = masteryValues.length ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length) : 0
  const peak = masteryValues.length ? Math.max(...masteryValues) : 0
  const low = masteryValues.length ? Math.min(...masteryValues) : 0
  return { trend, average, peak, low, sessions: sessions.length }
}

export function buildAdvancedSnapshot({ categories = [], progress = {}, due = [], mistakes = [], sessions = [], lang = 'german', goal = 'balanced', target = 30 }) {
  const learningState = buildLearningState({ categories, progress, due, mistakes, lang })
  const analytics = buildGrammarAnalytics({ categories, progress, due, sessions, mistakes, lang })
  const roadmap = buildGrammarRoadmap({ categories, progress, lang })
  return {
    masteryMap: buildMasteryMap({ categories, progress, lang }),
    prerequisites: buildPrerequisiteGraph({ categories, lang }),
    certificates: buildCertificates({ learningState, analytics, sessions }),
    errorPatterns: buildErrorPatterns({ mistakes }),
    goalPlan: buildGoalPlans({ learningState, goal }),
    dailyPlan: buildDailyPlan({ due, learningState, sessions, target }),
    longTerm: buildLongTermAnalytics({ sessions, progress }),
    learningState,
    analytics,
    roadmap,
    goal,
    target,
  }
}

export function buildExamPool({ categories = [], lang = 'german', limit = 20 }) {
  const pool = []
  categories.forEach(category => {
    (category.topics || []).forEach(topic => {
      getGrammarExercises(lang, topic.title).forEach(exercise => {
        pool.push({ ...exercise, category: category.cat, topic: topic.title, level: levelFromCategory(category.cat) })
      })
    })
  })
  return pool.slice(0, limit * 2)
}

export function buildMixedPool({ categories = [], lang = 'german', limit = 12 }) {
  const pool = buildExamPool({ categories, lang, limit: limit * 2 })
  return pool.sort(() => Math.random() - 0.5).slice(0, limit)
}

export function gradeFreeWriting(text = '') {
  const normalized = String(text || '').toLowerCase()
  const checks = []
  if (!normalized.trim()) checks.push('ტექსტი ცარიელია.')
  if (/\bich habe .* gegangen\b/.test(normalized)) checks.push('Perfekt-ში gehen ხშირად იყენებს sein-ს: Ich bin gegangen.')
  if (/\bder mann\b/.test(normalized) && /\bhelfe\b/.test(normalized)) checks.push('helfen ითხოვს Dativ-ს: dem Mann.')
  if (/\bich bin\b/.test(normalized) && /\bgestern\b/.test(normalized) && /\bgehe\b/.test(normalized)) checks.push('წარსულის შერწყმა გადაამოწმე: Perfekt ან Präteritum.')
  return {
    ok: checks.length === 0,
    checks,
    length: text.trim().split(/\s+/).filter(Boolean).length,
  }
}
