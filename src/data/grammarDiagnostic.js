export const GRAMMAR_DIAGNOSTIC_QUESTIONS = [
  { id: 'diag-1', area: 'Fundamentals', topic: 'Personalpronomen', type: 'multiple_choice', question: '___ lerne Deutsch.', options: ['Ich', 'Du', 'Wir'], answer: 'Ich', explanation: '„Ich“ ნიშნავს „მე“.' },
  { id: 'diag-2', area: 'Fundamentals', topic: 'sein', type: 'multiple_choice', question: 'Du ___ müde.', options: ['bin', 'bist', 'ist'], answer: 'bist', explanation: 'du + sein = bist.' },
  { id: 'diag-3', area: 'Fundamentals', topic: 'haben', type: 'multiple_choice', question: 'Wir ___ Zeit.', options: ['haben', 'hat', 'habt'], answer: 'haben', explanation: 'wir + haben = haben.' },
  { id: 'diag-4', area: 'Fundamentals', topic: 'Präsens', type: 'multiple_choice', question: 'Er ___ jeden Tag.', options: ['arbeiten', 'arbeitet', 'arbeitest'], answer: 'arbeitet', explanation: 'er-ის ფორმაა arbeitet.' },
  { id: 'diag-5', area: 'Cases', topic: 'Nominativ', type: 'multiple_choice', question: '___ Mann arbeitet.', options: ['Der', 'Den', 'Dem'], answer: 'Der', explanation: 'სუბიექტი Nominativ-შია.' },
  { id: 'diag-6', area: 'Cases', topic: 'Akkusativ', type: 'multiple_choice', question: 'Ich sehe ___ Mann.', options: ['der', 'den', 'dem'], answer: 'den', explanation: 'sehen იღებს პირდაპირ ობიექტს Akkusativ-ში.' },
  { id: 'diag-7', area: 'Cases', topic: 'Dativ', type: 'multiple_choice', question: 'Ich helfe ___ Frau.', options: ['die', 'der', 'den'], answer: 'der', explanation: 'helfen + Dativ.' },
  { id: 'diag-8', area: 'Cases', topic: 'Prepositions', type: 'multiple_choice', question: 'Ich fahre ___ dem Bus.', options: ['mit', 'für', 'ohne'], answer: 'mit', explanation: 'mit + Dativ.' },
  { id: 'diag-9', area: 'Verbs', topic: 'Modalverben', type: 'multiple_choice', question: 'Ich ___ Deutsch sprechen.', options: ['kann', 'kannst', 'können'], answer: 'kann', explanation: 'ich + können = kann.' },
  { id: 'diag-10', area: 'Word Order', topic: 'Verbzweitstellung', type: 'multiple_choice', question: 'რომელია სწორი?', options: ['Heute lerne ich Deutsch.', 'Heute ich lerne Deutsch.', 'Lerne heute ich Deutsch.'], answer: 'Heute lerne ich Deutsch.', explanation: 'მთავარ წინადადებაში ზმნა მეორე პოზიციაზეა.' },
  { id: 'diag-11', area: 'Word Order', topic: 'weil', type: 'multiple_choice', question: 'Ich bleibe zu Hause, weil ich krank ___.', options: ['bin', 'bist', 'ist'], answer: 'bin', explanation: 'weil-ქვეწინადადებაში ზმნა ბოლოში გადადის.' },
  { id: 'diag-12', area: 'Word Order', topic: 'dass', type: 'multiple_choice', question: 'Ich weiß, dass du Deutsch ___.', options: ['lernst', 'lernst du', 'lernend'], answer: 'lernst', explanation: 'dass-შიც ზმნა ბოლოშია.' },
  { id: 'diag-13', area: 'Verbs', topic: 'Perfect', type: 'multiple_choice', question: 'Ich ___ das Buch gelesen.', options: ['habe', 'bin', 'ist'], answer: 'habe', explanation: 'lesen იყენებს haben-ს.' },
  { id: 'diag-14', area: 'Verbs', topic: 'Perfect', type: 'multiple_choice', question: 'Sie ___ nach Berlin gefahren.', options: ['hat', 'ist', 'sind'], answer: 'ist', explanation: 'fahren მოძრაობის მნიშვნელობით ხშირად sein-ს იღებს.' },
  { id: 'diag-15', area: 'Verbs', topic: 'Trennbare Verben', type: 'multiple_choice', question: 'Ich stehe um 7 Uhr ___.', options: ['auf', 'an', 'ein'], answer: 'auf', explanation: 'aufstehen იყოფა: stehe ... auf.' },
  { id: 'diag-16', area: 'Verbs', topic: 'Reflexive Verben', type: 'multiple_choice', question: 'Ich freue ___.', options: ['mich', 'dich', 'sich'], answer: 'mich', explanation: 'ich-ის reflexive pronoun არის mich.' },
  { id: 'diag-17', area: 'Negation', topic: 'nicht', type: 'multiple_choice', question: 'Das ist ___ gut.', options: ['nicht', 'kein', 'nein'], answer: 'nicht', explanation: 'ზედსართავს არა-ფორმა: nicht gut.' },
  { id: 'diag-18', area: 'Negation', topic: 'kein', type: 'multiple_choice', question: 'Ich habe ___ Auto.', options: ['kein', 'nicht', 'nein'], answer: 'kein', explanation: 'არსებითი სახელის უარყოფა: kein Auto.' },
  { id: 'diag-19', area: 'Time', topic: 'Date', type: 'multiple_choice', question: '___ Montag arbeite ich.', options: ['Am', 'Im', 'Um'], answer: 'Am', explanation: 'დღეებთან ვიყენებთ am.' },
  { id: 'diag-20', area: 'Time', topic: 'Clock', type: 'multiple_choice', question: 'Es ist ___ Uhr.', options: ['acht', 'achte', 'achten'], answer: 'acht', explanation: 'საათის თქმაში: Es ist acht Uhr.' },
]

export function getGrammarDiagnosticQuestions(limit = 20) {
  return GRAMMAR_DIAGNOSTIC_QUESTIONS.slice(0, limit)
}

export function getDiagnosticAreaLabel(area) {
  return area
}
