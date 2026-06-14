

import { useTheme } from '../lib/ThemeContext.jsx'
import { useState, useEffect, useCallback, useRef } from 'react'
import { LANG } from '../theme.js'
import { allWords } from '../data/words.js'
import { rnd, speakWord } from '../utils/helpers.js'
import { recordCorrect, recordAnswer, awardXP } from '../utils/db.js'
import { XP_REWARD } from '../utils/gamification.js'

// ── Shared style helpers ─────────────────────────────────────
const mkBtn = (C, extra={}) => ({
  background: C.card3, border:`1px solid ${C.bdL}`, borderRadius:8,
  padding:'5px 10px', color:C.ts, fontSize:12, cursor:'pointer', fontFamily:'inherit', ...extra
})
const mkCheck = (C, disabled) => ({
  width:'100%', padding:'13px 0', background: `linear-gradient(135deg,${C.a},${C.p})`,
  border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700,
  cursor:'pointer', opacity: disabled ? .4 : 1, fontFamily:'inherit'
})
const mkInput = (C, ok) => ({
  width:'100%', borderRadius:12, padding:'14px 16px', color:C.t, fontSize:16,
  outline:'none', boxSizing:'border-box', marginBottom:12, fontFamily:'inherit',
  background: ok===true ? `${C.g}22` : ok===false ? `${C.r}22` : C.card3,
  border: `1px solid ${ok===true ? C.g : ok===false ? C.r : C.bdL}`,
})

// ═══════════════════════════════════════════════════════════
// 1. Multiple Choice
// ═══════════════════════════════════════════════════════════
function MultiChoice({ user, lang, onExit }) {
  const { C, gls } = useTheme()
  const ws = allWords(lang)
  const [q,opts,sel,score,total,next,pick] = useMulti(ws, user, lang)
  if (!q) return null
  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:20, marginBottom:16 }), textAlign:'center', background:`linear-gradient(135deg,${C.card2},${C.card3})` }}>
        <div style={{ color:C.ts, fontSize:12, marginBottom:8 }}>{LANG[lang].flag} {q.ph}</div>
        <div style={{ color:C.t, fontWeight:900, fontSize:28, marginBottom:8 }}>{q.w}</div>
        <div style={{ color:C.ts, fontSize:13, fontStyle:'italic' }}>"{q.ex}"</div>
        <button onClick={() => speakWord(q.w, LANG[lang].code)} style={{ marginTop:10, background:`${C.a}22`, border:'none', borderRadius:8, padding:'6px 14px', color:C.a, fontSize:13, cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>🔊 ხმა</button>
      </div>
      <div style={{ color:C.ts, fontSize:13, marginBottom:10, textAlign:'center' }}>📌 აირჩიე სწორი თარგმანი</div>
      {opts.map((opt, i) => {
        const isCorrect = opt === q.t
        const isWrong   = sel && opt === sel && !isCorrect
        return (
          <button key={i} onClick={() => pick(opt)} style={{ width:'100%', padding:'14px 16px', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:8, textAlign:'left', fontFamily:'inherit',
            background: sel ? (isCorrect ? `${C.g}22` : isWrong ? `${C.r}22` : C.card2) : C.card2,
            border: sel ? (isCorrect ? `1px solid ${C.g}66` : isWrong ? `1px solid ${C.r}66` : `1px solid ${C.bdL}`) : `1px solid ${C.bdL}`,
            color: sel ? (isCorrect ? C.g : isWrong ? C.r : C.t) : C.t }}>
            {sel && isCorrect ? '✅ ' : sel && isWrong ? '❌ ' : ''}{opt}
          </button>
        )
      })}
    </div>
  )
}
function useMulti(ws, user, lang) {
  const [q,setQ]=useState(null); const [opts,setOpts]=useState([]); const [sel,setSel]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0)
  const next=useCallback(()=>{const w=rnd(ws);const wrong=ws.filter(x=>x.id!==w.id).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.t);setQ(w);setOpts([w.t,...wrong].sort(()=>Math.random()-.5));setSel(null)},[ws])
  useEffect(()=>{next()},[])
  const pick=(opt)=>{if(sel)return;setSel(opt);recordAnswer(user.id);if(opt===q.t){setScore(s=>s+1);recordCorrect(user.id);awardXP(user.id,XP_REWARD.multi)}setTotal(v=>v+1);setTimeout(next,1200)}
  return [q,opts,sel,score,total,next,pick]
}

// ═══════════════════════════════════════════════════════════
// 2. Fill in the Blank
// ═══════════════════════════════════════════════════════════
function FillBlank({ user, lang, onExit }) {
  const { C, gls } = useTheme()
  const ws=allWords(lang); const [q,setQ]=useState(null); const [inp,setInp]=useState(''); const [res,setRes]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0)
  const next=useCallback(()=>{setQ(rnd(ws));setInp('');setRes(null)},[ws])
  useEffect(()=>{next()},[])
  const check=()=>{if(!inp.trim()||res!==null)return;const ok=inp.trim().toLowerCase()===q.w.toLowerCase();setRes(ok);setTotal(v=>v+1);recordAnswer(user.id);if(ok){setScore(s=>s+1);recordCorrect(user.id);awardXP(user.id,XP_REWARD.fill)}setTimeout(next,1600)}
  if(!q)return null
  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:20, marginBottom:16 }), background:C.card2 }}>
        <div style={{ color:C.ts, fontSize:12, marginBottom:10, textAlign:'center' }}>✍️ ჩაწერე ქართული თარგმანიდან</div>
        <div style={{ color:C.gold, fontSize:24, fontWeight:900, textAlign:'center', marginBottom:10 }}>{q.t}</div>
        <div style={{ color:C.ts, fontSize:13, textAlign:'center', fontStyle:'italic' }}>"{q.ext}"</div>
      </div>
      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} placeholder={`${LANG[lang].name}-ად ჩაწერე...`} disabled={res!==null} style={mkInput(C,res)} />
      {res!==null&&<div style={{ textAlign:'center', fontSize:15, fontWeight:700, color:res?C.g:C.r, marginBottom:8 }}>{res?'✅ სწორია!':`❌ სწორი: ${q.w}`}</div>}
      <button onClick={check} disabled={res!==null||!inp.trim()} style={mkCheck(C,res!==null||!inp.trim())}>შემოწმება ✓</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 3. Memory Match
// ═══════════════════════════════════════════════════════════
function MemoryGame({ lang, onExit }) {
  const { C } = useTheme()
  const ws=allWords(lang).sort(()=>Math.random()-.5).slice(0,6)
  const [cards]=useState(()=>[...ws.map((w,i)=>({id:`w${i}`,word:w.w,pair:w.id})),...ws.map((w,i)=>({id:`t${i}`,word:w.t,pair:w.id}))].sort(()=>Math.random()-.5))
  const [open,setOpen]=useState([]); const [matched,setMatched]=useState([]); const [moves,setMoves]=useState(0)
  const flip=card=>{if(open.length===2||matched.includes(card.pair)||open.some(c=>c.id===card.id))return;const nO=[...open,card];setOpen(nO);if(nO.length===2){setMoves(m=>m+1);if(nO[0].pair===nO[1].pair){setMatched(m=>[...m,nO[0].pair]);setOpen([])}else setTimeout(()=>setOpen([]),1000)}}
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ color:C.ts, fontSize:13 }}>ნაბიჯი: {moves} · {matched.length}/{ws.length} ✅</span>
        <button onClick={onExit} style={mkBtn(C)}>გასვლა</button>
      </div>
      {matched.length===ws.length&&<div style={{ textAlign:'center', padding:'16px 0', fontSize:20, color:C.g, fontWeight:800 }}>🎉 გამარჯვება! {moves} ნაბიჯი</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {cards.map(card=>{const isOpen=open.some(c=>c.id===card.id)||matched.includes(card.pair);return(
          <button key={card.id} onClick={()=>flip(card)} style={{ height:70, borderRadius:12, cursor:'pointer', fontWeight:700, transition:'all .3s', fontFamily:'inherit', padding:4, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', lineHeight:1.3,
            background:isOpen?(matched.includes(card.pair)?`${C.g}22`:C.card3):C.card2,
            border:`1px solid ${isOpen?(matched.includes(card.pair)?C.g:C.a):C.bdL}`,
            color:isOpen?C.t:C.bg, fontSize:isOpen?12:20 }}>{isOpen?card.word:'?'}</button>
        )})}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 4. Word Scramble
// ═══════════════════════════════════════════════════════════
function Scramble({ user, lang, onExit }) {
  const { C, gls } = useTheme()
  const ws=allWords(lang); const [q,setQ]=useState(null); const [letters,setLetters]=useState([]); const [ans,setAns]=useState([]); const [res,setRes]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0)
  const next=useCallback(()=>{const w=rnd(ws);setQ(w);setLetters([...w.w.toUpperCase()].map((l,i)=>({l,i,used:false})).sort(()=>Math.random()-.5));setAns([]);setRes(null)},[ws])
  useEffect(()=>{next()},[])
  const add=idx=>{if(letters[idx].used)return;setLetters(p=>p.map((lt,i)=>i===idx?{...lt,used:true}:lt));setAns(a=>[...a,{l:letters[idx].l,fi:idx}])}
  const rem=()=>{if(!ans.length)return;const last=ans[ans.length-1];setLetters(p=>p.map((lt,i)=>i===last.fi?{...lt,used:false}:lt));setAns(a=>a.slice(0,-1))}
  const check=()=>{if(!ans.length||res!==null)return;const ok=ans.map(a=>a.l).join('')===q.w.toUpperCase();setRes(ok);setTotal(v=>v+1);recordAnswer(user.id);if(ok){setScore(s=>s+1);recordCorrect(user.id);awardXP(user.id,XP_REWARD.scramble)}setTimeout(next,1500)}
  if(!q)return null
  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:20, marginBottom:16 }), textAlign:'center' }}>
        <div style={{ color:C.ts, fontSize:12, marginBottom:6 }}>🧩 დაალაგე ასოები</div>
        <div style={{ color:C.gold, fontSize:22, fontWeight:700, marginBottom:4 }}>{q.t}</div>
        <div style={{ color:C.ts, fontSize:12, fontStyle:'italic' }}>"{q.ext}"</div>
      </div>
      <div style={{ minHeight:50, background:C.card3, borderRadius:12, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', border:`1px solid ${res===true?C.g:res===false?C.r:C.bdL}` }}>
        {!ans.length&&<span style={{ color:C.tm, fontSize:13 }}>ასოები გამოჩნდება აქ...</span>}
        {ans.map((a,i)=><span key={i} style={{ background:C.card4, borderRadius:6, width:30, height:34, display:'inline-flex', alignItems:'center', justifyContent:'center', color:C.t, fontWeight:700, fontSize:16 }}>{a.l}</span>)}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12, justifyContent:'center' }}>
        {letters.map((lt,i)=><button key={i} onClick={()=>add(i)} disabled={lt.used} style={{ width:38, height:40, background:lt.used?C.card3:C.card2, border:`1px solid ${C.bdL}`, borderRadius:8, color:lt.used?C.tm:C.t, fontWeight:700, fontSize:16, cursor:lt.used?'default':'pointer', fontFamily:'inherit' }}>{lt.l}</button>)}
      </div>
      {res!==null&&<div style={{ textAlign:'center', fontSize:15, fontWeight:700, color:res?C.g:C.r, marginBottom:8 }}>{res?'✅ სწორია!':`❌ სწორი: ${q.w}`}</div>}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={rem} style={{ flex:1, ...mkBtn(C,{ padding:'11px 0', fontSize:14 }) }}>⌫ წაშლა</button>
        <button onClick={check} disabled={!ans.length||res!==null} style={{ flex:2, ...mkCheck(C,!ans.length||res!==null), padding:'11px 0' }}>შემოწმება ✓</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 5. Listening
// ═══════════════════════════════════════════════════════════
function Listening({ user, lang, onExit }) {
  const { C, gls } = useTheme()
  const ws=allWords(lang); const lc=LANG[lang]; const [q,setQ]=useState(null); const [inp,setInp]=useState(''); const [res,setRes]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0)
  const next=useCallback(()=>{const w=rnd(ws);setQ(w);setInp('');setRes(null)},[ws])
  useEffect(()=>{next()},[])
  useEffect(()=>{if(q)speakWord(q.w,lc.code)},[q])
  const check=()=>{if(!inp.trim()||res!==null)return;const ok=inp.trim().toLowerCase()===q.w.toLowerCase();setRes(ok);setTotal(v=>v+1);recordAnswer(user.id);if(ok){setScore(s=>s+1);recordCorrect(user.id);awardXP(user.id,XP_REWARD.fill)}setTimeout(next,1600)}
  if(!q)return null
  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:24, marginBottom:16 }), textAlign:'center' }}>
        <div style={{ color:C.ts, fontSize:13, marginBottom:16 }}>🎧 მოუსმინე და ჩაწერე</div>
        <button onClick={()=>speakWord(q.w,lc.code)} style={{ background:`linear-gradient(135deg,${C.a},${C.p})`, border:'none', borderRadius:16, padding:'18px 32px', color:'#fff', fontSize:32, cursor:'pointer', boxShadow:`0 4px 20px ${C.aG}`, fontFamily:'inherit' }}>🔊</button>
        <div style={{ color:C.ts, fontSize:12, marginTop:12 }}>დააჭირე სასმენლად</div>
      </div>
      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} placeholder="ჩაწერე გაგონილი სიტყვა..." disabled={res!==null} style={mkInput(C,res)} />
      {res!==null&&<div style={{ textAlign:'center', fontSize:15, fontWeight:700, color:res?C.g:C.r, marginBottom:8 }}>{res?'✅ სწორია!':`❌ სწორი: ${q.w} (${q.t})`}</div>}
      <button onClick={check} disabled={res!==null||!inp.trim()} style={mkCheck(C,res!==null||!inp.trim())}>შემოწმება ✓</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 6. 🎤 Speech Recognition
// ═══════════════════════════════════════════════════════════
function SpeechEx({ user, lang, onExit }) {
  const { C, gls } = useTheme()
  const ws=allWords(lang); const lc=LANG[lang]
  const [q,setQ]=useState(null); const [listening,setListening]=useState(false); const [transcript,setTranscript]=useState(''); const [res,setRes]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0)
  const recRef=useRef(null)
  const supported = !!(window.SpeechRecognition||window.webkitSpeechRecognition)

  const next=useCallback(()=>{setQ(rnd(ws));setTranscript('');setRes(null);setListening(false)},[ws])
  useEffect(()=>{next()},[])
  useEffect(()=>{if(q)speakWord(q.w,lc.code)},[q])

  const startListen=()=>{
    if(!supported||listening)return
    const Rec=window.SpeechRecognition||window.webkitSpeechRecognition
    const rec=new Rec(); rec.lang=lc.code; rec.continuous=false; rec.interimResults=false
    recRef.current=rec
    rec.onstart=()=>setListening(true)
    rec.onresult=e=>{
      const said=e.results[0][0].transcript.toLowerCase().trim()
      setTranscript(said)
      setListening(false)
      // normalize: remove articles for comparison (der/die/das handling)
      const norm=s=>s.replace(/^(der|die|das|ein|eine)\s+/i,'').toLowerCase().trim()
      const ok=norm(said)===norm(q.w)
      setRes(ok); setTotal(v=>v+1); recordAnswer(user.id)
      if(ok){setScore(s=>s+1);recordCorrect(user.id)}
    }
    rec.onerror=()=>setListening(false)
    rec.onend=()=>setListening(false)
    rec.start()
  }

  const stopListen=()=>{recRef.current?.stop();setListening(false)}

  if(!supported) return (
    <div>
      <Row C={C} score={0} total={0} onExit={onExit} />
      <div style={{ textAlign:'center', padding:'40px 20px', color:C.ts }}>
        <div style={{ fontSize:40, marginBottom:12 }}>😔</div>
        <div>შენი ბრაუზერი მეტყველების ამოცნობას არ უჭერს მხარს</div>
        <div style={{ fontSize:12, marginTop:8 }}>Chrome ან Edge გამოიყენე</div>
      </div>
    </div>
  )

  if(!q)return null
  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:20, marginBottom:16 }), textAlign:'center', background:`linear-gradient(135deg,${C.card2},${C.card3})` }}>
        <div style={{ color:C.ts, fontSize:12, marginBottom:6 }}>{lc.flag} ნახე და წაიკითხე ხმამაღლა</div>
        <div style={{ color:C.t, fontWeight:900, fontSize:30, marginBottom:6 }}>{q.w}</div>
        <div style={{ color:C.a, fontSize:14, marginBottom:8 }}>{q.ph}</div>
        <div style={{ color:C.gold, fontSize:18, fontWeight:700, marginBottom:8 }}>{q.t}</div>
        <div style={{ color:C.ts, fontSize:12, fontStyle:'italic' }}>"{q.ex}"</div>
        <button onClick={()=>speakWord(q.w,lc.code)} style={{ marginTop:10, background:`${C.a}22`, border:'none', borderRadius:8, padding:'6px 14px', color:C.a, fontSize:13, cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>🔊 მოუსმინე</button>
      </div>

      {/* Mic button */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={listening ? stopListen : startListen}
          style={{ width:80, height:80, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:32, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s',
            background: listening ? `${C.r}33` : `linear-gradient(135deg,${C.a},${C.p})`,
            boxShadow: listening ? `0 0 0 8px ${C.r}22,0 0 0 16px ${C.r}11` : `0 4px 20px ${C.aG}`,
            animation: listening ? 'pulse 1s infinite' : 'none'
          }}>
          {listening ? '⏹' : '🎤'}
        </button>
        <div style={{ color: listening ? C.r : C.ts, fontSize:14, fontWeight: listening ? 700 : 400 }}>
          {listening ? '🔴 ისმენს...' : 'დააჭირე და წაიკითხე'}
        </div>
      </div>

      {/* Result */}
      {transcript && (
        <div style={{ ...gls({ padding:14 }), marginBottom:12, textAlign:'center' }}>
          <div style={{ color:C.ts, fontSize:12, marginBottom:4 }}>შენ თქვი:</div>
          <div style={{ color:C.t, fontSize:16, fontWeight:700 }}>"{transcript}"</div>
        </div>
      )}
      {res!==null && (
        <div style={{ textAlign:'center', fontSize:18, fontWeight:800, color:res?C.g:C.r, marginBottom:12 }}>
          {res ? '✅ ბრავო! სწორად წაიკითხე!' : `❌ სცადე ისევ → ${q.w}`}
        </div>
      )}
      {res!==null && (
        <button onClick={next} style={mkCheck(C,false)}>შემდეგი სიტყვა →</button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 7. 📝 Sentence Translation
// ═══════════════════════════════════════════════════════════
function SentenceEx({ user, lang, onExit }) {
  const { C, gls } = useTheme()
  const lc=LANG[lang]
  // Only words with example sentences
  const ws=allWords(lang).filter(w=>w.ex&&w.ext&&w.ex.length>5)
  const [q,setQ]=useState(null); const [inp,setInp]=useState(''); const [res,setRes]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0); const [hint,setHint]=useState(false)

  const next=useCallback(()=>{setQ(rnd(ws));setInp('');setRes(null);setHint(false)},[ws])
  useEffect(()=>{next()},[])

  const check=()=>{
    if(!inp.trim()||res!==null)return
    // flexible comparison: ignore case, punctuation
    const norm=s=>s.toLowerCase().replace(/[.!?,¿¡]/g,'').trim()
    const ok=norm(inp)===norm(q.ex)
    // partial credit: if 70%+ words match
    const inpWords=norm(inp).split(' ').filter(Boolean)
    const exWords=norm(q.ex).split(' ').filter(Boolean)
    const matches=inpWords.filter(w=>exWords.includes(w)).length
    const partial=matches/exWords.length>=0.7
    const accepted=ok||partial
    setRes(accepted); setTotal(v=>v+1); recordAnswer(user.id)
    if(accepted){setScore(s=>s+1);recordCorrect(user.id);awardXP(user.id,XP_REWARD.sentence)}
  }

  if(!q)return null
  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:20, marginBottom:16 }), background:C.card2 }}>
        <div style={{ color:C.ts, fontSize:12, marginBottom:10, textAlign:'center' }}>📝 ქართულიდან {lc.name}-ად თარგმნე</div>
        <div style={{ color:C.gold, fontSize:18, fontWeight:700, textAlign:'center', marginBottom:10, lineHeight:1.4 }}>"{q.ext}"</div>
        {hint && (
          <div style={{ borderTop:`1px solid ${C.bdL}`, paddingTop:10, marginTop:10 }}>
            <div style={{ color:C.ts, fontSize:12, marginBottom:4 }}>💡 სიტყვა:</div>
            <div style={{ color:C.a, fontSize:14, fontWeight:700 }}>{q.w} = {q.t}</div>
          </div>
        )}
      </div>
      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()}
        placeholder={`${lc.name}-ად ჩაწერე...`} disabled={res!==null} style={mkInput(C,res)} />
      {res!==null && (
        <div style={{ ...gls({ padding:14 }), marginBottom:12, background: res?`${C.g}0d`:`${C.r}0d` }}>
          <div style={{ fontSize:15, fontWeight:800, color:res?C.g:C.r, marginBottom:6 }}>{res?'✅ სწორია!':'❌ სწორი პასუხი:'}</div>
          <div style={{ color:C.t, fontSize:14 }}>"{q.ex}"</div>
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        {!hint&&!res&&<button onClick={()=>setHint(true)} style={{ flex:1, ...mkBtn(C,{ padding:'13px 0', fontSize:14 }) }}>💡 მინიშნება</button>}
        <button onClick={check} disabled={res!==null||!inp.trim()} style={{ flex:2, ...mkCheck(C,res!==null||!inp.trim()) }}>შემოწმება ✓</button>
      </div>
      {res!==null&&<button onClick={next} style={{ ...mkCheck(C,false), marginTop:8 }}>შემდეგი →</button>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 8. 🇩🇪 German Gender (der/die/das)
// ═══════════════════════════════════════════════════════════
const getGender=w=>{if(w.startsWith('die '))return'die';if(w.startsWith('der '))return'der';if(w.startsWith('das '))return'das';return null}
const stripArticle=w=>w.replace(/^(die|der|das)\s+/,'')

function GenderEx({ user, onExit }) {
  const { C, gls } = useTheme()
  const ws=allWords('german').filter(w=>getGender(w.w))
  const [q,setQ]=useState(null); const [sel,setSel]=useState(null); const [score,setScore]=useState(0); const [total,setTotal]=useState(0)
  const next=useCallback(()=>{setQ(rnd(ws));setSel(null)},[ws])
  useEffect(()=>{next()},[])

  const pick=art=>{
    if(sel)return; setSel(art); recordAnswer(user.id)
    if(art===getGender(q.w)){setScore(s=>s+1);recordCorrect(user.id);awardXP(user.id,XP_REWARD.gender)}
    setTotal(v=>v+1); setTimeout(next,1400)
  }

  if(!q)return null
  const correct=getGender(q.w)
  const GENDERS=[{a:'der',col:'#3d9bff',label:'Maskulinum'},{a:'die',col:'#ff4f6b',label:'Femininum'},{a:'das',col:'#11c490',label:'Neutrum'}]

  return (
    <div>
      <Row C={C} score={score} total={total} onExit={onExit} />
      <div style={{ ...gls({ padding:24, marginBottom:20 }), textAlign:'center' }}>
        <div style={{ color:C.ts, fontSize:12, marginBottom:12 }}>🇩🇪 სწორი სქესი (Artikel) აირჩიე</div>
        <div style={{ color:C.t, fontWeight:900, fontSize:32, marginBottom:6 }}>{stripArticle(q.w)}</div>
        <div style={{ color:C.gold, fontSize:18, fontWeight:700, marginBottom:6 }}>{q.t}</div>
        <div style={{ color:C.a, fontSize:13 }}>{q.ph}</div>
        <button onClick={()=>speakWord(q.w,'de-DE')} style={{ marginTop:10, background:`${C.a}22`, border:'none', borderRadius:8, padding:'6px 14px', color:C.a, fontSize:13, cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>🔊 ხმა</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {GENDERS.map(g=>{
          const isC=g.a===correct; const isW=sel&&g.a===sel&&!isC
          return(
            <button key={g.a} onClick={()=>pick(g.a)}
              style={{ padding:'20px 8px', borderRadius:14, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all .2s',
                background: sel?(isC?`${g.col}33`:isW?`${C.r}22`:C.card2):C.card2,
                border: sel?(isC?`2px solid ${g.col}`:isW?`2px solid ${C.r}`:`1px solid ${C.bdL}`):`1px solid ${C.bdL}`,
                transform: sel&&isC?'scale(1.05)':'scale(1)' }}>
              <span style={{ fontSize:24, fontWeight:900, color:sel?(isC?g.col:isW?C.r:C.t):C.t }}>{g.a}</span>
              <span style={{ fontSize:10, color:C.ts }}>{g.label}</span>
              {sel&&isC&&<span style={{ fontSize:16 }}>✅</span>}
              {sel&&isW&&<span style={{ fontSize:16 }}>❌</span>}
            </button>
          )
        })}
      </div>
      {sel&&<div style={{ textAlign:'center', marginTop:14, color:C.ts, fontSize:13 }}>
        სწორი: <strong style={{ color:GENDERS.find(g=>g.a===correct)?.col }}>{correct} {stripArticle(q.w)}</strong>
      </div>}
    </div>
  )
}

// ── Shared Row component ──────────────────────────────────────
function Row({ C, score, total, onExit }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
      <span style={{ color:C.ts, fontSize:13 }}>სწორი: {score}/{total}</span>
      <button onClick={onExit} style={mkBtn(C)}>გასვლა</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Main ExercisesScreen
// ═══════════════════════════════════════════════════════════
export default function ExercisesScreen({ user, lang }) {
  const { C } = useTheme()
  const [type, setType] = useState(null)
  const isGerman = lang === 'german'

  const EXERCISES = [
    { id:'multi',   icon:'📝', label:'მრავლობითი',     sub:'4 ვარიანტიდან სწორი',    col:C.a    },
    { id:'fill',    icon:'✍️', label:'შეავსე ველი',    sub:'სიტყვის ჩაწერა',         col:C.g    },
    { id:'memory',  icon:'🧠', label:'მეხსიერება',      sub:'წყვილების დაკავშირება',   col:C.p    },
    { id:'scramble',icon:'🔀', label:'სიტყვის ასოები', sub:'ასოების თანმიმდ.',        col:C.gold },
    { id:'listen',  icon:'🎧', label:'მოსმენა',         sub:'მოუსმინე და ჩაწერე',      col:C.o    },
    { id:'speech',  icon:'🎤', label:'მეტყველება',      sub:'ხმამაღლა წაიკითხე',       col:'#e040fb' },
    { id:'sentence',icon:'📄', label:'წინ. თარგ.',     sub:'ქართ. → სხვა ენა',        col:'#00bcd4' },
    ...(isGerman ? [{ id:'gender', icon:'🇩🇪', label:'der/die/das',  sub:'გერმ. სქესის ვარჯ.',  col:C.b }] : []),
  ]

  if (type) {
    const exit = () => setType(null)
    return (
      <div style={{ padding:16, fontFamily:"'Inter',system-ui,sans-serif" }}>
        {type==='multi'   &&<MultiChoice user={user} lang={lang} onExit={exit}/>}
        {type==='fill'    &&<FillBlank   user={user} lang={lang} onExit={exit}/>}
        {type==='memory'  &&<MemoryGame              lang={lang} onExit={exit}/>}
        {type==='scramble'&&<Scramble    user={user} lang={lang} onExit={exit}/>}
        {type==='listen'  &&<Listening   user={user} lang={lang} onExit={exit}/>}
        {type==='speech'  &&<SpeechEx    user={user} lang={lang} onExit={exit}/>}
        {type==='sentence'&&<SentenceEx  user={user} lang={lang} onExit={exit}/>}
        {type==='gender'  &&<GenderEx    user={user}             onExit={exit}/>}
      </div>
    )
  }

  return (
    <div style={{ padding:16, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ color:C.t, fontWeight:800, fontSize:22 }}>🎮 სავარჯიშოები</div>
        <div style={{ color:C.ts, fontSize:13, marginTop:4 }}>{LANG[lang]?.flag} {LANG[lang]?.name} · {EXERCISES.length} ტიპი</div>
      </div>
      {EXERCISES.map(ex=>(
        <button key={ex.id} onClick={()=>setType(ex.id)}
          style={{ width:'100%', textAlign:'left', padding:18, background:`linear-gradient(135deg,${C.card2},${C.card3})`, border:`1px solid ${C.bdL}`, borderRadius:16, marginBottom:10, cursor:'pointer', display:'flex', alignItems:'center', gap:14, fontFamily:'inherit' }}>
          <span style={{ fontSize:28, background:`${ex.col}22`, borderRadius:12, width:50, height:50, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ex.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ color:C.t, fontWeight:700, fontSize:16 }}>{ex.label}</div>
            <div style={{ color:C.ts, fontSize:13, marginTop:3 }}>{ex.sub}</div>
          </div>
          <span style={{ color:ex.col, fontSize:20 }}>›</span>
        </button>
      ))}
    </div>
  )
}
