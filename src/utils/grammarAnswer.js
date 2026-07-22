export function normalizeGrammarAnswer(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isGrammarAnswerCorrect(userAnswer, exercise) {
  const user = normalizeGrammarAnswer(userAnswer)
  const accepted = [exercise?.answer, ...(Array.isArray(exercise?.acceptedAnswers) ? exercise.acceptedAnswers : [])]
    .filter(value => typeof value === 'string' && value.trim())
  return accepted.some(answer => normalizeGrammarAnswer(answer) === user)
}

export function getAcceptedGrammarAnswers(exercise) {
  return [exercise?.answer, ...(exercise?.acceptedAnswers || [])].filter(Boolean)
}
