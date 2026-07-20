# LinguaMaster 🌍

> თანამედროვე, ინტერაქტიული ენის სწავლის პლატფორმა, შექმნილი React + Vite + Supabase ტექნოლოგიებზე.

LinguaMaster არის ენის სწავლის ვებ-აპლიკაცია, რომელიც აერთიანებს სიტყვების დამახსოვრებას, ფლეშქარდებს, გრამატიკას, ლექსიკონს, სავარჯიშოებს, პროგრესის თვალყურს, gamification-ს და სოციალურ ფუნქციებს ერთ სივრცეში.

## ✨ მთავარი შესაძლებლობები

### 📚 სწავლის სისტემა
- 🃏 Flashcards სიტყვების დასამახსოვრებლად
- 📖 ლექსიკონი და კატეგორიებად დაყოფილი სიტყვები
- 🧠 სავარჯიშოები და ინტერაქტიული ტესტები
- 📝 გრამატიკის სასწავლო განყოფილება
- 🔊 სიტყვის წარმოთქმის მოსმენა Text-to-Speech-ის საშუალებით
- 📅 Word of the Day
- 📊 პირადი პროგრესის თვალყურის დევნება
- 🔁 Learned Words და Practice Queue
- ✍️ Custom Words-ის დამატება

### 🎮 Gamification
- ⚡ XP სისტემა
- 🏆 დონეები და მიღწევები
- 🔥 Streak სისტემა
- 🎯 ყოველდღიური სასწავლო მიზნები
- 🥇 Leaderboard
- 📈 სწავლის სტატისტიკა და პროგრესი

### 👥 სოციალური ფუნქციები
- 👤 პროფილები
- 🤝 მეგობრების სისტემა
- 💬 ჩატი
- ✉️ პირადი შეტყობინებები
- ⚔️ Duel რეჟიმი
- 🔔 Realtime notifications

### 🛠️ ადმინისტრირება
- 🔐 Admin Panel
- 👥 მომხმარებლების მართვა
- 📝 სასწავლო კონტენტის მართვა
- 💬 ჩატის მოდერაცია

## 🧱 ტექნოლოგიური სტეკი

| ტექნოლოგია | დანიშნულება |
|---|---|
| React 18 | მომხმარებლის ინტერფეისი |
| Vite 5 | Development და Build სისტემა |
| Supabase | Authentication, Database და Realtime |
| PostgreSQL | მონაცემთა ბაზა Supabase-ის საშუალებით |
| JavaScript / JSX | აპლიკაციის ლოგიკა |
| CSS | Responsive და თემატური UI |
| Web Speech API | სიტყვის წარმოთქმა |

## 🗂️ პროექტის სტრუქტურა

```text
4.6/
├── public/
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx
│   │   ├── BottomNav.jsx
│   │   ├── Header.jsx
│   │   ├── LangSelect.jsx
│   │   └── Sidebar.jsx
│   │
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── FlashcardScreen.jsx
│   │   ├── GrammarScreen.jsx
│   │   ├── DictionaryScreen.jsx
│   │   ├── ExercisesScreen.jsx
│   │   ├── LearnedWordsScreen.jsx
│   │   ├── PracticeQueueScreen.jsx
│   │   ├── CustomWordsScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   ├── SettingsScreen.jsx
│   │   ├── ChatScreen.jsx
│   │   ├── DirectMessagesScreen.jsx
│   │   ├── FriendsScreen.jsx
│   │   ├── DuelScreen.jsx
│   │   └── AdminScreen.jsx
│   │
│   ├── data/
│   │   └── words.js
│   ├── lib/
│   │   ├── supabase.js
│   │   └── ThemeContext.jsx
│   ├── utils/
│   │   ├── db.js
│   │   ├── gamification.js
│   │   ├── helpers.js
│   │   └── tts.js
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   ├── main.jsx
│   └── theme.js
│
├── supabase/
│   └── schema.sql
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 ინსტალაცია

### 1. Repository-ის კლონირება

```bash
git clone https://github.com/bakakuri/4.6.git
cd 4.6
```

### 2. Dependencies-ის დაყენება

```bash
npm install
```

### 3. Environment Variables

შექმენი `.env` ფაილი პროექტის root დირექტორიაში:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ `.env` ფაილი არ უნდა ატვირთო საჯარო repository-ში, თუ ის შეიცავს საიდუმლო გასაღებებს. ადამიანებმა უკვე საკმარისი API key-ები ატვირთეს GitHub-ზე, ასე რომ ამ ტრადიციას ნუ გააგრძელებ.

### 4. Supabase-ის კონფიგურაცია

1. გახსენი Supabase Dashboard.
2. გადადი **SQL Editor**-ში.
3. გაუშვი [`supabase/schema.sql`](supabase/schema.sql).
4. დააკონფიგურირე Authentication.
5. საჭიროების შემთხვევაში ჩართე Realtime შესაბამის ცხრილებზე.

## 💻 Development

Development server-ის გასაშვებად:

```bash
npm run dev
```

შემდეგ გახსენი Vite-ის მიერ ნაჩვენები local URL.

## 🏗️ Production Build

```bash
npm run build
```

Build-ის preview:

```bash
npm run preview
```

## 🔐 Authentication

აპლიკაცია იყენებს Supabase Authentication-ს. მომხმარებლის რეგისტრაციისას ავტომატურად იქმნება შესაბამისი profile ჩანაწერი PostgreSQL-ში.

მონაცემთა ბაზაში გამოიყენება Row Level Security (RLS), რათა მომხმარებლის პროგრესი და პირადი მონაცემები დაცული იყოს შესაბამისი წვდომის წესებით.

## 🌐 Realtime

Supabase Realtime გამოიყენება ისეთი ფუნქციებისთვის, როგორიცაა:

- ახალი ჩატის შეტყობინებები
- მეგობრობის მოთხოვნები
- პირადი შეტყობინებები
- Duel გამოწვევები
- მომხმარებლის აქტივობისა და XP-ის განახლებები

## 🎨 UI და UX

- Responsive დიზაინი
- Mobile-first გამოცდილება
- Dark / Light Theme
- Bottom Navigation მობილურისთვის
- Sidebar ნავიგაცია
- Smooth transitions და animations
- App-like ინტერფეისი

## 📊 მონაცემთა ბაზა

ძირითადი Supabase ცხრილები მოიცავს:

- `profiles`
- `word_progress`
- `chat_messages`
- `activity`
- სოციალური ფუნქციებისთვის საჭირო დამატებითი ცხრილები

სქემა და RLS პოლიტიკები აღწერილია [`supabase/schema.sql`](supabase/schema.sql)-ში.

## 🛡️ უსაფრთხოება

- Supabase Authentication
- PostgreSQL Row Level Security
- მომხმარებლის მონაცემებზე წვდომის პოლიტიკები
- Admin-only ფუნქციები
- საჯარო repository-ში საიდუმლო გასაღებების არშენახვა

## 📌 მიმდინარე პროექტი

LinguaMaster აქტიურად ვითარდება და მისი არქიტექტურა გათვლილია ახალი ენების, სასწავლო კურსების, დამატებითი სავარჯიშოებისა და სოციალური ფუნქციების დამატებაზე.

## 📄 License

ამ პროექტის ლიცენზია ამჟამად ცალკე განსაზღვრული არ არის.

---

<p align="center">
  Made with ❤️ and a slightly unreasonable amount of code for learning languages.
</p>
