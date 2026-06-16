import { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext.jsx'
import { LANG } from '../theme.js'
import { getCustomWords, addCustomWord, deleteCustomWord } from '../utils/db.js'

export default function CustomWordsScreen({ user, lang, onBack }) {
  const { C, gls } = useTheme()
  const lc = LANG[lang]
  const [words,  setWords]  = useState([])
  const [loading,setLoading]= useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState({ word:'', translation:'', phonetic:'', example:'' })
  const [error,  setError]  = useState('')

  useEffect(() => {
    getCustomWords(user.id, lang).then(w => { setWords(w); setLoading(false) })
  }, [user.id, lang])

  const save = async () => {
    if (!form.word.trim() || !form.translation.trim()) {
      setError('სიტყვა და თარგმანი სავალდებულოა'); return
    }
    setSaving(true); setError('')
    try {
      const w = await addCustomWord(user.id, lang, form.word.trim(), form.translation.trim(), form.phonetic.trim(), form.example.trim())
      setWords(prev => [w, ...prev])
      setForm({ word:'', translation:'', phonetic:'', example:'' })
      setAdding(false)
    } catch { setError('შეცდომა') }
    setSaving(false)
  }

  const del = async (id) => {
    await deleteCustomWord(id)
    setWords(prev => prev.filter(w => w.id !== id))
  }

  const Field = ({ label, field, placeholder }) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ color:C.ts, fontSize:11, marginBottom:4 }}>{label}</div>
      <input value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
        placeholder={placeholder} autoComplete="off"
        style={{ width:'100%', boxSizing:'border-box', background:C.card3,
          border:'1px solid '+C.bdL, borderRadius:10, padding:'10px 12px',
          color:C.t, fontSize:14, outline:'none', fontFamily:'inherit' }}/>
    </div>
  )

  return (
    <div className="page-enter" style={{ padding:'14px 14px 20px', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.ts, cursor:'pointer', fontSize:20, padding:0 }}>
          <span>←</span>
        </button>
        <div>
          <div style={{ color:C.t, fontWeight:800, fontSize:18 }}>📝 Custom სიტყვები</div>
          <div style={{ color:C.ts, fontSize:11 }}>{lc.flag} {lc.name} · {words.length} სიტყვა</div>
        </div>
      </div>

      {!adding && (
        <button onClick={()=>setAdding(true)} className="tap"
          style={{ width:'100%', background:'linear-gradient(135deg,'+C.a+','+C.p+')',
            border:'none', borderRadius:14, padding:'14px 0', color:'#fff',
            fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', marginBottom:16 }}>
          + ახალი სიტყვა
        </button>
      )}

      {adding && (
        <div style={{ ...gls({ padding:16 }), marginBottom:16 }}>
          <div style={{ color:C.t, fontWeight:700, fontSize:14, marginBottom:12 }}>✏️ ახალი სიტყვა</div>
          <Field label={'სიტყვა '+lc.flag+' *'} field="word"        placeholder="მაგ: der Hund" />
          <Field label="ქართული *"              field="translation" placeholder="მაგ: ძაღლი" />
          <Field label="IPA (არჩ.)"             field="phonetic"    placeholder="მაგ: /hʊnt/" />
          <Field label="მაგალითი (არჩ.)"        field="example"     placeholder="მაგ: Der Hund ist groß." />
          {error && <div style={{ color:C.r, fontSize:12, marginBottom:8 }}>{error}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>{setAdding(false);setError('');setForm({word:'',translation:'',phonetic:'',example:''})}}
              style={{ flex:1, background:C.card3, border:'1px solid '+C.bdL, borderRadius:10,
                padding:'11px 0', color:C.ts, cursor:'pointer', fontFamily:'inherit' }}>
              გაუქმება
            </button>
            <button onClick={save} disabled={saving}
              style={{ flex:2, background:'linear-gradient(135deg,'+C.a+','+C.p+')', border:'none',
                borderRadius:10, padding:'11px 0', color:'#fff', fontWeight:700,
                cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1 }}>
              {saving ? '...' : 'შენახვა'}
            </button>
          </div>
        </div>
      )}

      {loading
        ? <div style={{ textAlign:'center', color:C.ts, paddingTop:40 }}>იტვირთება...</div>
        : words.length === 0 && !adding
        ? <div style={{ textAlign:'center', paddingTop:50 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
            <div style={{ color:C.ts }}>ჯერ სიტყვა არ გაქვს</div>
            <div style={{ color:C.tm, fontSize:12, marginTop:4 }}>შენი საკუთარი სიტყვები ფლეშქარდებში გამოჩნდება</div>
          </div>
        : words.map(w => (
            <div key={w.id} className="card-rise"
              style={{ ...gls({ padding:'12px 14px' }), marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:6, alignItems:'baseline', flexWrap:'wrap', marginBottom:2 }}>
                    <span style={{ color:C.t, fontWeight:700, fontSize:15 }}>{w.word}</span>
                    {w.phonetic && <span style={{ color:C.ts, fontSize:11 }}>{w.phonetic}</span>}
                  </div>
                  <div style={{ color:C.a, fontSize:13, fontWeight:600 }}>{w.translation}</div>
                  {w.example && <div style={{ color:C.ts, fontSize:11, marginTop:3, fontStyle:'italic' }}>{w.example}</div>}
                </div>
                <button onClick={()=>del(w.id)}
                  style={{ background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)',
                    borderRadius:8, padding:'5px 9px', color:C.r, fontSize:13,
                    cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                  ✕
                </button>
              </div>
            </div>
          ))
      }

      {words.length > 0 && (
        <div style={{ textAlign:'center', color:C.ts, fontSize:11, marginTop:16 }}>
          Custom სიტყვები ფლეშქარდებში და ვარჯიშში ავტომატურად ჩანს
        </div>
      )}
    </div>
  )
}
