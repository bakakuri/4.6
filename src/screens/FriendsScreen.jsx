import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { getAllProfiles, getFriends, getPendingFriends, sendFriendRequest,
         respondFriendRequest, removeFriend, getFriendStatus } from '../utils/db.js'

function Avatar({ p, size=40, C }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
                  border:`2px solid ${C.bdL}`, background:C.card3,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:size*0.33, fontWeight:800, color:C.a }}>
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
  const [statuses, setStatuses]= useState({}) // userId → {id,status,user_id}
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
    const others = all.filter(p => p.id !== user.id)
    setAllUsers(others)
    // Load friendship status for search results
    const statMap = {}
    await Promise.all(others.slice(0,20).map(async p => {
      const s = await getFriendStatus(user.id, p.id).catch(()=>null)
      if (s) statMap[p.id] = s
    }))
    setStatuses(statMap)
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  const addFriend = async (p) => {
    setBusy(p.id)
    try {
      await sendFriendRequest(user.id, p.id)
      setStatuses(prev => ({ ...prev, [p.id]: { status:'pending', user_id: user.id } }))
      showToast(`${p.username}-ს მოწვევა გაიგზავნა`)
    } catch { showToast('შეცდომა', false) }
    setBusy(null)
  }

  const respond = async (req, accept) => {
    setBusy(req.id)
    await respondFriendRequest(req.id, accept)
    setPending(prev => prev.filter(r => r.id !== req.id))
    if (accept) {
      setFriends(prev => [...prev, req.user])
      showToast(`${req.user.username} მეგობრების სიაში დაემატა! 🎉`)
    } else {
      showToast('მოწვევა უარყოფილია')
    }
    setBusy(null)
  }

  const remove = async (p) => {
    if (!confirm(`${p.username} წაიშალოს მეგობრებიდან?`)) return
    await removeFriend(user.id, p.id)
    setFriends(prev => prev.filter(f => f.id !== p.id))
    setStatuses(prev => { const n={...prev}; delete n[p.id]; return n })
    showToast(`${p.username} მეგობრებიდან წაიშალა`)
  }

  const TABS = [
    { id:'friends', label:`👥 მეგობრები`, badge: friends.length },
    { id:'pending', label:`📬 მოწვევები`, badge: pending.length },
    { id:'search',  label:'🔍 ძებნა' },
  ]

  const filtSearch = allUsers.filter(p =>
    search.length > 1 && p.username.toLowerCase().includes(search.toLowerCase())
  )

  const FriendCard = ({ p, actions }) => (
    <div className="card-rise" style={{ ...gls({ padding:'12px 14px' }), marginBottom:8,
      display:'flex', alignItems:'center', gap:12 }}>
      <Avatar p={p} size={42} C={C} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:C.t, fontWeight:700, fontSize:14 }}>{p.username}</div>
        <div style={{ color:C.ts, fontSize:11, marginTop:1 }}>
          ⚡{p.xp||0} XP · 🔥{p.streak||0} streak
        </div>
      </div>
      <div style={{ display:'flex', gap:6 }}>{actions}</div>
    </div>
  )

  const Btn = ({ onClick, color, disabled, children }) => (
    <button onClick={onClick} disabled={disabled}
      style={{ background:`${color}22`, border:`1px solid ${color}44`, borderRadius:8,
        padding:'7px 10px', color, fontWeight:700, fontSize:11, cursor:'pointer',
        fontFamily:'inherit', opacity: disabled ? 0.5 : 1, whiteSpace:'nowrap' }}>
      {children}
    </button>
  )

  return (
    <div className="page-enter" style={{ padding:'14px 14px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {toast && (
        <div className="slide-up" style={{ position:'fixed', top:70, left:'50%',
          transform:'translateX(-50%)', zIndex:9999,
          background: toast.ok ? C.g : C.r, color:'#fff', borderRadius:12,
          padding:'10px 20px', fontWeight:700, fontSize:13,
          boxShadow:'0 4px 20px rgba(0,0,0,.3)', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ color:C.t, fontWeight:800, fontSize:20, marginBottom:16 }}>👥 მეგობრები</div>

      {/* Tabs */}
      <div style={{ display:'flex', background:C.card3, borderRadius:12, padding:4, marginBottom:16, gap:3 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, padding:'9px 4px', background: tab===t.id ? C.a : 'transparent',
              border:'none', borderRadius:9, cursor:'pointer', color: tab===t.id ? '#fff' : C.ts,
              fontWeight: tab===t.id ? 700 : 400, fontSize:11, fontFamily:'inherit',
              position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ background: tab===t.id ? 'rgba(255,255,255,.3)' : C.a,
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
        <div>
          {friends.length === 0
            ? <div style={{ textAlign:'center', paddingTop:60 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
                <div style={{ color:C.ts }}>მეგობრები ჯერ არ გაქვს</div>
                <div style={{ color:C.tm, fontSize:12, marginTop:4 }}>
                  "ძებნაში" სხვა მომხმარებლებს გაუგზავნე მოწვევა
                </div>
              </div>
            : friends.map(p => (
                <FriendCard key={p.id} p={p} actions={[
                  <Btn key="ch" onClick={()=>onChallenge(p)} color={C.a}>⚔️ დუელი</Btn>,
                  <Btn key="rm" onClick={()=>remove(p)} color={C.r}>✕</Btn>
                ]} />
              ))
          }
        </div>
      )}

      {/* ── PENDING ── */}
      {!loading && tab==='pending' && (
        <div>
          {pending.length === 0
            ? <div style={{ textAlign:'center', paddingTop:60 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
                <div style={{ color:C.ts }}>მოწვევები არ არის</div>
              </div>
            : pending.map(req => (
                <FriendCard key={req.id} p={req.user} actions={[
                  <Btn key="ac" onClick={()=>respond(req,true)}  color={C.g}  disabled={busy===req.id}>✅ მიღება</Btn>,
                  <Btn key="dc" onClick={()=>respond(req,false)} color={C.r}  disabled={busy===req.id}>❌ უარი</Btn>
                ]} />
              ))
          }
        </div>
      )}

      {/* ── SEARCH ── */}
      {!loading && tab==='search' && (
        <div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 მომხმარებლის სახელი..."
            autoComplete="off" autoCorrect="off"
            style={{ width:'100%', boxSizing:'border-box', background:C.card3,
              border:`1px solid ${C.bdL}`, borderRadius:12, padding:'12px 14px',
              color:C.t, fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:12 }}/>

          {search.length < 2
            ? <div style={{ textAlign:'center', color:C.ts, paddingTop:30, fontSize:13 }}>
                მინიმუმ 2 სიმბოლო ჩაწერე
              </div>
            : filtSearch.length === 0
            ? <div style={{ textAlign:'center', color:C.ts, paddingTop:30 }}>
                "{search}" ვერ მოიძებნა
              </div>
            : filtSearch.map(p => {
                const st = statuses[p.id]
                const isFriend  = st?.status === 'accepted'
                const isPending = st?.status === 'pending'
                const isSentByMe = isPending && st?.user_id === user.id
                return (
                  <FriendCard key={p.id} p={p} actions={[
                    isFriend
                      ? <Btn key="fr" onClick={()=>onChallenge(p)} color={C.a}>⚔️ დუელი</Btn>
                      : isSentByMe
                      ? <span style={{ color:C.ts, fontSize:11 }}>მოლოდინში...</span>
                      : isPending
                      ? <Btn key="ac" onClick={async()=>{
                            // Find pending request to accept
                            const pReq = pending.find(r=>r.user?.id===p.id)
                            if (pReq) { await respond(pReq,true); setTab('friends') }
                          }} color={C.g}>✅ მიღება</Btn>
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
