import A1_EXERCISES from './grammarA1Exercises.js'

const EXERCISES = {
  german: {
    ...A1_EXERCISES,
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
  return EXERCISES[lang]?.[topicTitle] || []
}

export default EXERCISES
