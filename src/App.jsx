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
import CustomWordsScreen from './screens/CustomWordsScreen.jsx'

function Inner() {
  const { C } = useTheme()
  const [session,     setSession]     = useState(undefined)

  // ── Global notifications state ─────────────────────────────────
  const [notifQueue,    setNotifQueue]    = useState([])
  const [friendReqCount,setFriendReqCount]= useState(0)
  const [dmCount,       setDmCount]       = useState(0)

  const pushNotif = (icon, title, body, color, page) => {
    const id = Date.now()
    setNotifQueue(q => [...q.slice(-2), { id, icon, title, body, color, page }])
    setTimeout(() => setNotifQueue(q => q.filter(n => n.id !== id)), 5000)
  }
  const dismissNotif = (id) => setNotifQueue(q => q.filter(n => n.id !== id))

  // ── Font size on mount ───────────────────────────────────────
  useEffect(() => {
    const fs = localStorage.getItem('lm_fs') || 'md'
    const sizes = { sm:90, md:100, lg:115, xl:130 }
    document.body.style.zoom = (sizes[fs]||100)/100
  }, [])

  const [profile,     setProfile]     = useState(null)
  const [page,        setPage]        = useState('home')
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
      else { setProfile(null); setPage('home') }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    const p = await getProfile(uid)
    setProfile(p)
    if (p?.current_lang) {
      // Only bump activity if lang is already set (not first-time user)
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
    setPage('home')
    // Now bump session/activity after lang is set
    bumpSession(session.user.id)
    bumpActivity(session.user.id)
  }

  // ── Global Realtime notifications (must be before early returns) ──
  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) return
    // Load initial pending count
    supabase.from('friends').select('id', { count:'exact', head:true })
      .eq('friend_id', uid).eq('status','pending')
      .then(({ count }) => setFriendReqCount(count || 0))

    // Load initial unread DM count
    supabase.from('direct_messages').select('id', { count:'exact', head:true })
      .eq('recipient_id', uid).eq('read', false)
      .then(({ count }) => setDmCount(count || 0))

    const ch = supabase.channel('app-notifs-'+uid)
      // Incoming friend request
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'friends',
        filter:`friend_id=eq.${uid}`
      }, async ({ new: row }) => {
        setFriendReqCount(c => c + 1)
        const { data: p } = await supabase.from('profiles')
          .select('username').eq('id', row.user_id).single()
        if (p) pushNotif('👥', 'მეგობრობის მოწვევა',
          `${p.username} გამოგიგზავნა მეგობრობის მოწვევა!`, '#818cf8', 'friends')
      })
      // Friend request accepted
      .on('postgres_changes', {
        event:'UPDATE', schema:'public', table:'friends',
        filter:`user_id=eq.${uid}`
      }, async ({ new: row }) => {
        if (row.status === 'accepted') {
          const { data: p } = await supabase.from('profiles')
            .select('username').eq('id', row.friend_id).single()
          if (p) pushNotif('🎉', 'მეგობრობა დამყარდა!',
            `${p.username} დაეთანხმა მოწვევას!`, '#34d399', 'friends')
        }
      })
      // New DM
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'direct_messages',
        filter:`recipient_id=eq.${uid}`
      }, async ({ new: msg }) => {
        setDmCount(c => c + 1)
        const { data: p } = await supabase.from('profiles')
          .select('username').eq('id', msg.sender_id).single()
        if (p) pushNotif('✉️', p.username,
          (msg.text||'').slice(0, 55) + ((msg.text||'').length > 55 ? '...' : ''),
          '#6366f1', 'chat')
      })
      // Duel challenge
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'duels',
        filter:`opponent_id=eq.${uid}`
      }, ({ new: d }) => {
        pushNotif('⚔️', 'დუელის გამოწვევა!',
          `${d.challenger_name} გამოგიწვია ${d.lang} დუელში!`, '#f59e0b', 'duel')
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [session?.user?.id]) // eslint-disable-line

  // ── Guards ────────────────────────────────────────────────
  if (session === undefined) return (
    <div style={{ minHeight:'100vh', background: C.bg,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontSize:40 }}>🌍</span>
    </div>
  )
  if (!session) return <AuthScreen />
  if (!profile) return (
    <div style={{ minHeight:'100vh', background: C.bg,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color: C.ts, fontSize:14 }}>პროფილი იტვირთება...</div>
    </div>
  )

  const isFirstTime = !profile.current_lang
  if (isFirstTime || showLangSel) {
    return (
      <LangSelect
        onSelect={handleLangChange}
        isFirstTime={isFirstTime}
      />
    )
  }

  const user = { id: session.user.id, username: profile.username, isAdmin: profile.is_admin, chat_blocked: profile.chat_blocked }
  const lang = profile.current_lang

  // ── Full-screen pages (no Header/Nav) ────────────────────
  if (page === 'learnedWords') {
    return (
      <div style={{ background: C.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto',
                    color: C.t, fontFamily:"'Inter',system-ui,sans-serif", transition:'background .3s' }}>
        <LearnedWordsScreen user={user} lang={lang} onBack={() => setPage('profile')} />
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <Header lang={lang} onSidebar={() => setSidebarOpen(o => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}
               onNav={setPage} activeCat={dictCat} onCat={setDictCat} />

      <div style={{ paddingTop:56, paddingBottom:70, minHeight:'100vh', background: C.bg,
                    color: C.t, fontFamily:"'Inter',system-ui,sans-serif",
                    overflowY:'auto', transition:'background .3s, color .3s' }}>
        {page==='home'       && <HomeScreen       user={user} lang={lang} onNav={setPage} />}
        {page==='flashcards' && <FlashcardScreen  user={user} lang={lang} />}
        {page==='grammar'    && <GrammarScreen    lang={lang} />}
        {page==='dictionary' && <DictionaryScreen lang={lang} activeCat={dictCat} />}
        {page==='exercises'  && <ExercisesScreen  user={user} lang={lang} />}
        {page==='profile'    && <ProfileScreen    user={user} lang={lang} onNav={setPage} />}
        {page==='settings'   && <SettingsScreen   user={user} lang={lang}
                                   onLangChange={() => setShowLangSel(true)}
                                   onLogout={handleLogout}
                                   onNav={setPage} />}
        {page==='chat'       && <ChatScreen       user={user} lang={lang} />}
        {page==='admin' && user.isAdmin && <AdminScreen lang={lang} user={user} />}
        {page==='duel'       && <DuelScreen        user={user} lang={lang} onBack={() => setPage('home')} />}
        {page==='friends'    && <FriendsScreen     user={user}
                                   onNav={setPage}
                                   onChallenge={(p) => { setPage('duel') }} />}
        {page==='customWords'&& <CustomWordsScreen user={user} lang={lang} onBack={() => setPage('settings')} />}
      </div>

      <BottomNav page={page} onNav={(p) => { setPage(p); if (p==='chat') setDmCount(0) }}
                 isAdmin={user.isAdmin} friendReqCount={friendReqCount} dmCount={dmCount} />

      {/* ── Global notification toasts ── */}
      {notifQueue.map((n, idx) => (
        <div key={n.id} onClick={()=>{ setPage(n.page); dismissNotif(n.id) }}
          style={{
            position:'fixed', left:12, right:12, zIndex:9998,
            top: 68 + idx * 72,
            background:'rgba(10,13,32,0.97)',
            backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
            border:'1px solid '+C.bdL,
            borderLeft:'4px solid '+n.color,
            borderRadius:16, padding:'11px 14px',
            boxShadow:'0 8px 40px rgba(0,0,0,0.55)',
            display:'flex', gap:10, alignItems:'center',
            cursor:'pointer', animation:'pageEnter 0.35s cubic-bezier(0.16,1,0.3,1) both',
            fontFamily:"'Inter',system-ui,sans-serif"
          }}>
          <span style={{ fontSize:26, flexShrink:0 }}>{n.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{n.title}</div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:2,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {n.body}
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation(); dismissNotif(n.id)}}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)',
              fontSize:18, cursor:'pointer', flexShrink:0, lineHeight:1 }}>✕</button>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <style>{`
        @keyframes pageEnter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .page-enter{animation:pageEnter 0.38s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes cardRise{from{opacity:0;transform:translateY(18px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .card-rise{animation:cardRise 0.42s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes popIn{0%{opacity:0;transform:scale(0.65)}65%{transform:scale(1.07)}100%{opacity:1;transform:scale(1)}}
        .pop-in{animation:popIn 0.36s cubic-bezier(0.34,1.56,0.64,1) both}
        @keyframes slideRight{from{opacity:0;transform:translateX(36px) scale(0.97)}to{opacity:1;transform:translateX(0) scale(1)}}
        .slide-right{animation:slideRight 0.38s cubic-bezier(0.16,1,0.3,1) both}
        @keyframes shake{0%,100%{transform:translateX(0)}18%{transform:translateX(-9px)}36%{transform:translateX(9px)}54%{transform:translateX(-6px)}72%{transform:translateX(5px)}}
        .shake{animation:shake 0.38s cubic-bezier(0.36,0.07,0.19,0.97)}
        @keyframes burstGlow{0%{box-shadow:0 0 0 0 rgba(17,196,144,.55)}60%{box-shadow:0 0 0 18px rgba(17,196,144,0)}100%{box-shadow:0 0 0 0 rgba(17,196,144,0)}}
        .burst{animation:burstGlow 0.55s ease-out}
        @keyframes xpFloat{0%{opacity:1;transform:translate(-50%,-50%) scale(0.5)}35%{opacity:1;transform:translate(-50%,-100%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-200%) scale(0.9)}}
        .xp-float{position:fixed;z-index:9999;pointer-events:none;font-weight:900;font-size:22px;animation:xpFloat 1.1s ease-out forwards}
        @keyframes streakPulse{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.2);filter:brightness(1.5) drop-shadow(0 0 5px #ff8c3a)}}
        .streak-pulse{animation:streakPulse 2.2s ease-in-out infinite}
        @keyframes scoreBounce{0%,100%{transform:scale(1)}40%{transform:scale(1.35)}}
        .score-bounce{animation:scoreBounce 0.35s cubic-bezier(0.34,1.56,0.64,1)}
        .tap{transition:transform .12s ease,opacity .12s ease}
        .tap:active{transform:scale(0.92)!important}
        @media(hover:hover) and (pointer:fine){.tap:hover{transform:translateY(-2px)}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
      `}</style>
      <Inner />
    </ThemeProvider>
  )
}
