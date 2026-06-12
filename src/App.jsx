import { useState, useEffect } from 'react'
import { C } from './theme.js'
import { supabase } from './lib/supabase.js'
import { getProfile, bumpSession, bumpActivity } from './utils/db.js'

import AuthScreen     from './components/AuthScreen.jsx'
import LangSelect     from './components/LangSelect.jsx'
import Header         from './components/Header.jsx'
import Sidebar        from './components/Sidebar.jsx'
import BottomNav      from './components/BottomNav.jsx'

import HomeScreen       from './screens/HomeScreen.jsx'
import FlashcardScreen  from './screens/FlashcardScreen.jsx'
import GrammarScreen    from './screens/GrammarScreen.jsx'
import DictionaryScreen from './screens/DictionaryScreen.jsx'
import ExercisesScreen  from './screens/ExercisesScreen.jsx'
import ProfileScreen    from './screens/ProfileScreen.jsx'
import SettingsScreen   from './screens/SettingsScreen.jsx'
import ChatScreen       from './screens/ChatScreen.jsx'
import AdminScreen      from './screens/AdminScreen.jsx'

export default function App() {
  const [session,     setSession]     = useState(undefined) // undefined = loading
  const [profile,     setProfile]     = useState(null)
  const [page,        setPage]        = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dictCat,     setDictCat]     = useState(null)
  const [showLangSel, setShowLangSel] = useState(false)

  // ── Session listener ─────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setPage('home') }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    const p = await getProfile(uid)
    setProfile(p)
    // bump session + activity in background
    bumpSession(uid)
    bumpActivity(uid)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleLangChange = async (lang) => {
    import('./utils/db.js').then(({ updateProfile }) =>
      updateProfile(session.user.id, { current_lang: lang })
    )
    setProfile(p => ({ ...p, current_lang: lang }))
    setShowLangSel(false)
    setPage('home')
  }

  // ── Loading splash ───────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.ts, fontSize: 32 }}>🌍</div>
      </div>
    )
  }

  if (!session)  return <AuthScreen />
  if (!profile)  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.ts, fontSize: 14 }}>პროფილი იტვირთება...</div>
    </div>
  )
  if (!profile.current_lang || showLangSel)
    return <LangSelect onSelect={handleLangChange} />

  // ── user object (passed to all screens) ─────────────────────
  const user = {
    id:       session.user.id,
    username: profile.username,
    isAdmin:  profile.is_admin,
  }
  const lang = profile.current_lang

  return (
    <div style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <Header lang={lang} onSidebar={() => setSidebarOpen(o => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}
               onNav={setPage} activeCat={dictCat} onCat={setDictCat} />

      <div style={{ paddingTop: 56, paddingBottom: 70, minHeight: '100vh', background: C.bg,
                    color: C.t, fontFamily: "'Inter',system-ui,sans-serif", overflowY: 'auto' }}>
        {page === 'home'       && <HomeScreen      user={user} lang={lang} onNav={setPage} />}
        {page === 'flashcards' && <FlashcardScreen user={user} lang={lang} />}
        {page === 'grammar'    && <GrammarScreen   lang={lang} />}
        {page === 'dictionary' && <DictionaryScreen lang={lang} activeCat={dictCat} />}
        {page === 'exercises'  && <ExercisesScreen  user={user} lang={lang} />}
        {page === 'profile'    && <ProfileScreen    user={user} lang={lang} onNav={setPage} />}
        {page === 'settings'   && <SettingsScreen   user={user} lang={lang}
                                    onLangChange={() => setShowLangSel(true)} onLogout={handleLogout} />}
        {page === 'chat'       && <ChatScreen       user={user} lang={lang} />}
        {page === 'admin' && user.isAdmin && <AdminScreen lang={lang} />}
      </div>

      <BottomNav page={page} onNav={setPage} isAdmin={user.isAdmin} />
    </div>
  )
}
