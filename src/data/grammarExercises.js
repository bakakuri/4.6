const EXERCISES = {
  german: {
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
    'Dativ — ნათ. (არაპ. დამატება)': [
      { id: 'dat-1', type: 'multiple_choice', question: 'Ich helfe ___ Mann.', options: ['dem', 'den', 'der'], answer: 'dem', explanation: 'Dativ-ში der → dem.' },
      { id: 'dat-2', type: 'fill_blank', question: 'Sie gibt ___ Frau ein Buch.', answer: 'der', explanation: 'Dativ-ში die → der.' },
      { id: 'dat-3', type: 'sentence_builder', question: 'დაალაგე: dem Mann / Ich / helfe', answer: 'Ich helfe dem Mann.', tokens: ['dem Mann', 'Ich', 'helfe'], explanation: 'helfen მოითხოვს Dativ-ს.' },
      { id: 'dat-4', type: 'error_correction', question: 'გაასწორე: Ich helfe den Mann.', answer: 'Ich helfe dem Mann.', explanation: 'helfen + Dativ: dem Mann.' },
      { id: 'dat-5', type: 'translation', question: 'თარგმნე: მე კაცს ვეხმარები.', answer: 'Ich helfe dem Mann.', explanation: 'Dativ პასუხობს კითხვას „ვის?“.' },
    ],
    'Genitiv — კუთვნილება': [
      { id: 'gen-1', type: 'multiple_choice', question: 'Das Auto ___ Mannes ist neu.', options: ['des', 'dem', 'den'], answer: 'des', explanation: 'Genitiv-ში der Mann → des Mannes.' },
      { id: 'gen-2', type: 'fill_blank', question: 'Die Farbe ___ Katze ist schwarz.', answer: 'der', explanation: 'Genitiv-ში die Katze → der Katze.' },
      { id: 'gen-3', type: 'sentence_builder', question: 'დაალაგე: des Mannes / Das Auto / ist neu', answer: 'Das Auto des Mannes ist neu.', tokens: ['des Mannes', 'Das Auto', 'ist neu'], explanation: 'Genitiv გამოხატავს კუთვნილებას.' },
      { id: 'gen-4', type: 'error_correction', question: 'გაასწორე: Das Auto der Mann ist neu.', answer: 'Das Auto des Mannes ist neu.', explanation: 'მამრობითი Genitiv: des + -s/-es.' },
      { id: 'gen-5', type: 'translation', question: 'თარგმნე: კაცის მანქანა ახალია.', answer: 'Das Auto des Mannes ist neu.', explanation: '„კაცის“ აქ Genitiv-ით გამოიხატება.' },
    ],
    'Präsens — აწმყო': [
      { id: 'pres-1', type: 'multiple_choice', question: 'Ich ___ Deutsch.', options: ['lerne', 'lernst', 'lernt'], answer: 'lerne', explanation: 'ich-თან დაბოლოებაა -e.' },
      { id: 'pres-2', type: 'fill_blank', question: 'Du ___ heute.', answer: 'arbeitest', explanation: 'du-თან დაბოლოებაა -st.' },
      { id: 'pres-3', type: 'sentence_builder', question: 'დაალაგე: Deutsch / Ich / lerne', answer: 'Ich lerne Deutsch.', tokens: ['Deutsch', 'Ich', 'lerne'], explanation: 'სწორი წყობაა: Ich lerne Deutsch.' },
      { id: 'pres-4', type: 'error_correction', question: 'გაასწორე: Ich lernst Deutsch.', answer: 'Ich lerne Deutsch.', explanation: 'ich → -e: ich lerne.' },
      { id: 'pres-5', type: 'translation', question: 'თარგმნე: ის ყოველდღე სძინავს.', answer: 'Er schläft jeden Tag.', explanation: 'er-ის ფორმაა schläft.' },
    ],
    'Perfekt — ნამყო': [
      { id: 'perf-1', type: 'multiple_choice', question: 'Ich ___ das Buch gelesen.', options: ['habe', 'bin', 'ist'], answer: 'habe', explanation: 'lesen ჩვეულებრივ იყენებს haben-ს.' },
      { id: 'perf-2', type: 'fill_blank', question: 'Sie ___ nach Berlin gefahren.', answer: 'ist', explanation: 'გადაადგილების fahren-ს აქ sein ახლავს.' },
      { id: 'perf-3', type: 'sentence_builder', question: 'დაალაგე: habe / Ich / gelesen / das Buch', answer: 'Ich habe das Buch gelesen.', tokens: ['habe', 'Ich', 'gelesen', 'das Buch'], explanation: 'Perfekt = haben/sein + Partizip II.' },
      { id: 'perf-4', type: 'error_correction', question: 'გაასწორე: Ich bin das Buch gelesen.', answer: 'Ich habe das Buch gelesen.', explanation: 'lesen ჩვეულებრივ haben-ს იყენებს.' },
      { id: 'perf-5', type: 'translation', question: 'თარგმნე: ჩვენ პიცა ვჭამეთ.', answer: 'Wir haben Pizza gegessen.', explanation: 'essen → haben gegessen.' },
    ],
    'Präteritum — ნამყო (წერ.)': [
      { id: 'pret-1', type: 'multiple_choice', question: 'Ich ___ gestern müde.', options: ['war', 'bin', 'habe'], answer: 'war', explanation: 'sein-ის Präteritum ფორმაა: ich war.' },
      { id: 'pret-2', type: 'fill_blank', question: 'Er ___ keine Zeit.', answer: 'hatte', explanation: 'haben-ის Präteritum ფორმაა: er hatte.' },
      { id: 'pret-3', type: 'sentence_builder', question: 'დაალაგე: gestern / war / Ich / müde', answer: 'Ich war gestern müde.', tokens: ['gestern', 'war', 'Ich', 'müde'], explanation: 'sein → war Präteritum-ში.' },
      { id: 'pret-4', type: 'error_correction', question: 'გაასწორე: Ich bin gestern müde.', answer: 'Ich war gestern müde.', explanation: 'წარსულში sein-ის ფორმაა war.' },
      { id: 'pret-5', type: 'translation', question: 'თარგმნე: მას დრო არ ჰქონდა.', answer: 'Er hatte keine Zeit.', explanation: 'haben → hatte Präteritum-ში.' },
    ],
  },
}

export function getGrammarExercises(lang, topicTitle) {
  return EXERCISES[lang]?.[topicTitle] || []
}

export default EXERCISES
