import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getAllProfiles, getFriends, getPendingFriends, sendFriendRequest,
         respondFriendRequest, removeFriend, getFriendStatus } from '../utils/db.js'

function Avatar({ p, size=40, C }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
      border:'2px solid '+C.bdL, background:C.card3, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:Math.round(size*0.33), fontWeight:800, color:C.a }}>
      {p.photo_url
        ? <img src={p.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : (p.username||'?').slice(0,2).toUpperCase()}
    </div>
  )
}

export default function FriendsScreen({ user, onNav, onChallenge }) {
  const { C, gls } = useTheme()
  const [tab,      setTab]    = useState('friends')
  const [friends,  setFriends]= useState([])
  const [pending,  setPending]= useState([])
  const [search,   setSearch] = useState('')
  const [allUsers, setAllUsers]= useState([])
  const [statuses, setStatuses]= useState({})
  const [busy,     setBusy]   = useState(null)
  const [loading,  setLoading]= useState(true)
  const [toast,    setToast]  = useState(null)

  const showToast = (msg, ok=true) => {
    setToast({msg,ok}); setTimeout(()=>setToast(null), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [fr, pend, all] = await Promise.all([
      getFriends(user.id),
      getPendingFriends(user.id),
      getAllProfiles()
    ])
    setFriends(fr); setPending(pend)
    setAllUsers(all.filter(p => p.id !== user.id))
    // Pre-load statuses for first 30 users
    const statMap = {}
    await Promise.all(all.filter(p=>p.id!==user.id).slice(0,30).map(async p => {
      const s = await getFriendStatus(user.id, p.id).catch(()=>null)
      if (s) statMap[p.id] = s
    }))
    setStatuses(statMap)
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  // Dynamically load status when user appears in search
  useEffect(() => {
    if (search.length < 2) return
    const visible = allUsers.filter(p => p.username.toLowerCase().includes(search.toLowerCase()))
    visible.forEach(async p => {
      if (statuses[p.id] !== undefined) return
      const s = await getFriendStatus(user.id, p.id).catch(()=>null)
      setStatuses(prev => ({ ...prev, [p.id]: s || null }))
    })
  }, [search]) // eslint-disable-line

  // Realtime: incoming friend request
  useEffect(() => {
    const ch = supabase.channel('friends-screen')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'friends',
        filter:'friend_id=eq.'+user.id }, ({ new: row }) => {
        // Refresh pending list
        getPendingFriends(user.id).then(setPending)
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'friends' },
        () => load())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user.id]) // eslint-disable-line

  const addFriend = async (p) => {
    setBusy(p.id)
    try {
      await sendFriendRequest(user.id, p.id)
      setStatuses(prev => ({ ...prev, [p.id]: { status:'pending', user_id:user.id } }))
      showToast(p.username+'-ს მოწვევა გაიგზავნა')
    } catch { showToast('შეცდომა', false) }
    setBusy(null)
  }

  const respond = async (req, accept) => {
    setBusy(req.id)
    await respondFriendRequest(req.id, accept)
    setPending(prev => prev.filter(r => r.id !== req.id))
    if (accept) {
      setFriends(prev => [...prev, req.user])
      setStatuses(prev => ({ ...prev, [req.user.id]: { status:'accepted' } }))
      showToast(req.user.username+' მეგობრების სიაში დაემატა! ')
    } else {
      setStatuses(prev => ({ ...prev, [req.user.id]: null }))
      showToast('მოწვევა უარყოფილია')
    }
    setBusy(null)
  }

  // Accept by user ID (used in search tab)
  const acceptById = async (senderId) => {
    setBusy(senderId)
    try {
      // Find in already-loaded pending
      let req = pending.find(r => r.user?.id === senderId)
      if (!req) {
        // Fetch directly from DB
        const { data } = await supabase.from('friends')
          .select('id, user:user_id(id,username,xp,streak,photo_url)')
          .eq('user_id', senderId).eq('friend_id', user.id).eq('status','pending').single()
        req = data
      }
      if (req) { await respond(req, true); setTab('friends') }
      else showToast('მოწვევა ვერ მოიძებნა', false)
    } catch { showToast('შეცდომა', false) }
    setBusy(null)
  }

  const remove = async (p) => {
    if (!confirm(p.username+' წაიშალოს მეგობრებიდან?')) return
    await removeFriend(user.id, p.id)
    setFriends(prev => prev.filter(f => f.id !== p.id))
    setStatuses(prev => ({ ...prev, [p.id]: null }))
    showToast(p.username+' მეგობრებიდან წაიშალა')
  }

  const TABS = [
    { id:'friends',  label:'👥 მეგობრები', badge: friends.length },
    { id:'pending',  label:'📬 მოწვევები', badge: pending.length },
    { id:'search',   label:'🔍 ძებნა' },
  ]
  const filtSearch = allUsers.filter(p =>
    search.length > 1 && p.username.toLowerCase().includes(search.toLowerCase())
  )

  const Btn = ({ onClick, color, disabled, children }) => (
    <button onClick={onClick} disabled={disabled} className="tap"
      style={{ background:color+'22', border:'1px solid '+color+'44', borderRadius:8,
        padding:'7px 10px', color, fontWeight:700, fontSize:11, cursor:'pointer',
        fontFamily:'inherit', opacity:disabled?0.5:1, whiteSpace:'nowrap' }}>
      {children}
    </button>
  )

  const FriendCard = ({ p, actions, delay=0 }) => (
    <div className="card-rise" style={{ ...gls({ padding:'12px 14px' }), marginBottom:8,
      display:'flex', alignItems:'center', gap:12, animationDelay:delay+'ms' }}>
      <Avatar p={p} size={42} C={C} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:C.t, fontWeight:700, fontSize:14 }}>{p.username}</div>
        <div style={{ color:C.ts, fontSize:11, marginTop:1 }}>
          {p.xp||0} XP · {p.streak||0} streak
        </div>
      </div>
      <div style={{ display:'flex', gap:6 }}>{actions}</div>
    </div>
  )

  return (
    <div className="page-enter" style={{ padding:'14px 14px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {toast && (
        <div className="pop-in" style={{ position:'fixed', top:70, left:'50%',
          transform:'translateX(-50%)', zIndex:9999,
          background:toast.ok?C.g:C.r, color:'#fff', borderRadius:12,
          padding:'10px 20px', fontWeight:700, fontSize:13,
          boxShadow:'0 4px 20px rgba(0,0,0,.35)', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={()=>onNav('profile')} style={{ background:'none', border:'none',
          color:C.ts, cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ color:C.t, fontWeight:800, fontSize:20 }}>👥 მეგობრები</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:C.card3, borderRadius:12, padding:4, marginBottom:16, gap:3 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, padding:'9px 4px', background:tab===t.id?C.a:'transparent',
              border:'none', borderRadius:9, cursor:'pointer', color:tab===t.id?'#fff':C.ts,
              fontWeight:tab===t.id?700:400, fontSize:11, fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ background:tab===t.id?'rgba(255,255,255,.3)':C.r,
                color:'#fff', borderRadius:8, padding:'0 5px', fontSize:9, fontWeight:800 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', color:C.ts, paddingTop:40 }}>იტვირთება...</div>}

      {/* ── FRIENDS ── */}
      {!loading && tab==='friends' && (
        friends.length === 0
          ? <div style={{ textAlign:'center', paddingTop:60 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
              <div style={{ color:C.ts }}>მეგობრები ჯერ არ გაქვს</div>
              <div style={{ color:C.tm, fontSize:12, marginTop:4 }}>
                "ძებნაში" სხვა მომხმარებლებს გაუგზავნე მოწვევა
              </div>
            </div>
          : friends.map((p,i) => (
              <FriendCard key={p.id} p={p} delay={i*40} actions={[
                <Btn key="ch" onClick={()=>onChallenge(p)} color={C.a}>⚔️ დუელი</Btn>,
                <Btn key="rm" onClick={()=>remove(p)} color={C.r}>✕</Btn>
              ]} />
            ))
      )}

      {/* ── PENDING ── */}
      {!loading && tab==='pending' && (
        pending.length === 0
          ? <div style={{ textAlign:'center', paddingTop:60 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
              <div style={{ color:C.ts }}>მოწვევები არ არის</div>
            </div>
          : pending.map((req,i) => (
              <FriendCard key={req.id} p={req.user} delay={i*40} actions={[
                <Btn key="ac" onClick={()=>respond(req,true)}  color={C.g} disabled={busy===req.id}>✅ მიღება</Btn>,
                <Btn key="dc" onClick={()=>respond(req,false)} color={C.r} disabled={busy===req.id}>❌ უარი</Btn>
              ]} />
            ))
      )}

      {/* ── SEARCH ── */}
      {!loading && tab==='search' && (
        <div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 სახელი..." autoComplete="off" autoCorrect="off"
            style={{ width:'100%', boxSizing:'border-box', background:C.card3,
              border:'1px solid '+C.bdL, borderRadius:12, padding:'12px 14px',
              color:C.t, fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:12 }}/>

          {search.length < 2
            ? <div style={{ textAlign:'center', color:C.ts, paddingTop:30, fontSize:13 }}>
                მინიმუმ 2 სიმბოლო
              </div>
            : filtSearch.length === 0
            ? <div style={{ textAlign:'center', color:C.ts, paddingTop:30 }}>ვერ მოიძებნა</div>
            : filtSearch.map((p,i) => {
                const st = statuses[p.id]
                const isFriend  = st?.status === 'accepted'
                const isPending = st?.status === 'pending'
                const isSentByMe = isPending && st?.user_id === user.id
                return (
                  <FriendCard key={p.id} p={p} delay={i*40} actions={[
                    isFriend
                      ? <Btn key="fr" onClick={()=>onChallenge(p)} color={C.a}>⚔️ დუელი</Btn>
                      : isSentByMe
                      ? <span style={{ color:C.ts, fontSize:11 }}>მოლოდინში...</span>
                      : isPending
                      ? <Btn key="ac" onClick={()=>acceptById(p.id)} color={C.g} disabled={busy===p.id}>
                          {busy===p.id ? '...' : '✅ მიღება'}
                        </Btn>
                      : <Btn key="add" onClick={()=>addFriend(p)} color={C.p} disabled={busy===p.id}>
                          {busy===p.id ? '...' : '+ მეგობარი'}
                        </Btn>
                  ]} />
                )
              })
          }
        </div>
      )}
    </div>
  )
}
