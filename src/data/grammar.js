const GR = {
  // ═══════════════════════════════════════════════════════
  // 🇩🇪 GERMAN
  // ═══════════════════════════════════════════════════════
  german: [
    { cat: 'Artikel & Genus', icon: '📝', topics: [
      { title: 'Der, Die, Das — სქესი',
        body: `გერმანულ არსებით სახელებს სამი სქესი აქვს:\n\n**მამრობითი (Maskulinum) → der**\n• der Mann (მამაკაცი), der Hund (ძაღლი), der Tisch (მაგიდა)\n• ხშირი დაბოლოებები: -er, -en, -el, -ling, -ismus\n\n**მდედრობითი (Femininum) → die**\n• die Frau (ქალი), die Katze (კატა), die Schule (სკოლა)\n• ხშირი დაბოლოებები: -ung, -heit, -keit, -schaft, -ion, -tät\n\n**საშუალო (Neutrum) → das**\n• das Kind (ბავშვი), das Buch (წიგნი), das Auto (მანქანა)\n• ხშირი დაბოლოებები: -chen, -lein, -ment, -tum, -um\n\n**მნიშვნელოვანი:**\n• სქესი უნდა ისწავლო სიტყვასთან ერთად!\n• der → er (ნაცვალსახელი)\n• die → sie\n• das → es`,
        ex: ['Der Hund ist groß. — ძაღლი დიდია.','Die Katze schläft. — კატა სძინავს.','Das Kind spielt. — ბავშვი თამაშობს.'] },
      { title: 'Artikel — მაწარმოებელი',
        body: `**განსაზღვრული (bestimmt) → the:**\n• der / die / das (ერთ.), die (მრავ.)\n\n**განუსაზღვრელი (unbestimmt) → a/an:**\n• ein (მ.) / eine (მდ.) / ein (საშ.)\n\n**უმაწარმოებლო (Nullartikel):**\n• სახელებთან: Ich trinke Wasser. (ვსვამ წყალს)\n• პროფესიებთან: Er ist Arzt. (ის ექიმია)\n• ქვეყნებთან: Ich komme aus Deutschland.\n\n**Plural — მრავლობითი:**\n• ყველა სქესი მრავლობითში → die\n• der Mann → die Männer\n• die Frau → die Frauen\n• das Kind → die Kinder`,
        ex: ['Der Mann trinkt einen Kaffee.','Eine Frau liest ein Buch.','Kinder spielen gern draußen.'] },
    ]},

    { cat: 'Kasus — ბრუნვები', icon: '🔄', topics: [
      { title: 'Nominativ — სახელობითი',
        body: `**Nominativ = ვინ? / რა?** (სუბიექტი)\n\nარტიკლი Nominativ-ში:\n• der → der / ein\n• die → die / eine\n• das → das / ein\n• Plural → die\n\n**გამოყენება:**\n• წინადადების სუბიექტი\n• sein-ის შემდეგ (Das ist ein Hund.)\n\nმაგ.: **Der Mann** kauft Brot. (მამაკაცი ყიდულობს პურს)\nმაგ.: Das ist **eine Katze**. (ეს კატაა)`,
        ex: ['Der Lehrer erklärt die Aufgabe.','Eine Frau kommt ins Zimmer.','Das Kind ist müde.'] },
      { title: 'Akkusativ — სახელობ. (პირდ. დამატება)',
        body: `**Akkusativ = ვინ? / რას?** (პირდაპირი დამატება)\n\nარტიკლი Akkusativ-ში:\n• der → **den** / einen\n• die → die / eine (არ იცვლება!)\n• das → das / ein (არ იცვლება!)\n• Plural → die\n\n⚠️ **მხოლოდ მამრობითი იცვლება: der → den**\n\n**Akkusativ-ის პრეპოზიციები:**\ndurch, für, gegen, ohne, um, bis, entlang\n\nმაგ.: Ich sehe **den Mann**. (ვხედავ მამაკაცს)\nმაგ.: Er kauft **einen Hund**. (ის ყიდულობს ძაღლს)`,
        ex: ['Ich sehe den Mann dort.','Er kauft einen neuen Computer.','Sie liebt die Musik sehr.'] },
      { title: 'Dativ — ნათ. (არაპ. დამატება)',
        body: `**Dativ = ვის?** (არაპირდაპირი დამატება)\n\nარტიკლი Dativ-ში:\n• der → **dem** / einem\n• die → **der** / einer\n• das → **dem** / einem\n• Plural → **den** (+n მრ.)\n\n**Dativ-ის პრეპოზიციები:**\naus, bei, mit, nach, seit, von, zu, gegenüber, außer\n\n**Wechselpräpositionen (Dativ = სადაც):**\nan, auf, hinter, in, neben, über, unter, vor, zwischen\n\nმაგ.: Ich helfe **dem Mann**.\nმაგ.: Sie gibt **der Frau** ein Buch.\nმაგ.: Das Buch liegt auf **dem Tisch**.`,
        ex: ['Ich helfe dem alten Mann.','Sie gibt der Freundin ein Geschenk.','Das Buch liegt auf dem Tisch.'] },
      { title: 'Genitiv — კუთვნილება',
        body: `**Genitiv = ვისი?** (კუთვნილება)\n\nარტიკლი Genitiv-ში:\n• der → **des** (+s/-es სუბ.) / eines\n• die → **der** / einer\n• das → **des** (+s/-es) / eines\n• Plural → **der**\n\n**Genitiv-ის პრეპოზიციები:**\nwegen, trotz, während, statt, aufgrund, innerhalb\n\nმაგ.: Das ist das Auto **des Mannes**. (ეს მამაკაცის მანქანაა)\nმაგ.: Die Farbe **der Katze** ist schwarz.\nმაგ.: Wegen **des Wetters** bleibe ich zu Hause.\n\n**სალაპარაკო გერმანულში** Genitiv-ს ხშირად von+Dativ ცვლის:\nDas Auto von dem Mann.`,
        ex: ['Das Buch des Lehrers ist interessant.','Wegen des Regens bleiben wir zu Hause.','Trotz der Kälte geht er spazieren.'] },
    ]},

    { cat: 'Verben — ზმნები', icon: '⚡', topics: [
      { title: 'Präsens — აწმყო',
        body: `**სუსტი ზმნები (schwache Verben):**\nrachten (ჩაწ.): machen — machst — macht\n\nich mach**e**\ndu mach**st**\ner/sie/es mach**t**\nwir mach**en**\nihr mach**t**\nsie/Sie mach**en**\n\n**ძლიერი ზმნები (starke Verben)** — ცვლიან ფუძის ხმოვანს:\n• fahren: ich fahre / du **fährst** / er **fährt**\n• lesen: ich lese / du **liest** / er **liest**\n• schlafen: ich schlafe / du **schläfst** / er **schläft**\n\n**sein (ყოფნა):**\nice bin / du bist / er ist / wir sind / ihr seid / sie sind\n\n**haben (ქონა):**\nich habe / du hast / er hat / wir haben / ihr habt / sie haben`,
        ex: ['Ich mache meine Hausaufgaben.','Er schläft jeden Tag acht Stunden.','Wir fahren morgen nach Berlin.'] },
      { title: 'Perfekt — ნამყო',
        body: `**Perfekt = haben/sein + Partizip II**\n\nძირითადად სასაუბრო ნამყოდ გამოიყენება.\n\n**haben + Partizip II** (უმეტეს ზმნებთან):\n• machen → ge**macht**\n• kaufen → ge**kauft**\n• spielen → ge**spielt**\n\n**sein + Partizip II** (გადაადგილება, ცვლილება):\n• fahren → **ist** ge**fahren**\n• gehen → **ist** ge**gangen**\n• kommen → **ist** ge**kommen**\n• bleiben → **ist** ge**blieben**\n\n**არარეგულარული Partizip II:**\nschreiben → geschrieben\nsehen → gesehen\ngeben → gegeben\nnehmen → genommen\nessen → gegessen`,
        ex: ['Ich habe das Buch gelesen.','Sie ist gestern nach Berlin gefahren.','Wir haben Pizza gegessen.'] },
      { title: 'Präteritum — ნამყო (წერ.)',
        body: `**Präteritum** — ძირითადად წერილობით, sein/haben/Modal-თან სასაუბრო ენაშიც.\n\n**sein:**\nich **war** / du **warst** / er **war**\nwir **waren** / ihr **wart** / sie **waren**\n\n**haben:**\nich **hatte** / du **hattest** / er **hatte**\n\n**სუსტი ზმნები** (+te):\nmachen → ich **machte**, du **machtest**\nkaufen → ich **kaufte**\n\n**ძლიერი ზმნები** (ცვლიან ფუძეს):\ngehen → ich **ging**\nkommen → ich **kam**\nschreiben → ich **schrieb**\nfahren → ich **fuhr**\nsehen → ich **sah**`,
        ex: ['Er war gestern sehr müde.','Ich hatte keine Zeit dafür.','Sie ging in die Schule.'] },
      { title: 'Modalverben — მოდალ. ზმნები',
        body: `**6 Modalverben (Präsens):**\n\n**können** (შეძლება):\nich kann / du kannst / er kann\n→ Ich kann Deutsch sprechen.\n\n**müssen** (ვალდებულება):\nich muss / du musst / er muss\n→ Du musst jetzt schlafen.\n\n**wollen** (სურვილი):\nich will / du willst / er will\n→ Ich will Arzt werden.\n\n**dürfen** (ნებართვა):\nich darf / du darfst / er darf\n→ Hier darf man nicht rauchen.\n\n**sollen** (ბრძანება/ვალდ.):\nich soll / du sollst / er soll\n→ Du sollst früh aufstehen.\n\n**mögen / möchten** (მოწონება/სურვილი):\nich möchte / du möchtest / er möchte\n→ Ich möchte einen Kaffee.\n\n**სტრუქტურა:** Modal + Inf. → **ბოლოს!**\nIch kann heute **kommen**.`,
        ex: ['Ich kann gut schwimmen.','Du musst mehr lernen.','Darf ich hier sitzen?'] },
    ]},

    { cat: 'Satzbau — წინ. სტრუქ.', icon: '🏗️', topics: [
      { title: 'V2-Regel — ზმნა მე-2-ზე',
        body: `**მთავარი წესი: ზმნა ყოველთვის მე-2 პოზიციაზეა!**\n\nნორმალური თანმიმდევ.:\nSubjekt → Verb → Objekt\nIch kaufe das Buch.\n\n**ინვერსია** (სხვა ელემენტი 1-ლ პოზ.):\nHeute **kaufe** ich das Buch.\nIn Berlin **wohnt** mein Bruder.\nDas Buch **lese** ich gern.\n\n**რთული ზმნები** — ბოლო ნაწილი → ბოლოს:\nIch **stehe** um 7 Uhr **auf**.\nEr **hat** das Buch **gelesen**.\nIch **muss** heute **arbeiten**.\n\n⚠️ **კომპოზიტი ბოლოს:**\n1. Partizip II (Perfekt)\n2. Infinitiv (Modal)\n3. Präfix (trennbar)`,
        ex: ['Heute gehe ich ins Kino.','In München wohnt mein Freund.','Ich habe gestern viel gelernt.'] },
      { title: 'Nebensatz — დამოკიდ. წინ.',
        body: `**Nebensatz-ში ზმნა → ბოლოს!**\n\n**Konjunktionen (კავშირები):**\n• weil (რადგანაც): Ich lerne, weil ich die Sprache mag.\n• dass (რომ): Ich denke, dass er kommt.\n• wenn (თუ/როდესაც): Wenn ich Zeit habe, lerne ich.\n• obwohl (მიუხედავად): Obwohl es regnet, gehe ich.\n• damit (რათა): Ich lerne, damit ich Arbeit finde.\n• bevor (სანამ): Bevor ich schlafe, lese ich.\n• nachdem (მას შემდეგ): Nachdem er gegessen hat, schläft er.\n\n**სტრუქტურა:**\nHauptsatz + Konj. + Subjekt + ... + **Verb (ბოლოს)**\nIch bleibe zu Hause, weil ich krank **bin**.\nEr sagt, dass er morgen **kommt**.`,
        ex: ['Ich lerne Deutsch, weil ich Deutschland mag.','Er sagt, dass er nicht kommen kann.','Wenn das Wetter gut ist, gehen wir spazieren.'] },
      { title: 'Fragen — კითხვები',
        body: `**Ja/Nein-Fragen (დახ. კ.) — ზმნა პირველი:**\nKaufst du das Buch? (ყიდულობ?)\nHat er Zeit? (ჰყავს დრო?)\nKann sie schwimmen? (შეუძლია ცურვა?)\n\n**W-Fragen (ღია კ.) — W-სიტყვა პირველი:**\n• Wer? — ვინ? (Wer ist das?)\n• Was? — რა? (Was machst du?)\n• Wo? — სად? (Wo wohnst du?)\n• Woher? — საიდან? (Woher kommst du?)\n• Wohin? — სად(კენ)? (Wohin gehst du?)\n• Wann? — როდის? (Wann kommst du?)\n• Wie? — როგორ? (Wie heißt du?)\n• Warum? — რატომ? (Warum lernst du?)\n• Wie viel? — რამდენი? (Wie viel kostet das?)\n• Welch-? — რომელი? (Welches Buch liest du?)`,
        ex: ['Sprichst du Deutsch?','Wo wohnst du?','Warum lernst du Deutsch?'] },
    ]},

    { cat: 'Adjektive — ზედ.', icon: '🎨', topics: [
      { title: 'Adjektivdeklination',
        body: `ზედსართავის დაბოლოება დამოკიდებულია:\n1. სქესზე\n2. ბრუნვაზე\n3. რა ახლავს (der/ein/0)\n\n**Bestimmter Artikel + Adj. (der/die/das):**\n| | M | F | N | Pl |\n|Nom.| -e | -e | -e | -en |\n|Akk.| -en | -e | -e | -en |\n|Dat.| -en | -en | -en | -en |\n\nder alt**e** Mann\ndie jung**e** Frau\ndas klein**e** Kind\ndie schön**en** Blumen\n\n**Unbestimmter Artikel + Adj. (ein/eine):**\nNom. M: ein alt**er** Mann\nNom. F: eine jung**e** Frau\nNom. N: ein klein**es** Kind\n\n**ყველაზე მარტივი:** Predikativ — არ იცვლება!\nDer Mann ist alt. / Die Frau ist jung.`,
        ex: ['Das ist ein altes Haus.','Ich sehe den großen Hund.','Sie wohnt in einer kleinen Stadt.'] },
      { title: 'Komparativ & Superlativ',
        body: `**Komparativ** (+er, + als):\nschnell → schnell**er** als\ngroß → größ**er** als\nalt → ält**er** als\n\n**Superlativ** (am ...sten / der/die/das ...ste):\nschnell → am schnell**sten** / der schnellste\ngroß → am größ**ten** / der größte\ngut → am **besten** / der beste\n\n**არარეგულარული:**\ngut → besser → am besten\nviel → mehr → am meisten\ngern → lieber → am liebsten\nhoch → höher → am höchsten\nnah → näher → am nächsten\n\n**სტრუქტურა:**\nEr ist so groß **wie** ich. (ისეთივე)\nEr ist größer **als** ich. (უფრო)\nEr ist am größten. (ყველაზე)`,
        ex: ['Berlin ist größer als München.','Er spricht besser Deutsch als ich.','Das ist das schönste Bild, das ich je gesehen habe.'] },
    ]},

    { cat: 'Präpositionen — წინდ.', icon: '📍', topics: [
      { title: 'Wechselpräpositionen',
        body: `9 პრეპოზიცია, რომლებიც **Dativ** ან **Akkusativ**-ს იღებს:\nan, auf, hinter, in, neben, über, unter, vor, zwischen\n\n**Dativ → სად? (Wo?)**\nDas Buch liegt auf **dem** Tisch.\nIch bin in **der** Schule.\nEr steht vor **dem** Haus.\n\n**Akkusativ → სადაკენ? (Wohin?)**\nIch lege das Buch auf **den** Tisch.\nIch gehe in **die** Schule.\nEr geht vor **das** Haus.\n\n**სახსოვარი:**\nWo? = Dativ (დახ. = არ მოძრაობ)\nWohin? = Akkusativ (სვლა = მოძრაობ)\n\n**Verschmelzungen (შერწყმა):**\nan + dem = **am**, an + das = **ans**\nin + dem = **im**, in + das = **ins**\nauf + das = **aufs**, bei + dem = **beim**`,
        ex: ['Das Buch liegt auf dem Tisch.','Ich gehe in die Schule.','Er sitzt neben der Frau.'] },
      { title: 'Feste Präpositionen',
        body: `**+ Akkusativ:**\nbis, durch, für, gegen, ohne, um, entlang\n• Ich lerne für **die** Prüfung.\n• Er geht durch **den** Park.\n• Ohne **dich** bin ich traurig.\n\n**+ Dativ:**\naus, bei, mit, nach, seit, von, zu, gegenüber, außer\n• Ich komme aus **Deutschland**.\n• Ich wohne bei **meiner** Mutter.\n• Ich fahre mit **dem** Zug.\n• Seit **einem** Jahr lerne ich Deutsch.\n\n**+ Genitiv:**\nwegen, trotz, während, statt, aufgrund, innerhalb\n• Wegen **des** Regens bleibe ich.\n• Trotz **der** Kälte gehe ich.\n• Während **des** Sommers fahre ich.`,
        ex: ['Ich lerne seit einem Jahr Deutsch.','Wegen des Wetters bleibe ich zu Hause.','Ich fahre mit dem Zug nach Berlin.'] },
    ]},

    { cat: 'Trennbare Verben', icon: '✂️', topics: [
      { title: 'Trennbare & untrennbare Verben',
        body: `**Trennbare Verben (გამყოფი ზმნები):**\nPräfix → ბოლოში!\n\naufstehen: Ich stehe um 7 **auf**.\neinkaufen: Er kauft heute **ein**.\nanrufen: Sie ruft mich **an**.\nabfahren: Der Zug fährt um 8 **ab**.\n\n**გავრცელებული trennbare Präfixes:**\nab-, an-, auf-, aus-, bei-, ein-, fest-, her-, hin-\nmit-, nach-, vor-, weg-, zu-, zurück-\n\n**Perfekt-ში:** ge- შუაში!\naufstehen → auf**ge**standen\nanrufen → an**ge**rufen\n\n**Untrennbare Verben (განუყ.):**\nbe-, emp-, ent-, er-, ge-, miss-, ver-, zer-\n• verstehen → ich verstehe (nicht: ich stehe ver)\n• bekommen → ich bekomme\n• erzählen → er erzählt\n\nPerfekt-ში ge- **არ** ემატება:\nverstehen → verstand**en** (არა: ge-verstanden)`,
        ex: ['Ich stehe jeden Morgen um 6 Uhr auf.','Er ruft mich jeden Abend an.','Der Zug fährt um 9 Uhr ab.'] },
    ]},
  ],

  // ═══════════════════════════════════════════════════════
  // 🇬🇧 ENGLISH
  // ═══════════════════════════════════════════════════════
  english: [
    { cat: 'Nouns', icon: '📝', topics: [
      { title: 'Articles (a, an, the)', body: `**Indefinite Articles:**\n• "a" before consonant sounds: a book, a car\n• "an" before vowel sounds: an apple, an hour\n\n**Definite Article (the):**\n• Specific things: the book you gave me\n• Unique things: the sun, the moon\n• Superlatives: the best, the most beautiful\n\n**No Article:**\n• General plurals: Books are useful.\n• Proper nouns: London, Russia, John`, ex: ['A cat is sitting on the mat.', 'The book you gave me was amazing.', 'Books are very useful tools.'] },
      { title: 'Plural Forms', body: `**Regular:**\n• Add -s: cat→cats\n• Add -es (s,x,z,ch,sh): box→boxes\n• Consonant+y → -ies: baby→babies\n• Some -f/-fe → -ves: leaf→leaves\n\n**Irregular:**\n• man→men, child→children\n• foot→feet, mouse→mice\n• person→people, fish→fish`, ex: ['The children are playing.', 'She has two feet and ten toes.', 'Men and women work together.'] },
    ]},
    { cat: 'Verbs', icon: '⚡', topics: [
      { title: 'Present Simple', body: `Used for habits, facts, permanent states.\n\n**Structure:**\n• I/You/We/They + verb base: I work here.\n• He/She/It + verb+s/es: She works here.\n\n**Negative:** don't / doesn't + verb base\n**Question:** Do / Does + subject + verb base?\n\n**Key time words:** always, usually, often, sometimes, never, every day`, ex: ['She speaks three languages.', 'They don\'t eat meat.', 'Does he live in London?'] },
      { title: 'Past Simple', body: `Used for completed past actions.\n\n**Regular:** verb + -ed\n• work→worked, play→played\n\n**Common Irregulars:**\ngo→went, come→came, see→saw\nhave→had, be→was/were\n\n**Negative:** didn't + verb base\n**Question:** Did + subject + verb base?`, ex: ['I visited Paris last summer.', 'She didn\'t watch the movie.', 'Did you finish your homework?'] },
      { title: 'Present Perfect', body: `Form: have/has + past participle\n\n**Uses:**\n• Experience: I have visited Japan.\n• Recent action: She has just finished.\n• Duration: They have lived here for 10 years.\n\n**vs Past Simple:**\n• Past Simple: I visited Japan in 2019. (specific time)\n• Present Perfect: I have visited Japan. (life experience)`, ex: ['Have you ever tried sushi?', 'She has just arrived.', 'We haven\'t seen him since Monday.'] },
      { title: 'Future Tenses', body: `**Will** (predictions, spontaneous decisions):\n• I will call you tomorrow.\n\n**Be going to** (plans, evidence):\n• I\'m going to study tonight.\n• It\'s going to rain. (evidence)\n\n**Present Continuous** (fixed arrangements):\n• I\'m meeting Tom at 5pm tomorrow.`, ex: ['I will call you tomorrow.', 'They\'re going to move.', 'Will you be at the party?'] },
      { title: 'Conditional Sentences', body: `**Zero:** If + present → present\n• If you heat ice, it melts.\n\n**First:** If + present → will\n• If it rains, I will stay home.\n\n**Second:** If + past → would\n• If I had money, I would travel.\n\n**Third:** If + past perfect → would have\n• If I had studied, I would have passed.`, ex: ['If you study, you will pass.', 'If I were rich, I would travel.', 'If she had come, she would have met him.'] },
    ]},
    { cat: 'Adjectives & Adverbs', icon: '🎨', topics: [
      { title: 'Comparatives & Superlatives', body: `**Comparatives:**\n• Short: add -er: big→bigger\n• Long: more + adj: more beautiful\n• Irregular: good→better, bad→worse\n\n**Superlatives:**\n• Short: the + -est: the biggest\n• Long: the most: the most beautiful\n• Irregular: good→best, bad→worst`, ex: ['This is more interesting than that.', 'He is the fastest runner.', 'This is worse than I expected.'] },
    ]},
    { cat: 'Prepositions', icon: '📍', topics: [
      { title: 'Prepositions of Time', body: `**at:** at 5pm, at noon, at night\n**on:** on Monday, on 5th May\n**in:** in January, in 2024, in the morning\n\n**Duration:**\n• for (duration): for 5 years\n• since (starting point): since 2019\n• by (deadline): by Friday`, ex: ['The meeting is at 3pm on Monday.', 'She was born in 1995.', 'I need this by Friday.'] },
    ]},
  ],

  // ═══════════════════════════════════════════════════════
  // 🇷🇺 RUSSIAN
  // ═══════════════════════════════════════════════════════
  russian: [
    { cat: 'Существительные', icon: '📝', topics: [
      { title: 'Падежи — Cases', body: `6 ბრუნვა:\n\n**Именительный (Nom.):** ვინ/რა — Кот спит.\n**Родительный (Gen.):** ვისი — У кота белая шерсть.\n**Дательный (Dat.):** ვის — Дай коту молока.\n**Винительный (Acc.):** ვინ/რა (obj.) — Я вижу кота.\n**Творительный (Inst.):** ვის/რასთან — Я играю с котом.\n**Предложный (Prep.):** ვისზე/რაზე — Я думаю о коте.`, ex: ['Это книга студента. (Genitive)', 'Я дал книгу другу. (Dative)', 'Он думает о работе. (Prepositional)'] },
      { title: 'Род — Gender', body: `**Мужской (M):** consonant ან -й\n• стол, дом, чай, день\n\n**Женский (F):** -а / -я\n• книга, школа, земля\n\n**Средний (N):** -о / -е\n• окно, поле, море\n\nGender-ი მოქმედებს ზედსართავის, ნამყოს დაბოლოებაზე.`, ex: ['Большой красивый стол (M)', 'Большая красивая книга (F)', 'Большое красивое окно (N)'] },
    ]},
    { cat: 'Глаголы', icon: '⚡', topics: [
      { title: 'Вид глагола — Aspect', body: `**Несовершенный (Imperfective):** პროცესი/ჩვ.\n• читать: Я читаю книгу. (ვკითხ.)\n\n**Совершенный (Perfective):** დასრ. შედ.\n• прочитать: Я прочитал книгу. (წავიკ.)\n\n**Common pairs:**\nписать/написать, говорить/сказать, делать/сделать`, ex: ['Я каждый день читаю газету. (imp.)', 'Я уже прочитал эту книгу. (perf.)', 'Он говорил три часа. (imp.)'] },
      { title: 'Спряжение — Conjugation', body: `**I спр. (читать):**\nя читаю / ты читаешь / он читает\nмы читаем / вы читаете / они читают\n\n**II спр. (говорить):**\nя говорю / ты говоришь / он говорит\nмы говорим / вы говорите / они говорят\n\n**Irregular:**\nбыть: буду/будешь/будет\nидти: иду/идёшь/идёт\nхотеть: хочу/хочешь/хочет`, ex: ['Я говорю по-русски немного.', 'Мы едем в Москву завтра.', 'Они хотят учить русский.'] },
    ]},
  ],

  // ═══════════════════════════════════════════════════════
  // 🇪🇸 SPANISH
  // ═══════════════════════════════════════════════════════
spanish: [
    { cat: 'Sustantivos', icon: '📝', topics: [
      { title: 'Género — Gender', body: `**Masculine (-o):** el libro, el carro, el chico\n**Feminine (-a):** la casa, la chica, la mesa\n\n**Exceptions:**\n• el día, el problema, el tema (masc. despite -a)\n• la mano (fem. despite -o)\n\n**Articles:**\n• el / los (masc.)\n• la / las (fem.)\n• un / una (indefinite)\n\n**Contractions:** a+el=al, de+el=del`, ex: ['El libro es interesante.', 'La casa es grande.', 'Los estudiantes estudian mucho.'] },
    ]},
    { cat: 'Verbos', icon: '⚡', topics: [
      { title: 'Presente de Indicativo', body: `**-AR (hablar):**\nyo hablo / tú hablas / él habla\nnosotros hablamos / vosotros habláis / ellos hablan\n\n**-ER (comer):**\nyo como / tú comes / él come\n\n**-IR (vivir):**\nyo vivo / tú vives / él vive\n\n**Irregulars:**\nser: soy, eres, es, somos, sois, son\nestar: estoy, estás, está...\nir: voy, vas, va...\ntener: tengo, tienes, tiene...`, ex: ['Yo hablo español todos los días.', 'Ella come en el restaurante.', '¿Dónde vives tú?'] },
      { title: 'Ser vs Estar', body: `**SER** (permanent/identity):\n• Identity: Soy María.\n• Nationality: Ella es española.\n• Profession: Él es médico.\n• Time: Son las tres.\n\n**ESTAR** (temporary/location):\n• Location: Estoy en casa.\n• Emotional state: Estoy feliz.\n• Ongoing action: Estoy comiendo.`, ex: ['Soy estudiante pero estoy cansado.', '¿Cómo estás? — Estoy bien.', 'La fiesta es aquí pero no estoy aquí.'] },
      { title: 'Pretérito Indefinido', body: `**-AR (hablar):**\nyo hablé / tú hablaste / él habló\nnosotros hablamos / ellos hablaron\n\n**-ER/-IR (comer/vivir):**\nyo comí / tú comiste / él comió\n\n**Key irregulars:**\nser/ir: fui, fuiste, fue...\ntener: tuve, tuviste, tuvo...\nhacer: hice, hiciste, hizo...`, ex: ['Ayer fui al supermercado.', 'Ella habló con su jefe esta mañana.', '¿Qué hiciste el fin de semana?'] },
    ]},
  ],

  // ═══════════════════════════════════════════════════════
  // 🇫🇷 FRENCH
  // ═══════════════════════════════════════════════════════
  french: [
    { cat: 'Noms', icon: '📝', topics: [
      { title: 'Genre — Gender', body: `**Masculine indicators:**\n-age: le voyage, le fromage\n-ment: le gouvernement\n-eau: le gâteau\n\n**Feminine indicators:**\n-tion/-sion: la nation, la décision\n-ité/-té: la liberté, la qualité\n-ure: la culture, la nature\n\n**Articles:**\nle/la/l' → les (plural)\nun/une → des\ndu/de la/de l' (partitive)`, ex: ['Le livre est très intéressant.', 'La maison est grande.', 'Les enfants jouent dans le parc.'] },
    ]},
    { cat: 'Verbes', icon: '⚡', topics: [
      { title: "Présent de l'indicatif", body: `**-ER (parler):**\nje parle / tu parles / il parle\nnous parlons / vous parlez / ils parlent\n\n**-IR (finir):**\nje finis / tu finis / il finit\nnous finissons / vous finissez / ils finissent\n\n**-RE (vendre):**\nje vends / tu vends / il vend\n\n**Essentials:**\nêtre: suis, es, est, sommes, êtes, sont\navoir: ai, as, a, avons, avez, ont\naller: vais, vas, va, allons, allez, vont`, ex: ['Je parle français tous les jours.', 'Elle finit son travail à 18h.', 'Ils font du sport le matin.'] },
      { title: 'Passé Composé', body: `**avoir + past participle** (most verbs):\nje mangé, tu as mangé, il a mangé\n\n**être + past participle** (DR MRS VANDERTRAMP):\nDevenir, Rester, Mourir, Sortir, Venir, Aller,\nNaître, Descendre, Entrer, Rentrer, Tomber,\nRetourner, Arriver, Monter, Partir\n\nElle est allée (f.) / Il est allé (m.)\n\n**Agreement with être:** participle agrees in gender/number`, ex: ["J'ai mangé une pomme.", 'Elle est allée au marché hier.', 'Ils sont arrivés à minuit.'] },
      { title: 'Imparfait vs Passé Composé', body: `**Imparfait** — ongoing/habitual:\n• Formation: nous-form stem + -ais/-ais/-ait/-ions/-iez/-aient\n• Je lisais chaque soir. (I used to read every evening.)\n• Il faisait beau. (The weather was nice.)\n\n**Passé Composé** — completed event:\n• J'ai lu le livre. (I read the book.)\n\n**Key contrast:**\nJe dormais quand le téléphone a sonné.\n(I was sleeping when the phone rang.)`, ex: ["Quand j'étais enfant, j'habitais à Paris.", 'Il pleuvait quand nous sommes partis.', 'Elle lisait toujours avant de dormir.'] },
    ]},
  ],
};

export default GR;
