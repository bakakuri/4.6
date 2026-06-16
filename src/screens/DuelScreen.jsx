
import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { supabase } from '../lib/supabase.js'
import { getAllProfiles, createDuel, respondDuel, submitDuelScore, getActiveDuel } from '../utils/db.js'

const TOTAL = 10
const norm = s => s.trim().replace(/\s+/g, ' ').toLowerCase()

export default function DuelScreen({ user, lang, onBack }) {
  const { C, gls } = useTheme()
  const lc = LANG[lang]

  // phase: lobby | sent | incoming | active | done
  const [phase,    setPhase]   = useState('lobby')
  const [users,    setUsers]   = useState([])
  const [duel,     setDuel]    = useState(null)
  const [wordObjs, setWordObjs]= useState([])
  const [q,        setQ]       = useState(0)
  const [inp,      setInp]     = useState('')
  const [fb,       setFb]      = useState(null)   // null | 'ok' | 'bad'
  const [myScore,  setMyScore] = useState(0)
  const [busy,     setBusy]    = useState(false)

  const isChallenger = duel?.challenger_id === user.id
  const opName  = duel ? (isChallenger ? duel.opponent_name   : duel.challenger_name) : ''
  const opScore = duel ? (isChallenger ? duel.op_score        : duel.ch_score)        : 0

  // ── Build word objects from stored IDs ───────────────────────
  const buildWords = useCallback((ids, lang) => {
    const all = allWords(lang)
    return ids.map(id => all.find(w => w.id === id)).filter(Boolean)
  }, [])

  // ── On mount: check for existing duel ────────────────────────
  useEffect(() => {
    const init = async () => {
      const d = await getActiveDuel(user.id)
      if (d) {
        setDuel(d)
        setWordObjs(buildWords(d.words, d.lang))
        if (d.status === 'pending') {
          setPhase(d.challenger_id === user.id ? 'sent' : 'incoming')
        } else {
          setPhase('active')
        }
        return
      }
      // Load lobby users
      const profiles = await getAllProfiles()
      setUsers(profiles.filter(p => p.id !== user.id))
    }
    init()
  }, [user.id, buildWords])

  // ── Realtime subscription on active duel ─────────────────────
  useEffect(() => {
    if (!duel?.id) return
    const ch = supabase.channel(`duel-${duel.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'duels',
        filter: `id=eq.${duel.id}`
      }, ({ new: d }) => {
        setDuel(d)
        if (d.status === 'active' && phase === 'sent') {
          setWordObjs(buildWords(d.words, d.lang))
          setPhase('active')
        }
        if (d.status === 'done') setPhase('done')
        if (d.status === 'declined') {
          setDuel(null); setPhase('lobby')
          getAllProfiles().then(ps => setUsers(ps.filter(p => p.id !== user.id)))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [duel?.id, phase, buildWords, user.id])

  // ── Challenge a user ─────────────────────────────────────────
  const challenge = async (opponent) => {
    setBusy(true)
    try {
      const ws = [...allWords(lang)].sort(() => Math.random() - 0.5).slice(0, TOTAL)
      const d = await createDuel(
        user.id, opponent.id,
        user.username, opponent.username,
        lang, ws.map(w => w.id)
      )
      setDuel(d)
      setWordObjs(buildWords(d.words, d.lang))
      setPhase('sent')
    } catch(e) { console.error(e) }
    setBusy(false)
  }

  // ── Accept / Decline ─────────────────────────────────────────
  const respond = async (accept) => {
    const d = await respondDuel(duel.id, accept)
    if (accept) { setDuel(d); setPhase('active') }
    else         { setDuel(null); setPhase('lobby')
                   getAllProfiles().then(ps => setUsers(ps.filter(p => p.id !== user.id))) }
  }

  // ── Submit answer ─────────────────────────────────────────────
  const submit = async () => {
    if (!wordObjs[q] || fb) return
    const correct = norm(inp) === norm(wordObjs[q].t)
    setFb(correct ? 'ok' : 'bad')
    const newScore = myScore + (correct ? 1 : 0)
    setMyScore(newScore)
    const done = q + 1 >= TOTAL
    await submitDuelScore(duel.id, isChallenger, newScore, done)
    setTimeout(() => {
      setFb(null); setInp('')
      if (done) setPhase('done')
      else setQ(i => i + 1)
    }, 1000)
  }

  const S = { fontFamily:"'Inter',system-ui,sans-serif", padding:'14px 14px 20px' }

  // ══ DONE ════════════════════════════════════════════════════
  if (phase === 'done' && duel) {
    const myFinalScore  = isChallenger ? duel.ch_score : duel.op_score
    const opFinalScore  = isChallenger ? duel.op_score : duel.ch_score
    const iWon  = duel.winner_id === user.id
    const isTie = !duel.winner_id && duel.ch_done && duel.op_done
    return (
      <div style={S}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.ts, cursor:'pointer',
          fontSize:13, marginBottom:16, padding:0 }}>← უკან</button>
        <div style={{ textAlign:'center', padding:'30px 0' }}>
          <div style={{ fontSize:64, marginBottom:12 }}>
            {isTie ? '🤝' : iWon ? '🏆' : '😔'}
          </div>
          <div style={{ color:C.t, fontWeight:800, fontSize:22, marginBottom:4 }}>
            {isTie ? 'ფრე!' : iWon ? 'გაიმარჯვე!' : 'წააგე!'}
          </div>
          <div style={{ color:C.ts, fontSize:13, marginBottom:24 }}>
            {isTie ? 'ორივე თანაბრად ძლიერი!' : iWon ? `${opName}-ს დაუმარცხე!` : `${opName}-მ გაიმარჯვა`}
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:28 }}>
            {[
              { label:'შენ', score:myFinalScore, isWinner: iWon || (isTie) },
              { label:opName, score:opFinalScore, isWinner: !iWon || (isTie) }
            ].map((p, i) => (
              <div key={i} style={{ background: p.isWinner && !isTie ? `${C.g}22` : C.card2,
                border:`2px solid ${p.isWinner && !isTie ? C.g : C.bdL}`,
                borderRadius:16, padding:'16px 24px', minWidth:100 }}>
                <div style={{ color:C.ts, fontSize:11, marginBottom:4 }}>{p.label}</div>
                <div style={{ color: p.isWinner && !isTie ? C.g : C.t,
                  fontWeight:800, fontSize:32 }}>{p.score}</div>
                <div style={{ color:C.ts, fontSize:10 }}>/ {TOTAL}</div>
              </div>
            ))}
          </div>

          <button onClick={() => { setPhase('lobby'); setDuel(null); setQ(0); setMyScore(0)
            getAllProfiles().then(ps => setUsers(ps.filter(p => p.id !== user.id))) }}
            style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none',
              borderRadius:12, padding:'12px 28px', color:'#fff', fontWeight:700,
              fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            🔄 ახლიდან
          </button>
        </div>
      </div>
    )
  }

  // ══ ACTIVE ══════════════════════════════════════════════════
  if (phase === 'active' && wordObjs.length > 0) {
    const word = wordObjs[Math.min(q, wordObjs.length - 1)]
    return (
      <div style={S}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ color:C.ts, fontSize:12 }}>{lc.flag} {q + 1} / {TOTAL}</div>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ textAlign:'center' }}>
              <div key={myScore} className="score-bounce" style={{ color:C.a, fontWeight:800, fontSize:20 }}>{myScore}</div>
              <div style={{ color:C.ts, fontSize:9 }}>შენ</div>
            </div>
            <div style={{ color:C.bdL, fontSize:20, paddingTop:2 }}>⚔️</div>
            <div style={{ textAlign:'center' }}>
              <div key={`op-${opScore}`} className="score-bounce" style={{ color:C.o, fontWeight:800, fontSize:20 }}>{opScore}</div>
              <div style={{ color:C.ts, fontSize:9 }}>{opName}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:3, background:C.card3, borderRadius:2, marginBottom:20 }}>
          <div style={{ height:'100%', width:`${(q/TOTAL)*100}%`,
            background:`linear-gradient(90deg,${C.a},${C.p})`, borderRadius:2,
            transition:'width .4s' }} />
        </div>

        {/* Word card */}
        <div style={{ background:C.card2, border:`1px solid ${C.bdL}`, borderRadius:20,
          padding:'28px 20px', textAlign:'center', marginBottom:20,
          ...(fb === 'ok'  ? { border:`2px solid ${C.g}`, background:`${C.g}11` } : {}),
          ...(fb === 'bad' ? { border:`2px solid ${C.r}`, background:`${C.r}11` } : {}) }}>
          <div style={{ color:C.ts, fontSize:10, marginBottom:6 }}>
            {word.cat} · {word.ph}
          </div>
          <div style={{ color:C.t, fontWeight:800, fontSize:28, marginBottom:4 }}>{word.w}</div>
          {fb === 'bad' && (
            <div style={{ color:C.g, fontSize:14, marginTop:8 }}>✅ {word.t}</div>
          )}
          {fb === 'ok' && (
            <div style={{ fontSize:24, marginTop:8 }}>🎉</div>
          )}
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:8 }}>
          <input value={inp} onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="ქართული თარგმანი..."
            disabled={!!fb}
            autoComplete="off" autoCorrect="off" spellCheck="false"
            style={{ flex:1, background:C.card3, border:`1px solid ${C.bdL}`,
              borderRadius:12, padding:'13px 14px', color:C.t, fontSize:14,
              outline:'none', fontFamily:'inherit',
              opacity: fb ? 0.5 : 1 }} />
          <button onClick={submit} disabled={!inp.trim() || !!fb}
            style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none',
              borderRadius:12, width:50, cursor:'pointer', fontSize:20,
              opacity: !inp.trim() || !!fb ? 0.4 : 1 }}>➤</button>
        </div>
      </div>
    )
  }

  // ══ SENT (waiting for opponent) ══════════════════════════════
  if (phase === 'sent') return (
    <div className="page-enter" style={S}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.ts,
        cursor:'pointer', fontSize:13, marginBottom:24, padding:0 }}>← უკან</button>
      <div style={{ textAlign:'center', paddingTop:40 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
        <div style={{ color:C.t, fontWeight:700, fontSize:17, marginBottom:8 }}>
          {duel?.opponent_name}-ს ელოდება...
        </div>
        <div style={{ color:C.ts, fontSize:13, marginBottom:32 }}>
          {lc.flag} {TOTAL} სიტყვა · {lang}
        </div>
        <button onClick={() => respondDuel(duel.id, false).then(() => {
          setDuel(null); setPhase('lobby')
          getAllProfiles().then(ps => setUsers(ps.filter(p => p.id !== user.id)))
        })} style={{ background:C.card3, border:`1px solid ${C.bdL}`, borderRadius:12,
          padding:'11px 24px', color:C.ts, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
          გაუქმება
        </button>
      </div>
    </div>
  )

  // ══ INCOMING (I was challenged) ══════════════════════════════
  if (phase === 'incoming') return (
    <div className="page-enter" style={S}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.ts,
        cursor:'pointer', fontSize:13, marginBottom:24, padding:0 }}>← უკან</button>
      <div style={{ textAlign:'center', paddingTop:30 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>⚔️</div>
        <div style={{ color:C.t, fontWeight:800, fontSize:18, marginBottom:8 }}>
          {duel?.challenger_name} გამოგიწვიათ!
        </div>
        <div style={{ color:C.ts, fontSize:13, marginBottom:32 }}>
          {lc.flag} {TOTAL} სიტყვა · ვინ სწრაფია?
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => respond(false)}
            style={{ background:C.card3, border:`1px solid ${C.r}44`, borderRadius:12,
              padding:'12px 24px', color:C.r, cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:14 }}>
            ❌ უარი
          </button>
          <button onClick={() => respond(true)}
            style={{ background:`linear-gradient(135deg,${C.g},#0fa37a)`, border:'none',
              borderRadius:12, padding:'12px 24px', color:'#fff', cursor:'pointer',
              fontFamily:'inherit', fontWeight:700, fontSize:14 }}>
            ⚔️ მიღება
          </button>
        </div>
      </div>
    </div>
  )

  // ══ LOBBY ════════════════════════════════════════════════════
  return (
    <div className="page-enter" style={S}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.ts,
          cursor:'pointer', fontSize:13, padding:0 }}>←</button>
        <div>
          <div style={{ color:C.t, fontWeight:800, fontSize:18 }}>⚔️ დუელი</div>
          <div style={{ color:C.ts, fontSize:11 }}>{lc.flag} {TOTAL} სიტყვა · realtime</div>
        </div>
      </div>

      {users.length === 0 ? (
        <div style={{ textAlign:'center', color:C.ts, paddingTop:60, fontSize:14 }}>
          სხვა მომხმარებელი ჯერ არ არის 😅
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {users.map((u, ui) => (
            <div key={u.id} className="card-rise" style={{ ...gls({ padding:'12px 14px' }), animationDelay:`${ui*50}ms`,
              display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden',
                border:`2px solid ${C.a}`, background:C.card3, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {u.photo_url
                  ? <img src={u.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontWeight:800, color:C.a, fontSize:14 }}>{u.username.slice(0,2).toUpperCase()}</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:C.t, fontWeight:700, fontSize:14 }}>{u.username}</div>
                <div style={{ color:C.ts, fontSize:11 }}>⚡ {u.xp || 0} XP · 🔥 {u.streak || 0}</div>
              </div>
              <button onClick={() => challenge(u)} disabled={busy}
                style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none',
                  borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:700,
                  fontSize:12, cursor:'pointer', fontFamily:'inherit',
                  opacity: busy ? 0.5 : 1 }}>
                ⚔️ გამოიწვიე
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
