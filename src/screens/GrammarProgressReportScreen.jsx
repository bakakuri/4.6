import { useMemo } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'

function calcRecentCount(sessions = [], days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return sessions.filter(session => new Date(session.completed_at || session.started_at || 0).getTime() >= cutoff).length
}

export default function GrammarProgressReportScreen({ lang, analytics, onBack, onOpenRoadmap, onOpenDiagnostics }) {
  const { C, gls } = useTheme()
  const data = analytics || {}
  const recent7 = calcRecentCount(data.sessions || [], 7)
  const recent14 = calcRecentCount(data.sessions || [], 14)
  const weakTop = (data.weakTopics || []).slice(0, 5)
  const strongTop = (data.strongTopics || []).slice(0, 5)

  const report = useMemo(() => {
    const level = data.averageMastery >= 85 ? 'A2/B1 zone' : data.averageMastery >= 65 ? 'A1/A2 zone' : 'foundation mode'
    return {
      headline: `შენ ახლა ${level}-ში ხარ`,
      recommendation: weakTop.length ? `ფოკუსი: ${weakTop[0].topic}` : 'გაგრძელე current path.',
    }
  }, [data.averageMastery, weakTop])

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>📈 Progress Report</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} მოკლე ანგარიში და next step.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="📚" label="საშუალო mastery" value={`${data.averageMastery || 0}%`} C={C} gls={gls} />
        <GrammarMetricCard icon="🎯" label="Accuracy" value={`${data.accuracy || 0}%`} C={C} gls={gls} />
        <GrammarMetricCard icon="🕘" label="7 day sessions" value={recent7} C={C} gls={gls} />
        <GrammarMetricCard icon="🗓️" label="14 day sessions" value={recent14} C={C} gls={gls} />
      </div>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>📝 Summary</h2>
        <div style={{ color: C.ts, lineHeight: 1.8 }}>{report.headline}</div>
        <div style={{ color: C.ts, lineHeight: 1.8, marginTop: 6 }}>{report.recommendation}</div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🔴 Weakest topics</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {weakTop.length === 0 ? <div style={{ color: C.ts }}>Nothing to report yet.</div> : weakTop.map(item => <div key={item.key} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{item.title}</strong><span style={{ color: C.ts }}>{item.mastery}%</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.topicSummary}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🟢 Strongest topics</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {strongTop.length === 0 ? <div style={{ color: C.ts }}>ჯერ ძლიერი თემები არ ჩანს.</div> : strongTop.map(item => <div key={item.key} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ color: C.t }}>{item.title}</strong><span style={{ color: C.ts }}>{item.mastery}%</span></div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.topicSummary}</div></div>)}
        </div>
      </section>

      <section style={gls({ padding: 16 })}>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={onOpenRoadmap} style={{ border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🧭 Open learning path</button>
          <button onClick={onOpenDiagnostics} style={{ border: `1px solid ${C.bdL}`, borderRadius: 12, padding: 13, background: C.card2, color: C.t, fontFamily: 'inherit' }}>🧭 Run new diagnostic</button>
        </div>
      </section>
    </div>
  )
}
