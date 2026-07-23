const LEVEL_RE = /^(A1|A2|B1|B2|C1|C2)\b/i

export function normalizeGrammarText(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim()
}

export function topicKey(lang, category, topic) {
  return `${lang}::${category}::${topic}`
}

export function topicSummary(topic) {
  const source = topic?.ex?.[0] || topic?.body || ''
  const first = String(source).split('\n').map(line => line.replace(/^\*\*|\*\*$/g, '').replace(/^•\s*/, '').trim()).find(Boolean)
  return (first || 'გრამატიკული წესები, ახსნა და მაგალითები.').slice(0, 160)
}

export function levelFromCategory(categoryName = '') {
  const match = String(categoryName).match(LEVEL_RE)
  return match ? match[1].toUpperCase() : 'CORE'
}

export function buildGrammarAnalytics({ categories = [], progress = {}, due = [], sessions = [], mistakes = [], lang = 'german' }) {
  const allTopics = categories.flatMap(category => (category.topics || []).map(topic => ({ category, topic })))
  const rows = Object.values(progress)
  const total = rows.reduce((sum, row) => sum + (row.correct_count || 0) + (row.wrong_count || 0), 0)
  const correct = rows.reduce((sum, row) => sum + (row.correct_count || 0), 0)
  const wrong = rows.reduce((sum, row) => sum + (row.wrong_count || 0), 0)
  const mastered = rows.filter(row => (row.mastery || 0) >= 100 || row.status === 'mastered').length
  const averageMastery = allTopics.length ? Math.round(rows.reduce((sum, row) => sum + (row.mastery || 0), 0) / allTopics.length) : 0
  const accuracy = total ? Math.round((correct / total) * 100) : 0

  const categoryMap = new Map()
  categories.forEach(category => {
    const level = levelFromCategory(category.cat)
    if (!categoryMap.has(level)) categoryMap.set(level, { name: level, masterySum: 0, total: 0 })
    const entry = categoryMap.get(level)
    entry.total += (category.topics || []).length
  })

  Object.entries(progress).forEach(([key, row]) => {
    const categoryName = key.split('::')[1] || ''
    const level = levelFromCategory(categoryName)
    if (!categoryMap.has(level)) return
    categoryMap.get(level).masterySum += row.mastery || 0
  })

  const categoryLevels = [...categoryMap.values()].map(item => ({
    name: item.name,
    mastery: item.total ? Math.round((item.masterySum || 0) / item.total) : 0,
  })).sort((a, b) => a.name.localeCompare(b.name))

  const weakTopics = rows.map(row => {
    const k = topicKey(lang, row.category, row.topic)
    const meta = allTopics.find(item => topicKey(lang, item.category.cat, item.topic.title) === k)
    return {
      key: k,
      title: `${row.category} · ${row.topic}`,
      category: row.category,
      topic: row.topic,
      mastery: row.mastery || 0,
      topicSummary: topicSummary(meta?.topic),
    }
  }).sort((a, b) => a.mastery - b.mastery)

  const strongTopics = rows.map(row => {
    const k = topicKey(lang, row.category, row.topic)
    const meta = allTopics.find(item => topicKey(lang, item.category.cat, item.topic.title) === k)
    return {
      key: k,
      title: `${row.category} · ${row.topic}`,
      category: row.category,
      topic: row.topic,
      mastery: row.mastery || 0,
      topicSummary: topicSummary(meta?.topic),
    }
  }).sort((a, b) => b.mastery - a.mastery)

  const masteryBuckets = {
    weak: weakTopics.slice(0, 5),
    medium: rows.filter(row => (row.mastery || 0) >= 40 && (row.mastery || 0) < 80).length,
    mastered,
  }

  return {
    totalTopics: allTopics.length,
    total,
    correct,
    wrong,
    accuracy,
    averageMastery,
    mastered,
    dueCount: due.length,
    categoryLevels,
    weakTopics,
    strongTopics,
    masteryBuckets,
    sessions,
    mistakes,
  }
}

export function buildGrammarRoadmap({ categories = [], progress = {}, lang = 'german' }) {
  const allTopics = categories.flatMap(category => (category.topics || []).map(topic => ({ category, topic })))
  const rows = Object.entries(progress).map(([key, row]) => {
    const [rowLang, category, topic] = key.split('::')
    return { key, rowLang, category, topic, mastery: row.mastery || 0, status: row.status || 'new' }
  }).filter(item => item.rowLang === lang)

  const recommendedTopics = allTopics.map(item => {
    const key = topicKey(lang, item.category.cat, item.topic.title)
    const row = progress[key]
    return {
      key,
      category: item.category.cat,
      topic: item.topic.title,
      mastery: row?.mastery || 0,
      status: row?.status || 'new',
      summary: topicSummary(item.topic),
      level: levelFromCategory(item.category.cat),
    }
  }).sort((a, b) => a.mastery - b.mastery)

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'CORE']
  const byLevel = levels.map(level => ({
    level,
    topics: recommendedTopics.filter(item => item.level === level).slice(0, 5),
  })).filter(item => item.topics.length > 0)

  const nextFocus = recommendedTopics.slice(0, 12)
  return { recommendedTopics, byLevel, nextFocus }
}
