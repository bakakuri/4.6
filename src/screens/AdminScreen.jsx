import { useTheme } from '../lib/ThemeContext.jsx'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  getAllProfiles, getSiteStats,
  adminSetXP, adminSetStreak, adminToggleAdmin, adminToggleBlock,
  adminDeleteMessage, adminDeleteUserMessages, adminBroadcast
} from '../utils/db.js'

const LANG_FLAG = { german:'🇩🇪', english:'🇬🇧', russian:'🇷🇺', spanish:'🇪🇸', french:'🇫🇷' }

export default function AdminScreen({ lang, user }) {
  const { C, gls } = useTheme()
  const [tab,       setTab]     = useState('users')
  const [profiles,  setProfiles]= useState([])
  const [chatMsgs,  setChatMsgs]= useState([])
  const [stats,     setStats]   = useState(null)
  const [loading,   setLoading] = useState(true)
  const [editId,    setEditId]  = useState(null)
  const [editXP,    setEditXP]  = useState('')
  const [editStreak,setEditStreak]=useState('')
  const [search,    setSearch]  = useState('')
  const [chatSearch,setChatSearch]=useState('')
  const [broadcast, setBroadcast]=useState('')
  const [toast,     setToast]   = useState(null)
  const [saving,    setSaving]  = useState(null)

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [ps, st, { data: msgs }] = await Promise.all([
      getAllProfiles(),
      getSiteStats(),
      supabase.from('chat_messages').select('*').order('created_at',{ascending:false}).limit(100)
    ])
    setProfiles(ps); setStats(st)
    setChatMsgs((msgs||[]).reverse())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── User actions ─────────────────────────────────────────────
  const saveXP = async (p) => {
    if (!editXP) return
    setSaving(`xp-${p.id}`)
    await adminSetXP(p.id, editXP)
    setProfiles(prev => prev.map(x => x.id===p.id ? {...x, xp:Number(editXP)} : x))
    showToast(`${p.username}: XP → ${editXP}`)
    setSaving(null)
  }
  const saveStreak = async (p) => {
    if (editStreak === '') return
    setSaving(`st-${p.id}`)
    await adminSetStreak(p.id, editStreak)
    setProfiles(prev => prev.map(x => x.id===p.id ? {...x, streak:Number(editStreak)} : x))
    showToast(`${p.username}: Streak → ${editStreak}`)
    setSaving(null)
  }
  const toggleAdmin = async (p) => {
    setSaving(`adm-${p.id}`)
    await adminToggleAdmin(p.id, !p.is_admin)
    setProfiles(prev => prev.map(x => x.id===p.id ? {...x,is_admin:!p.is_admin} : x))
    showToast(`${p.username}: ${!p.is_admin ? 'ადმინი დაემატა' : 'ადმინი მოხსნა'}`)
    setSaving(null)
  }
  const toggleBlock = async (p) => {
    setSaving(`blk-${p.id}`)
    await adminToggleBlock(p.id, !p.chat_blocked)
    setProfiles(prev => prev.map(x => x.id===p.id ? {...x,chat_blocked:!p.chat_blocked} : x))
    showToast(`${p.username}: ${!p.chat_blocked ? '🚫 დაიბლოკა' : '✅ განიბლოკა'}`, !p.chat_blocked ? false : true)
    setSaving(null)
  }
  const deleteUserMsgs = async (p) => {
    if (!confirm(`წაშლა ${p.username}-ს ყველა შეტყობინება?`)) return
    await adminDeleteUserMessages(p.id)
    setChatMsgs(prev => prev.filter(m => m.user_id !== p.id))
    showToast(`${p.username}-ს შეტყობინებები წაიშალა`)
  }

  // ── Chat actions ──────────────────────────────────────────────
  const deleteMsg = async (id) => {
    await adminDeleteMessage(id)
    setChatMsgs(prev => prev.filter(m => m.id !== id))
  }
  const sendBroadcast = async () => {
    if (!broadcast.trim()) return
    setSaving('broadcast')
    await adminBroadcast(broadcast.trim(), user?.username || 'Admin')
    setBroadcast('')
    showToast('📢 შეტყობინება გაიგზავნა ჩათში')
    setSaving(null)
  }

  const TABS = [
    { id:'users',  icon:'👥', label:'მომხმ.' },
    { id:'stats',  icon:'📊', label:'სტატ.' },
    { id:'chat',   icon:'💬', label:'ჩათი' },
    { id:'broadcast', icon:'📢', label:'ბრიფინ.' },
  ]

  const filtProfiles = profiles.filter(p =>
    !search || p.username.toLowerCase().includes(search.toLowerCase()))
  const filtMsgs = chatMsgs.filter(m =>
    !chatSearch || (m.username||'').toLowerCase().includes(chatSearch.toLowerCase()))

  if (loading) return (
    <div style={{padding:60,textAlign:'center',color:C.ts,fontFamily:"'Inter',system-ui,sans-serif"}}>
      იტვირთება...
    </div>
  )

  return (
    <div className="page-enter" style={{padding:'14px 14px 24px',fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* Toast */}
      {toast && (
        <div className="slide-up" style={{position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',
          zIndex:9999,background:toast.ok?C.g:C.r,color:'#fff',borderRadius:12,
          padding:'10px 20px',fontWeight:700,fontSize:13,boxShadow:'0 4px 20px rgba(0,0,0,.3)',
          whiteSpace:'nowrap'}}>
          {toast.msg}
        </div>
      )}

      <div style={{color:C.t,fontWeight:800,fontSize:20,marginBottom:4}}>⚙️ ადმინ პანელი</div>
      <div style={{color:C.ts,fontSize:11,marginBottom:16}}>
        👥 {profiles.length} მომხ. · ⚡ {stats?.totalXP?.toLocaleString()} XP სულ · 💬 {stats?.totalMsgs} შეტყობინება
      </div>

      {/* Tabs */}
      <div style={{display:'flex',background:C.card3,borderRadius:12,padding:4,marginBottom:16,gap:3}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:'8px 2px',background:tab===t.id?C.a:'transparent',border:'none',
              borderRadius:9,cursor:'pointer',color:tab===t.id?'#fff':C.ts,fontSize:10,
              fontWeight:tab===t.id?700:400,display:'flex',flexDirection:'column',
              alignItems:'center',gap:2,fontFamily:'inherit'}}>
            <span style={{fontSize:14}}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══ USERS ════════════════════════════════════════════ */}
      {tab==='users' && (
        <div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 მომხმარებლის ძებნა..."
            style={{width:'100%',boxSizing:'border-box',background:C.card3,border:`1px solid ${C.bdL}`,
              borderRadius:10,padding:'10px 14px',color:C.t,fontSize:13,marginBottom:12,
              outline:'none',fontFamily:'inherit'}} />

          {filtProfiles.map(p => {
            const isEdit = editId===p.id
            return (
              <div key={p.id} style={{...gls({padding:'12px 14px'}),marginBottom:8}}>
                {/* Header row */}
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom: isEdit?12:0}}>
                  <div style={{width:40,height:40,borderRadius:'50%',flexShrink:0,overflow:'hidden',
                    border:`2px solid ${p.is_admin?C.gold:p.chat_blocked?C.r:C.bdL}`,
                    background:C.card3,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <span style={{color:C.a,fontWeight:800,fontSize:14}}>{p.username.slice(0,2).toUpperCase()}</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                      <span style={{color:C.t,fontWeight:700,fontSize:14}}>{p.username}</span>
                      {p.is_admin && <span style={{background:`${C.gold}22`,color:C.gold,borderRadius:4,padding:'1px 5px',fontSize:9,fontWeight:700}}>ADMIN</span>}
                      {p.chat_blocked && <span style={{background:`${C.r}22`,color:C.r,borderRadius:4,padding:'1px 5px',fontSize:9,fontWeight:700}}>BLOCKED</span>}
                    </div>
                    <div style={{color:C.ts,fontSize:10,marginTop:1}}>
                      ⚡{p.xp||0} XP · 🔥{p.streak||0} · {LANG_FLAG[p.current_lang]||'?'} · {new Date(p.created_at).toLocaleDateString('ka-GE')}
                    </div>
                  </div>
                  <button onClick={()=>{setEditId(isEdit?null:p.id);setEditXP(String(p.xp||0));setEditStreak(String(p.streak||0))}}
                    style={{background:isEdit?`${C.a}22`:C.card3,border:`1px solid ${isEdit?C.a:C.bdL}`,
                      borderRadius:8,padding:'5px 10px',color:isEdit?C.a:C.ts,fontSize:11,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                    {isEdit?'✕':'✏️'}
                  </button>
                </div>

                {/* Edit panel */}
                {isEdit && (
                  <div style={{borderTop:`1px solid ${C.bdL}`,paddingTop:12}}>
                    {/* XP edit */}
                    <div style={{display:'flex',gap:6,marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{color:C.ts,fontSize:10,marginBottom:3}}>⚡ XP</div>
                        <input type="number" value={editXP} onChange={e=>setEditXP(e.target.value)}
                          style={{width:'100%',boxSizing:'border-box',background:C.card3,border:`1px solid ${C.bdL}`,
                            borderRadius:8,padding:'8px 10px',color:C.t,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{color:C.ts,fontSize:10,marginBottom:3}}>🔥 Streak</div>
                        <input type="number" value={editStreak} onChange={e=>setEditStreak(e.target.value)}
                          style={{width:'100%',boxSizing:'border-box',background:C.card3,border:`1px solid ${C.bdL}`,
                            borderRadius:8,padding:'8px 10px',color:C.t,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,marginBottom:8}}>
                      <button onClick={()=>saveXP(p)} disabled={saving===`xp-${p.id}`}
                        style={{flex:1,background:`${C.a}22`,border:`1px solid ${C.a}44`,borderRadius:8,
                          padding:'8px 0',color:C.a,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                        {saving===`xp-${p.id}`?'...':'💾 XP შენახვა'}
                      </button>
                      <button onClick={()=>saveStreak(p)} disabled={saving===`st-${p.id}`}
                        style={{flex:1,background:`${C.o}22`,border:`1px solid ${C.o}44`,borderRadius:8,
                          padding:'8px 0',color:C.o,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                        {saving===`st-${p.id}`?'...':'💾 Streak შენახვა'}
                      </button>
                    </div>
                    {/* Toggle buttons */}
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>toggleAdmin(p)} disabled={saving===`adm-${p.id}`}
                        style={{flex:1,background:p.is_admin?`${C.r}22`:`${C.gold}22`,
                          border:`1px solid ${p.is_admin?C.r:C.gold}44`,borderRadius:8,
                          padding:'8px 0',color:p.is_admin?C.r:C.gold,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                        {p.is_admin?'👑 ადმინი მოხსნა':'👑 ადმინი მიცემა'}
                      </button>
                      <button onClick={()=>toggleBlock(p)} disabled={saving===`blk-${p.id}`}
                        style={{flex:1,background:p.chat_blocked?`${C.g}22`:`${C.r}22`,
                          border:`1px solid ${p.chat_blocked?C.g:C.r}44`,borderRadius:8,
                          padding:'8px 0',color:p.chat_blocked?C.g:C.r,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                        {p.chat_blocked?'✅ განიბლოკოს':'🚫 ჩათი დაბლოკვა'}
                      </button>
                    </div>
                    <button onClick={()=>deleteUserMsgs(p)}
                      style={{width:'100%',marginTop:6,background:`${C.r}11`,border:`1px solid ${C.r}33`,
                        borderRadius:8,padding:'7px 0',color:C.r,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                      🗑️ {p.username}-ს ყველა შეტყობინება წაიშალოს
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══ STATS ════════════════════════════════════════════ */}
      {tab==='stats' && stats && (
        <div>
          {/* Summary cards */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
            {[
              {icon:'👥',label:'მომხმარებელი',val:stats.totalUsers,col:C.a},
              {icon:'⚡',label:'სულ XP',val:stats.totalXP.toLocaleString(),col:C.gold},
              {icon:'📅',label:'სესიები',val:stats.totalSessions.toLocaleString(),col:C.p},
              {icon:'🔥',label:'აქტიური',val:stats.activeToday,col:C.o},
              {icon:'💬',label:'შეტყობინება',val:stats.totalMsgs,col:C.g},
              {icon:'🚫',label:'დაბლოკილი',val:stats.blockedCount,col:C.r},
            ].map(s=>(
              <div key={s.label} className="pop-in" style={{...gls({padding:'14px 12px'}),textAlign:'center'}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                <div style={{color:s.col,fontWeight:900,fontSize:20}}>{s.val}</div>
                <div style={{color:C.ts,fontSize:10}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Language breakdown */}
          <div style={{...gls({padding:'14px'}),marginBottom:12}}>
            <div style={{color:C.t,fontWeight:700,fontSize:13,marginBottom:10}}>🌍 ენების განაწილება</div>
            {Object.entries(stats.byLang).sort((a,b)=>b[1]-a[1]).map(([l,n])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontSize:16,width:24}}>{LANG_FLAG[l]||'🌐'}</span>
                <span style={{color:C.t,fontSize:13,flex:1,textTransform:'capitalize'}}>{l}</span>
                <span style={{color:C.a,fontWeight:700,fontSize:13}}>{n}</span>
                <div style={{width:60,height:5,background:C.card3,borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:3,background:C.a,
                    width:`${Math.round((n/stats.totalUsers)*100)}%`,transition:'width .5s'}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Top users by XP */}
          <div style={{...gls({padding:'14px'})}}>
            <div style={{color:C.t,fontWeight:700,fontSize:13,marginBottom:10}}>🏆 Top 5 XP</div>
            {[...profiles].sort((a,b)=>(b.xp||0)-(a.xp||0)).slice(0,5).map((p,i)=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{width:20,fontSize:13}}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                </span>
                <div style={{width:26,height:26,borderRadius:'50%',overflow:'hidden',flexShrink:0,
                  background:C.card3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:C.a}}>
                  {p.photo_url
                    ? <img src={p.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : p.username.slice(0,2).toUpperCase()}
                </div>
                <span style={{flex:1,color:C.t,fontSize:13}}>{p.username}</span>
                <span style={{color:C.gold,fontWeight:700,fontSize:13}}>{(p.xp||0).toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ CHAT ════════════════════════════════════════════ */}
      {tab==='chat' && (
        <div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input value={chatSearch} onChange={e=>setChatSearch(e.target.value)}
              placeholder="🔍 ფილტრი მომხმ.-ით..."
              style={{flex:1,background:C.card3,border:`1px solid ${C.bdL}`,borderRadius:10,
                padding:'9px 12px',color:C.t,fontSize:12,outline:'none',fontFamily:'inherit'}}/>
            <button onClick={()=>{if(confirm('ყველა გაიწმინდოს?'))supabase.from('chat_messages').delete().gte('created_at','1970-01-01').then(()=>setChatMsgs([]))}}
              style={{background:`${C.r}22`,border:`1px solid ${C.r}44`,borderRadius:10,
                padding:'9px 12px',color:C.r,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
              🗑️ ყველა
            </button>
          </div>
          <div style={{color:C.ts,fontSize:11,marginBottom:8}}>
            {filtMsgs.length} შეტყობინება {chatSearch?`"${chatSearch}"-ისგან`:''}
          </div>
          {filtMsgs.map(m=>(
            <div key={m.id} style={{background:C.card2,borderRadius:10,padding:'8px 12px',
              marginBottom:5,borderLeft:`3px solid ${m.is_bot?C.a:C.bdL}`,
              display:'flex',gap:8,alignItems:'flex-start'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{color:m.is_bot?C.a:C.t,fontWeight:700,fontSize:11}}>{m.username}</span>
                  <span style={{color:C.tm,fontSize:9}}>{new Date(m.created_at).toLocaleTimeString('ka-GE',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style={{color:C.ts,fontSize:12,lineHeight:1.4,wordBreak:'break-word'}}>{m.text}</div>
              </div>
              <button onClick={()=>deleteMsg(m.id)}
                style={{background:`${C.r}22`,border:`1px solid ${C.r}33`,borderRadius:6,
                  padding:'3px 7px',color:C.r,fontSize:11,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                ✕
              </button>
            </div>
          ))}
          {filtMsgs.length===0 && <div style={{textAlign:'center',color:C.ts,paddingTop:30}}>შეტყობინება არ არის</div>}
        </div>
      )}

      {/* ══ BROADCAST ════════════════════════════════════════ */}
      {tab==='broadcast' && (
        <div>
          <div style={{...gls({padding:16}),marginBottom:12}}>
            <div style={{color:C.t,fontWeight:700,fontSize:14,marginBottom:4}}>📢 Broadcast შეტყობინება</div>
            <div style={{color:C.ts,fontSize:11,marginBottom:12}}>
              ეს შეტყობინება ყველა ენის ჩათში გამოჩნდება ადმინის სახელით
            </div>
            <textarea value={broadcast} onChange={e=>setBroadcast(e.target.value)}
              placeholder="შეიყვანე შეტყობინება..."
              rows={4}
              style={{width:'100%',boxSizing:'border-box',background:C.card3,border:`1px solid ${C.bdL}`,
                borderRadius:10,padding:'12px 14px',color:C.t,fontSize:14,resize:'vertical',
                outline:'none',fontFamily:'inherit',marginBottom:10}}/>
            <button onClick={sendBroadcast} disabled={!broadcast.trim()||saving==='broadcast'}
              style={{width:'100%',background:`linear-gradient(135deg,${C.a},${C.p})`,border:'none',
                borderRadius:12,padding:'13px 0',color:'#fff',fontWeight:700,fontSize:14,
                cursor:'pointer',fontFamily:'inherit',opacity:!broadcast.trim()||saving==='broadcast'?.5:1}}>
              {saving==='broadcast'?'იგზავნება...':'📢 გაგზავნა ყველასთვის'}
            </button>
          </div>

          {/* Quick broadcasts */}
          <div style={{...gls({padding:14})}}>
            <div style={{color:C.t,fontWeight:700,fontSize:13,marginBottom:10}}>⚡ სწრაფი შეტყობინებები</div>
            {[
              '🚀 LinguaMaster-ი განახლდა! ახალი ფუნქციები ხელმისაწვდომია.',
              '🔧 ტექნიკური სამუშაო მიმდინარეობს. მოგვიანებით სცადეთ.',
              '🏆 ახალი კვირა — ახალი შესაძლებლობა! სწავლა გააგრძელეთ!',
              '🎉 გილოცავთ ყველა აქტიურ სტუდენტს!',
            ].map(t=>(
              <button key={t} onClick={()=>setBroadcast(t)}
                style={{width:'100%',textAlign:'left',background:C.card3,border:`1px solid ${C.bdL}`,
                  borderRadius:10,padding:'10px 12px',color:C.ts,fontSize:12,cursor:'pointer',
                  fontFamily:'inherit',marginBottom:6,lineHeight:1.4}}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
