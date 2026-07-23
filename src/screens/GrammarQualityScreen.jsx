import { useMemo } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import { runGrammarQualityChecks } from '../data/grammarPlanning.js'

export default function GrammarQualityScreen({ lang, categories, onBack, onOpenTopic, onOpenRoadmap }) {
  const { C, gls } = useTheme()
  const quality = useMemo(() => runGrammarQualityChecks({ categories, lang }), [categories, lang])
  const errorCount = quality.issues.filter(item => item.severity === 'error').length
  const warnCount = quality.issues.filter(item => item.severity === 'warn').length

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🧪 Grammar QA</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} production readiness and content checks.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="✅" label="OK" value={quality.ok ? 'PASS' : 'FAIL'} C={C} gls={gls} />
        <GrammarMetricCard icon="❌" label="Errors" value={errorCount} C={C} gls={gls} />
        <GrammarMetricCard icon="⚠️" label="Warnings" value={warnCount} C={C} gls={gls} />
        <GrammarMetricCard icon="📚" label="Topics without exercises" value={quality.topicsWithoutExercises} C={C} gls={gls} />
      </div>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🔍 Checks</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {quality.issues.length === 0 ? <div style={{ color: C.g }}>No issues found. Miracles happen.</div> : quality.issues.map((issue, index) => (
            <div key={`${issue.type}-${index}`} style={{ background: issue.severity === 'error' ? `${C.r}14` : `${C.o}14`, border: `1px solid ${issue.severity === 'error' ? C.r : C.o}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: issue.severity === 'error' ? C.r : C.o }}>{issue.severity.toUpperCase()}</strong>
                <span style={{ color: C.ts, fontSize: 12 }}>{issue.type}</span>
              </div>
              <div style={{ color: C.t, lineHeight: 1.7, marginTop: 6 }}>{issue.message}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🧭 Production checklist</h2>
        <div style={{ display: 'grid', gap: 8, color: C.ts, lineHeight: 1.7 }}>
          <div>• Every topic has content</div>
          <div>• Every exercise has question and answer</div>
          <div>• Multiple choice items include the correct answer in options</div>
          <div>• Sentence builders have tokens</div>
          <div>• Duplicate ids are blocked</div>
        </div>
      </section>

      <section style={gls({ padding: 16 })}>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={onOpenRoadmap} style={{ border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🗺️ Open curriculum</button>
          <button onClick={onOpenTopic ? () => onOpenTopic(categories[0]?.cat, categories[0]?.topics?.[0]?.title) : undefined} style={{ border: `1px solid ${C.bdL}`, borderRadius: 12, padding: 13, background: C.card2, color: C.t, fontFamily: 'inherit' }}>📘 Open first topic</button>
        </div>
      </section>
    </div>
  )
}
