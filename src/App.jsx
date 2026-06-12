import { useState, useEffect } from 'react';
import { C } from './theme.js';
import { ls, ss, bumpActivity } from './utils/helpers.js';

import AuthScreen     from './components/AuthScreen.jsx';
import LangSelect     from './components/LangSelect.jsx';
import Header         from './components/Header.jsx';
import Sidebar        from './components/Sidebar.jsx';
import BottomNav      from './components/BottomNav.jsx';

import HomeScreen       from './screens/HomeScreen.jsx';
import FlashcardScreen  from './screens/FlashcardScreen.jsx';
import GrammarScreen    from './screens/GrammarScreen.jsx';
import DictionaryScreen from './screens/DictionaryScreen.jsx';
import ExercisesScreen  from './screens/ExercisesScreen.jsx';
import ProfileScreen    from './screens/ProfileScreen.jsx';
import SettingsScreen   from './screens/SettingsScreen.jsx';
import ChatScreen       from './screens/ChatScreen.jsx';
import AdminScreen      from './screens/AdminScreen.jsx';

export default function App() {
  const [user,        setUser]        = useState(() => ls('current_user', null));
  const [lang,        setLang]        = useState(() => ls('current_lang', null));
  const [page,        setPage]        = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dictCat,     setDictCat]     = useState(null);
  const [showLangSel, setShowLangSel] = useState(false);

  // Track sessions + activity on mount
  useEffect(() => {
    if (user) {
      ss(`sess_${user.username}`, (ls(`sess_${user.username}`, 0)) + 1);
      bumpActivity(user.username);
    }
  }, []); // eslint-disable-line

  const handleAuth = (u) => { ss('current_user', u); setUser(u); };
  const handleLang = (l) => { ss('current_lang', l); setLang(l); setShowLangSel(false); };

  const handleLogout = () => {
    ss('current_user', null);
    setUser(null);
    setLang(null);
    setPage('home');
    setSidebarOpen(false);
  };

  const handleLangChange = (l) => {
    ss('current_lang', l);
    setLang(l);
    setPage('home');
  };

  // ── Auth gates ───────────────────────────────────────────────────
  if (!user)              return <AuthScreen onAuth={handleAuth} />;
  if (!lang || showLangSel) return <LangSelect onSelect={handleLang} />;

  // ── Shared layout ────────────────────────────────────────────────
  const contentStyle = {
    paddingTop: 56,
    paddingBottom: 70,
    minHeight: '100vh',
    background: C.bg,
    color: C.t,
    fontFamily: "'Inter',system-ui,sans-serif",
    overflowY: 'auto',
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <Header lang={lang} onSidebar={() => setSidebarOpen(o => !o)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNav={setPage}
        activeCat={dictCat}
        onCat={setDictCat}
      />

      <div style={contentStyle}>
        {page === 'home'        && <HomeScreen       user={user} lang={lang} onNav={setPage} />}
        {page === 'flashcards'  && <FlashcardScreen  user={user} lang={lang} />}
        {page === 'grammar'     && <GrammarScreen    lang={lang} />}
        {page === 'dictionary'  && <DictionaryScreen lang={lang} activeCat={dictCat} />}
        {page === 'exercises'   && <ExercisesScreen  user={user} lang={lang} />}
        {page === 'profile'     && <ProfileScreen    user={user} lang={lang} onNav={setPage} />}
        {page === 'settings'    && <SettingsScreen   user={user} lang={lang} onLangChange={handleLangChange} onLogout={handleLogout} />}
        {page === 'chat'        && <ChatScreen       user={user} lang={lang} />}
        {page === 'admin' && user.isAdmin && <AdminScreen lang={lang} />}
      </div>

      <BottomNav page={page} onNav={setPage} isAdmin={user.isAdmin} />
    </div>
  );
}
