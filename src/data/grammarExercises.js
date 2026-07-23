import A1_EXERCISES from './grammarA1Exercises.js'
import EXTRA_A1_EXERCISES from './grammarA1Extras.js'

function sanitizeExercise(exercise) {
  if (!exercise || typeof exercise !== 'object') return null

  const type = typeof exercise.type === 'string' ? exercise.type : 'multiple_choice'
  const question = typeof exercise.question === 'string' ? exercise.question : ''
  const answer = typeof exercise.answer === 'string' ? exercise.answer : ''
  const explanation = typeof exercise.explanation === 'string' ? exercise.explanation : ''

  if (type === 'multiple_choice') {
    const inputOptions = Array.isArray(exercise.options) ? exercise.options : []
    const options = [...new Set([answer, ...inputOptions].filter(o => typeof o === 'string' && o.trim()))]
    while (options.length < 3) {
      options.push(`ვარიანტი ${options.length + 1}`)
    }
    return { ...exercise, type, question, answer, explanation, options: options.slice(0, 4) }
  }

  if (type === 'sentence_builder') {
    const inputTokens = Array.isArray(exercise.tokens) ? exercise.tokens : []
    const tokens = inputTokens.length > 0
      ? inputTokens.filter(t => typeof t === 'string' && t.trim())
      : answer.split(/\s+/).filter(Boolean)
    return { ...exercise, type, question, answer, explanation, tokens }
  }

  return { ...exercise, type, question, answer, explanation }
}

function mergeTopicBanks(base = {}, extra = {}) {
  const merged = { ...base }
  for (const [topicTitle, exercises] of Object.entries(extra)) {
    merged[topicTitle] = [...(merged[topicTitle] || []), ...(Array.isArray(exercises) ? exercises : [])]
  }
  return merged
}

const A1_BANK = mergeTopicBanks(A1_EXERCISES, EXTRA_A1_EXERCISES)

const EXERCISES = {
  german: {
    ...A1_BANK,
    'Der, Die, Das — სქესი': [
      { id: 'gender-1', type: 'multiple_choice', question: '___ Mann ist groß.', options: ['Der', 'Die', 'Das'], answer: 'Der', explanation: 'Mann არის მამრობითი სქესის სიტყვა: der Mann.' },
      { id: 'gender-2', type: 'fill_blank', question: '___ Katze schläft.', answer: 'Die', explanation: 'Katze არის მდედრობითი სქესის სიტყვა: die Katze.' },
      { id: 'gender-3', type: 'sentence_builder', question: 'დაალაგე: spielt / das / Kind', answer: 'Das Kind spielt.', tokens: ['spielt', 'das', 'Kind'], explanation: 'სწორი წინადადებაა: Das Kind spielt.' },
      { id: 'gender-4', type: 'error_correction', question: 'გაასწორე: Die Mann ist groß.', answer: 'Der Mann ist groß.', explanation: 'Mann არის მამრობითი სქესის სიტყვა: der Mann.' },
      { id: 'gender-5', type: 'translation', question: 'თარგმნე გერმანულად: კატა სძინავს.', answer: 'Die Katze schläft.', explanation: 'Katze არის მდედრობითი სქესის: die Katze.' },
    ],
    'Nominativ — სახელობითი': [
      { id: 'nom-1', type: 'multiple_choice', question: '___ Mann kauft Brot.', options: ['Der', 'Den', 'Dem'], answer: 'Der', explanation: 'Mann არის სუბიექტი, ამიტომ Nominativ: der Mann.' },
      { id: 'nom-2', type: 'fill_blank', question: '___ Kind ist müde.', answer: 'Das', explanation: 'სუბიექტი Nominativ-შია: das Kind.' },
      { id: 'nom-3', type: 'sentence_builder', question: 'დაალაგე: kommt / die Frau', answer: 'Die Frau kommt.', tokens: ['kommt', 'die', 'Frau'], explanation: 'სწორი წყობაა: Die Frau kommt.' },
      { id: 'nom-4', type: 'error_correction', question: 'გაასწორე: Den Mann kauft Brot.', answer: 'Der Mann kauft Brot.', explanation: 'სუბიექტი Nominativ-შია: Der Mann.' },
      { id: 'nom-5', type: 'translation', question: 'თარგმნე: ბავშვი დაღლილია.', answer: 'Das Kind ist müde.', explanation: 'Das Kind არის Nominativ-ის სუბიექტი.' },
    ],
    'Akkusativ — სახელობ. (პირდ. დამატება)': [
      { id: 'akk-1', type: 'multiple_choice', question: 'Ich sehe ___ Mann.', options: ['der', 'den', 'dem'], answer: 'den', explanation: 'Akkusativ-ში der → den.' },
      { id: 'akk-2', type: 'fill_blank', question: 'Er kauft ___ Hund.', answer: 'einen', explanation: 'მამრობითი პირდაპირი ობიექტი Akkusativ-ში: einen Hund.' },
      { id: 'akk-3', type: 'sentence_builder', question: 'დაალაგე: den Mann / Ich / sehe', answer: 'Ich sehe den Mann.', tokens: ['den Mann', 'Ich', 'sehe'], explanation: 'სწორი წყობაა: Ich sehe den Mann.' },
      { id: 'akk-4', type: 'error_correction', question: 'გაასწორე: Ich sehe der Mann.', answer: 'Ich sehe den Mann.', explanation: 'sehen იღებს პირდაპირ ობიექტს Akkusativ-ში.' },
      { id: 'akk-5', type: 'translation', question: 'თარგმნე: მე ვხედავ კაცს.', answer: 'Ich sehe den Mann.', explanation: 'der Mann → den Mann Akkusativ-ში.' },
    ],
  },
}

export function getGrammarExercises(lang, topicTitle) {
  const raw = EXERCISES[lang]?.[topicTitle] || []
  return raw.map(sanitizeExercise).filter(Boolean)
}

export default EXERCISES
