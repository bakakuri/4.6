import { buildLearningState, levelFromCategory, topicKey, topicSummary } from './grammarInsights.js'
import { getGrammarExercises } from './grammarExercises.js'

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n))

export function buildMasteryProfile({ progress = {}, mistakes = [], due = [], lang = 'german', categories = [] }) {
  const dueSet = new Set((due || []).map(item => topicKey(lang, item.category, item.topic)))
  const mistakeMap = new Map()
  for (const item of mistakes || []) {
    const key = topicKey(lang, item.category, item.topic)
    if (!mistakeMap.has(key)) mistakeMap.set(key, [])
    mistakeMap.get(key).push(item)
  }

  const rows = categories.flatMap(category => (category.topics || []).map(topic => {
    const key = topicKey(lang, category.cat, topic.title)
    const row = progress[key] || {}
    const correct = row.correct_count || 0
    const wrong = row.wrong_count || 0
    const total = correct + wrong
    const mastery = row.mastery || 0
    const accuracy = total ? Math.round((correct / total) * 100) : mastery
    const repeatedMistakes = (mistakeMap.get(key) || []).reduce((sum, item) => sum + (item.mistake_count || 0), 0)
    const dueNow = dueSet.has(key)
    const knowledge = clamp(Math.round((mastery * 0.65) + (accuracy * 0.35)))
    const confidence = clamp(total ? Math.round((accuracy * 0.7) + (mastery * 0.3)) : mastery)
    const retention = clamp(100 - (repeatedMistakes * 12) - (dueNow ? 15 : 0))
    const readiness = clamp(Math.round((knowledge * 0.45) + (confidence * 0.25) + (retention * 0.2) + ((row.times_viewed || 0) > 0 ? 10 : 0)))
    return {
      key,
      category: category.cat,
      topic: topic.title,
      level: levelFromCategory(category.cat),
      summary: topicSummary(topic),
      mastery,
      accuracy,
      knowledge,
      confidence,
      retention,
      readiness,
      due: dueNow,
      repeatedMistakes,
      status: row.status || 'new',
      row,
    }
  }))

  const overall = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.readiness, 0) / rows.length)
    : 0

  return { rows, overall }
}

export function buildNextLesson({ categories = [], progress = {}, due = [], mistakes = [], lang = 'german' }) {
  const learningState = buildLearningState({ categories, progress, due, mistakes, lang })
  const mastery = buildMasteryProfile({ categories, progress, due, mistakes, lang })
  const dueFirst = learningState.nextToLearn.find(item => item.due)
  const weakFirst = learningState.nextToLearn.find(item => item.mastery < 50 && !item.due)
  const target = dueFirst || weakFirst || mastery.rows.slice().sort((a, b) => a.readiness - b.readiness)[0] || null

  if (!target) {
    return {
      key: 'empty',
      category: '',
      topic: '',
      title: 'No lesson yet',
      reason: 'No lesson could be recommended.',
      practiceMode: 'diagnostic',
      mastery: 0,
      readiness: 0,
      level: 'CORE',
    }
  }

  const reasonParts = []
  if (target.due) reasonParts.push('due review')
  if (target.repeatedMistakes >= 3) reasonParts.push(`repeated mistakes × ${target.repeatedMistakes}`)
  if (target.mastery < 50) reasonParts.push(`mastery ${target.mastery}%`)
  if (!reasonParts.length) reasonParts.push('next curriculum step')

  const practiceMode = target.due || target.repeatedMistakes >= 3 ? 'review' : target.mastery < 50 ? 'weakness' : 'new'
  const nextTopic = categories.find(category => category.cat === target.category)?.topics?.find(t => t.title === target.topic)

  return {
    ...target,
    title: target.topic,
    reason: reasonParts.join(' · '),
    practiceMode,
    topicBody: nextTopic?.body || '',
    summary: nextTopic ? topicSummary(nextTopic) : target.summary,
  }
}

export function buildCurriculumMap({ categories = [], progress = {}, lang = 'german' }) {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'CORE']
  const allTopics = categories.flatMap(category => (category.topics || []).map(topic => {
    const key = topicKey(lang, category.cat, topic.title)
    const row = progress[key] || {}
    return {
      key,
      category: category.cat,
      topic: topic.title,
      level: levelFromCategory(category.cat),
      mastery: row.mastery || 0,
      status: row.status || 'new',
      summary: topicSummary(topic),
    }
  }))

  const bucket = levels.map(level => {
    const topics = allTopics.filter(item => item.level === level)
    const completed = topics.filter(item => item.mastery >= 80).length
    const unlocked = level === 'A1' || allTopics.some(item => item.level === levels[levels.indexOf(level) - 1] && item.mastery >= 70)
    return {
      level,
      unlocked,
      total: topics.length,
      completed,
      progress: topics.length ? Math.round((completed / topics.length) * 100) : 0,
      topics: topics.sort((a, b) => a.mastery - b.mastery),
    }
  }).filter(group => group.total > 0)

  return { levels: bucket, allTopics }
}

export function runGrammarQualityChecks({ categories = [], lang = 'german' }) {
  const issues = []
  const seenIds = new Set()
  const seenTopics = new Set()
  let topicsWithoutExercises = 0

  for (const category of categories || []) {
    for (const topic of category.topics || []) {
      const topicId = topicKey(lang, category.cat, topic.title)
      if (!topic.title || !topic.title.trim()) {
        issues.push({ severity: 'error', type: 'topic-title', message: `Empty topic title in ${category.cat}` })
      }
      if (seenTopics.has(topicId)) {
        issues.push({ severity: 'error', type: 'duplicate-topic', message: `Duplicate topic key: ${topicId}` })
      }
      seenTopics.add(topicId)

      if (!String(topic.body || '').trim()) {
        issues.push({ severity: 'warn', type: 'empty-body', message: `No body text for ${category.cat} · ${topic.title}` })
      }

      const exercises = getGrammarExercises(lang, topic.title)
      if (!exercises.length) topicsWithoutExercises += 1
      for (const exercise of exercises) {
        if (!exercise.id) {
          issues.push({ severity: 'error', type: 'exercise-id', message: `${topic.title}: exercise without id` })
          continue
        }
        if (seenIds.has(exercise.id)) {
          issues.push({ severity: 'error', type: 'duplicate-exercise', message: `Duplicate exercise id: ${exercise.id}` })
        }
        seenIds.add(exercise.id)
        if (!exercise.question || !String(exercise.question).trim()) {
          issues.push({ severity: 'error', type: 'empty-question', message: `${topic.title}: ${exercise.id} has empty question` })
        }
        if (!exercise.answer || !String(exercise.answer).trim()) {
          issues.push({ severity: 'error', type: 'empty-answer', message: `${topic.title}: ${exercise.id} has empty answer` })
        }
        if (exercise.type === 'multiple_choice') {
          const options = Array.isArray(exercise.options) ? exercise.options.filter(Boolean) : []
          if (options.length < 2) {
            issues.push({ severity: 'error', type: 'mc-options', message: `${topic.title}: ${exercise.id} needs at least 2 options` })
          }
          if (options.length && !options.includes(exercise.answer)) {
            issues.push({ severity: 'error', type: 'mc-answer', message: `${topic.title}: ${exercise.id} answer is not in options` })
          }
        }
        if (exercise.type === 'sentence_builder') {
          const tokens = Array.isArray(exercise.tokens) ? exercise.tokens.filter(Boolean) : []
          if (!tokens.length) {
            issues.push({ severity: 'error', type: 'builder-tokens', message: `${topic.title}: ${exercise.id} missing tokens` })
          }
        }
      }
    }
  }

  if (!categories.length) {
    issues.push({ severity: 'error', type: 'no-categories', message: 'No grammar categories loaded' })
  }

  return {
    ok: issues.filter(item => item.severity === 'error').length === 0,
    topicsWithoutExercises,
    issues,
  }
}
