import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './lib/ThemeContext.jsx'
import { supabase } from './lib/supabase.js'
import { getProfile, bumpSession, bumpActivity } from './utils/db.js'

import AuthScreen        from './components/AuthScreen.jsx'
import LangSelect        from './components/LangSelect.jsx'
import Header            from './components/Header.jsx'
import Sidebar           from './components/Sidebar.jsx'
import BottomNav         from './components/BottomNav.jsx'
import HomeScreen        from './screens/HomeScreen.jsx'
import FlashcardScreen   from './screens/FlashcardScreen.jsx'
import GrammarScreen     from './screens/GrammarScreen.jsx'
import DictionaryScreen  from './screens/DictionaryScreen.jsx'
import ExercisesScreen   from './screens/ExercisesScreen.jsx'
import ProfileScreen     from './screens/ProfileScreen.jsx'
import SettingsScreen    from './screens/SettingsScreen.jsx'
import ChatScreen        from './screens/ChatScreen.jsx'
import AdminScreen       from './screens/AdminScreen.jsx'
import LearnedWordsScreen from './screens/LearnedWordsScreen.jsx'
import DuelScreen        from './screens/DuelScreen.jsx'
import FriendsScreen     from './screens/FriendsScreen.jsx'
import CustomWordsScreen    from './screens/CustomWordsScreen.jsx'
import PracticeQueueScreen from './screens/PracticeQueueScreen.jsx'

function Inner() {
  const { C } = useTheme()
  const [session,     setSession]     = useState(undefined)
  const [notifQueue,    setNotifQueue]    = useState([])
  const [friendReqCount,setFriendReqCount]= useState(0)
  const [dmCount,       setDmCount]       = useState(0)

  const pushNotif = (icon, title, body, color, page) => {
    const id = Date.now()
    setNotifQueue(q => [...q.slice(-2), { id, icon, title, body, color, page }])
    setTimeout(() => setNotifQueue(q => q.filter(n => n.id !== id)), 5000)
  }
  const dismissNotif = (id) => setNotifQueue(q => q.filter(n => n.id !== id))

  useEffect(() => {
    const fs = 'md'
    const sizes = { sm:90, md:100, lg:115, xl:130 }
    document.body.style.zoom = (sizes[fs]||100)/100
  }, [])

  const [profile,     setProfile]     = useState(null)
  const [page,        setPage]        = useState(() => window.history.state?.page || 'home')

  const navigate = (newPage) => {
    setPage(newPage)
    window.history.pushState({ page: newPage }, '', '/')
  }

  useEffect(() => {
    window.history.replaceState({ page: 'home' }, '', '/')
    const onPop = (e) => {
      const prev = e.state?.page
      if (prev) setPage(prev)
      else { setPage('home'); window.history.pushState({ page: 'home' }, '', '/') }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dictCat,     setDictCat]     = useState(null)
  const [showLangSel, setShowLangSel] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setPage('home'); window.history.replaceState({ page:'home' },'','/') }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    const p = await getProfile(uid)
    setProfile(p)
    if (p?.current_lang) {
      bumpSession(uid)
      bumpActivity(uid)
    }
  }

  const handleLogout = () => supabase.auth.signOut()

  const handleLangChange = async (lang) => {
    const { updateProfile } = await import('./utils/db.js')
    await updateProfile(session.user.id, { current_lang: lang })
    setProfile(p => ({ ...p, current_lang: lang }))
    setShowLangSel(false)
    navigate('home')
    bumpSession(session.user.id)
    bumpActivity(session.user.id)
  }

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) return
    supabase.from('friends').select('id', { count:'exact', head:true })
      .eq('friend_id', uid).eq('status','pending')
      .then(({ count }) => setFriendReqCount(count || 0))
    supabase.from('direct_messages').select('id', { count:'exact', head:true })
      .eq('receiver_id', uid).eq('read', false)
      .then(({ count }) => setDmCount(count || 0))

    const ch = supabase.channel('app-notifs-'+uid)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'friends', filter:`friend_id=eq.${uid}` }, async ({ new: row }) => {
        setFriendReqCount(c => c + 1)
        const { data: p } = await supabase.from('profiles').select('username').eq('id', row.user_id).single()
        if (p) pushNotif('👥', 'მეგობრობის მოწვევა', `${p.username} გამოგიგზავნა მეგობრობის მოწვევა!`, '#818cf8', 'friends')
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'friends', filter:`user_id=eq.${uid}` }, async ({ new: row }) => {
        if (row.status === 'accepted') {
          const { data: p } = await supabase.from('profiles').select('username').eq('id', row.friend_id).single()
          if (p) pushNotif('🎉', 'მეგობრობა დამყარდა!', `${p.username} დაეთანხმა მოწვევას!`, '#34d399', 'friends')
        }
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'direct_messages', filter:`recipient_id=eq.${uid}` }, async ({ new: msg }) => {
        setDmCount(c => c + 1)
        const { data: p } = await supabase.from('profiles').select('username').eq('id', msg.sender_id).single()
        if (p) pushNotif('✉️', p.username, (msg.text||'').slice(0, 55) + ((msg.text||'').length > 55 ? '...' : ''), '#6366f1', 'chat')
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'duels', filter:`opponent_id=eq.${uid}` }, ({ new: d }) => {
        pushNotif('⚔️', 'დუელის გამოწვევა!', `${d.challenger_name} გამოგიწვია ${d.lang} დუელში!`, '#f59e0b', 'duel')
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [session?.user?.id])

  if (session === undefined) return (<div style={{ minHeight:'100vh', background: C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:40 }}>🌍</span></div>)
  if (!session) return <AuthScreen />
  if (!profile) return (<div style={{ minHeight:'100vh', background: C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color: C.ts, fontSize:14 }}>პროფილი იტვირთება...</div></div>)

  const isFirstTime = !profile.current_lang
  if (isFirstTime || showLangSel) return <LangSelect onSelect={handleLangChange} isFirstTime={isFirstTime} />

  const user = { id: session.user.id, username: profile.username, isAdmin: profile.is_admin, chat_blocked: profile.chat_blocked, notif_enabled: profile.notif_enabled, theme_mode: profile.theme_mode, font_size: profile.font_size, grammar_goal: profile.grammar_goal, daily_grammar_target: profile.daily_grammar_target }
  const lang = profile.current_lang

  if (page === 'learnedWords') return (<div style={{ background: C.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', color: C.t, fontFamily:"'Inter',system-ui,sans-serif", transition:'background .3s' }}><LearnedWordsScreen user={user} lang={lang} onBack={() => navigate('profile')} /></div>)

  return (
    <div style={{ background: C.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <Header lang={lang} onSidebar={() => setSidebarOpen(o => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNav={navigate} activeCat={dictCat} onCat={setDictCat} />
      <div style={{ paddingTop:56, paddingBottom:70, minHeight:'100vh', background: C.bg, color: C.t, fontFamily:"'Inter',system-ui,sans-serif", overflowY:'auto', transition:'background .3s, color .3s' }}>
        {page==='home'       && <HomeScreen       user={user} lang={lang} onNav={navigate} />}
        {page==='flashcards' && <FlashcardScreen  user={user} lang={lang} />}
        {page==='grammar'    && <GrammarScreen    lang={lang} />}
        {page==='dictionary' && <DictionaryScreen lang={lang} activeCat={dictCat} />}
        {page==='exercises'  && <ExercisesScreen  user={user} lang={lang} />}
        {page==='profile'    && <ProfileScreen    user={user} lang={lang} onNav={navigate} />}
        {page==='settings'   && <SettingsScreen   user={user} lang={lang} onLangChange={() => setShowLangSel(true)} onLogout={handleLogout} onNav={navigate} onProfileChange={(patch) => setProfile(p => ({ ...p, ...patch }))} />}
        {page==='chat'       && <ChatScreen       user={user} lang={lang} />}
        {page==='admin' && user.isAdmin && <AdminScreen lang={lang} user={user} />}
        {page==='duel'       && <DuelScreen        user={user} lang={lang} onBack={() => navigate('home')} />}
        {page==='friends'    && <FriendsScreen     user={user} onNav={navigate} onChallenge={() => navigate('duel')} />}
        {page==='customWords'   && <CustomWordsScreen    user={user} lang={lang} onBack={() => navigate('settings')} />}
        {page==='practiceQueue'&& <PracticeQueueScreen user={user} lang={lang} onBack={() => navigate('profile')} />}
      </div>
      <BottomNav page={page} onNav={(p) => { navigate(p); if (p==='chat') setDmCount(0) }} isAdmin={user.isAdmin} friendReqCount={friendReqCount} dmCount={dmCount} />
      {notifQueue.map((n, idx) => (<div key={n.id} onClick={()=>{ navigate(n.page); dismissNotif(n.id) }} style={{ position:'fixed', left:12, right:12, zIndex:9998, top: 68 + idx * 72, background:'rgba(10,13,32,0.97)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid '+C.bdL, borderLeft:'4px solid '+n.color, borderRadius:16, padding:'11px 14px', boxShadow:'0 18px 50px rgba(0,0,0,.3)', cursor:'pointer' }}><div style={{ display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>{n.icon}</span><div style={{ flex:1 }}><div style={{ color:'#fff', fontWeight:800, fontSize:13 }}>{n.title}</div><div style={{ color:'#cbd5e1', fontSize:12, marginTop:2 }}>{n.body}</div></div><button onClick={(e)=>{e.stopPropagation(); dismissNotif(n.id)}} style={{ border:'none', background:'transparent', color:'#cbd5e1', fontSize:18, cursor:'pointer' }}>×</button></div></div>))}
    </div>
  )
}

export default function App() {
  return <ThemeProvider><Inner /></ThemeProvider>
}
