const EXERCISES = {
  german: {
    'Der, Die, Das — სქესი': [
      { id: 'gender-1', type: 'multiple_choice', question: '___ Mann ist groß.', options: ['Der', 'Die', 'Das'], answer: 'Der', explanation: 'Mann არის მამრობითი სქესის სიტყვა: der Mann.' },
      { id: 'gender-2', type: 'multiple_choice', question: '___ Katze schläft.', options: ['Der', 'Die', 'Das'], answer: 'Die', explanation: 'Katze არის მდედრობითი სქესის სიტყვა: die Katze.' },
      { id: 'gender-3', type: 'multiple_choice', question: '___ Kind spielt.', options: ['Der', 'Die', 'Das'], answer: 'Das', explanation: 'Kind არის საშუალო სქესის სიტყვა: das Kind.' },
    ],
    'Nominativ — სახელობითი': [
      { id: 'nom-1', type: 'multiple_choice', question: '___ Mann kauft Brot.', options: ['Der', 'Den', 'Dem'], answer: 'Der', explanation: 'Mann არის წინადადების სუბიექტი, ამიტომ გამოიყენება Nominativ: der Mann.' },
      { id: 'nom-2', type: 'multiple_choice', question: '___ Kind ist müde.', options: ['Das', 'Den', 'Dem'], answer: 'Das', explanation: 'სუბიექტი Nominativ-შია: das Kind.' },
      { id: 'nom-3', type: 'multiple_choice', question: '___ Frau kommt.', options: ['Die', 'Der', 'Den'], answer: 'Die', explanation: 'Frau არის სუბიექტი: die Frau.' },
    ],
    'Akkusativ — სახელობ. (პირდ. დამატება)': [
      { id: 'akk-1', type: 'multiple_choice', question: 'Ich sehe ___ Mann.', options: ['der', 'den', 'dem'], answer: 'den', explanation: 'Akkusativ-ში მამრობითი არტიკლი იცვლება: der → den.' },
      { id: 'akk-2', type: 'multiple_choice', question: 'Er kauft ___ Hund.', options: ['einen', 'einem', 'ein'], answer: 'einen', explanation: 'მამრობითი სქესის პირდაპირი ობიექტი Akkusativ-ში: einen Hund.' },
      { id: 'akk-3', type: 'multiple_choice', question: 'Sie liest ___ Buch.', options: ['ein', 'einen', 'einem'], answer: 'ein', explanation: 'das Buch Akkusativ-ში არ იცვლება: ein Buch.' },
    ],
    'Dativ — ნათ. (არაპ. დამატება)': [
      { id: 'dat-1', type: 'multiple_choice', question: 'Ich helfe ___ Mann.', options: ['dem', 'den', 'der'], answer: 'dem', explanation: 'Dativ-ში der → dem.' },
      { id: 'dat-2', type: 'multiple_choice', question: 'Sie gibt ___ Frau ein Buch.', options: ['der', 'die', 'den'], answer: 'der', explanation: 'Dativ-ში die → der.' },
      { id: 'dat-3', type: 'multiple_choice', question: 'Das Buch liegt auf ___ Tisch.', options: ['dem', 'den', 'der'], answer: 'dem', explanation: 'ადგილმდებარეობა პასუხობს „სად?“ კითხვას, ამიტომ აქ Dativ არის: auf dem Tisch.' },
    ],
    'Genitiv — კუთვნილება': [
      { id: 'gen-1', type: 'multiple_choice', question: 'Das Auto ___ Mannes ist neu.', options: ['des', 'dem', 'den'], answer: 'des', explanation: 'Genitiv-ში der Mann → des Mannes.' },
      { id: 'gen-2', type: 'multiple_choice', question: 'Die Farbe ___ Katze ist schwarz.', options: ['der', 'die', 'den'], answer: 'der', explanation: 'Genitiv-ში die Katze → der Katze.' },
      { id: 'gen-3', type: 'multiple_choice', question: 'Wegen ___ Wetters bleibe ich zu Hause.', options: ['des', 'dem', 'den'], answer: 'des', explanation: 'wegen ხშირად მოითხოვს Genitiv-ს: wegen des Wetters.' },
    ],
    'Präsens — აწმყო': [
      { id: 'pres-1', type: 'multiple_choice', question: 'Ich ___ Deutsch.', options: ['lerne', 'lernst', 'lernt'], answer: 'lerne', explanation: 'ich-თან რეგულარული ზმნის დაბოლოებაა -e.' },
      { id: 'pres-2', type: 'multiple_choice', question: 'Du ___ heute.', options: ['arbeitest', 'arbeite', 'arbeitet'], answer: 'arbeitest', explanation: 'du-თან დაბოლოებაა -st: du arbeitest.' },
      { id: 'pres-3', type: 'multiple_choice', question: 'Er ___ jeden Tag.', options: ['schläft', 'schlafe', 'schlafen'], answer: 'schläft', explanation: 'er-თან გამოიყენება მესამე პირის ფორმა: er schläft.' },
    ],
    'Perfekt — ნამყო': [
      { id: 'perf-1', type: 'multiple_choice', question: 'Ich ___ das Buch gelesen.', options: ['habe', 'bin', 'ist'], answer: 'habe', explanation: 'lesen ჩვეულებრივ იყენებს haben-ს: Ich habe gelesen.' },
      { id: 'perf-2', type: 'multiple_choice', question: 'Sie ___ nach Berlin gefahren.', options: ['ist', 'hat', 'sind'], answer: 'ist', explanation: 'გადაადგილების fahren-ს Perfekt-ში ხშირად ახლავს sein: Sie ist gefahren.' },
      { id: 'perf-3', type: 'multiple_choice', question: 'Wir ___ Pizza gegessen.', options: ['haben', 'sind', 'ist'], answer: 'haben', explanation: 'essen იყენებს haben-ს: Wir haben gegessen.' },
    ],
    'Präteritum — ნამყო (წერ.)': [
      { id: 'pret-1', type: 'multiple_choice', question: 'Ich ___ gestern müde.', options: ['war', 'bin', 'habe'], answer: 'war', explanation: 'sein-ის Präteritum ფორმაა: ich war.' },
      { id: 'pret-2', type: 'multiple_choice', question: 'Er ___ keine Zeit.', options: ['hatte', 'hat', 'war'], answer: 'hatte', explanation: 'haben-ის Präteritum ფორმაა: er hatte.' },
      { id: 'pret-3', type: 'multiple_choice', question: 'Wir ___ nach Hause.', options: ['gingen', 'gehen', 'gegangen'], answer: 'gingen', explanation: 'gehen-ის Präteritum, wir ფორმაა: wir gingen.' },
    ],
  },
}

export function getGrammarExercises(lang, topicTitle) {
  return EXERCISES[lang]?.[topicTitle] || []
}

export default EXERCISES
