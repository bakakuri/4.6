const cleanExample = value => String(value || '').split(' — ')[0].trim()
const georgianExample = value => String(value || '').split(' — ').slice(1).join(' — ').trim()

export function createA1Exercises(topic) {
  const examples = (topic?.ex || []).map(cleanExample).filter(Boolean)
  if (!examples.length) return []
  const sentence = examples[0]
  const words = sentence.split(/\s+/)
  const answer = words[0]
  const translation = georgianExample(topic.ex[0])
  const id = topic.title.toLowerCase().replace(/[^a-z0-9ა-ჰ]+/gi, '-').replace(/^-|-$/g, '')
  const distractors = [...new Set([examples[1], examples[2], 'Das ist ein Beispiel.'].filter(x => x && x !== sentence))].slice(0, 2)
  return [
    { id: `${id}-mc`, type: 'multiple_choice', question: 'რომელი მაგალითი შეესაბამება ამ თემას?', options: [sentence, ...distractors], answer: sentence, explanation: `სწორი მაგალითია: ${sentence}` },
    { id: `${id}-blank`, type: 'fill_blank', question: `შეავსე პირველი სიტყვა: ___ ${words.slice(1).join(' ')}`, answer, explanation: `სრული წინადადება: ${sentence}` },
    { id: `${id}-builder`, type: 'sentence_builder', question: 'ააწყვე სწორი წინადადება:', answer: sentence, tokens: [...words].sort(() => Math.random() - 0.5), explanation: `სწორი წყობაა: ${sentence}` },
    { id: `${id}-error`, type: 'error_correction', question: `გაასწორე შეცდომა: ${words.map((w, i) => i === 0 ? '???' : w).join(' ')}`, answer: sentence, explanation: `სწორი ფორმაა: ${sentence}` },
    { id: `${id}-translation`, type: 'translation', question: translation ? `თარგმნე გერმანულად: ${translation}` : 'ჩაწერე მოცემული გერმანული წინადადება:', answer: sentence, explanation: `სწორი პასუხია: ${sentence}` },
  ]
}
