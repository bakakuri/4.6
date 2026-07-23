import { useMemo } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import GrammarTopicCard from '../components/grammar/GrammarTopicCard.jsx'

function calcRecentCount(sessions = [], days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return sessions.filter(session => new Date(session.completed_at || session.started_at || 0).getTime() >= cutoff).length
}

function groupByLevel(topics = []) {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'CORE']
  const map = new Map(order.map(level => [level, []]))
  for (const item of topics) {
    const level = item.level || 'CORE'
    if (!map.has(level)) map.set(level, [])
    map.get(level).push(item)
  }
  return [...map.entries()].filter(([, items]) => items.length > 0).map(([level, items]) => ({ level, items }))
}

function scoreTopic(item) {
  const mastery = item.mastery || 0
  const mistakePenalty = Math.min(25, (item.repeatedMistakeCount || 0) * 4)
  const duePenalty = item.due ? 10 : 0
  return Math.max(0, Math.min(100, Math.round(mastery - mistakePenalty - duePenalty + (item.status === 'mastered' ? 10 : 0))))
}

export default function GrammarProgressReportScreen({ lang, analytics, onBack, onOpenRoadmap, onOpenDiagnostics, onOpenTopic }) {
  const { C, gls } = useTheme()
  const data = analytics || {}
  const recent7 = calcRecentCount(data.sessions || [], 7)
  const recent14 = calcRecentCount(data.sessions || [], 14)
  const learningState = data.learningState || { knows: [], doesNotKnow: [], nextToLearn: [], allTopics: [] }
  const weakTop = (data.weakTopics || []).slice(0, 5)
  const strongTop = (data.strongTopics || []).slice(0, 5)

  const nextLesson = useMemo(() => {
    const dueFirst = learningState.nextToLearn.find(item => item.due)
    return dueFirst || learningState.nextToLearn[0] || weakTop[0] || null
  }, [learningState.nextToLearn, weakTop])

  const masteryBuckets = useMemo(() => groupByLevel(learningState.allTopics || []), [learningState.allTopics])
  const qaChecks = useMemo(() => {
    return [
      { label: 'Topics loaded', ok: (learningState.allTopics || []).length > 0 },
      { label: 'Next lesson available', ok: Boolean(nextLesson) },
      { label: 'Weak topics tracked', ok: weakTop.length >= 0 },
      { label: 'Due queue tracked', ok: (data.dueCount || 0) >= 0 },
      { label: 'Session history available', ok: Array.isArray(data.sessions) },
      { label: 'Mistake history available', ok: Array.isArray(data.mistakes) },
    ]
  }, [learningState.allTopics, nextLesson, weakTop.length, data.dueCount, data.sessions, data.mistakes])

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
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} learning path, mastery, adaptation, curriculum, QA.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="📚" label="Average mastery" value={`${data.averageMastery || 0}%`} C={C} gls={gls} />
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
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🎯 Next lesson</h2>
        {nextLesson ? (
          <div style={{ background: C.card2, borderRadius: 12, padding: 14 }}>
            <div style={{ color: C.ts, fontSize: 12 }}>Why this next?</div>
            <div style={{ color: C.t, fontWeight: 900, fontSize: 20, marginTop: 6 }}>{nextLesson.category} · {nextLesson.title}</div>
            <div style={{ color: C.ts, lineHeight: 1.7, marginTop: 6 }}>{nextLesson.reason}</div>
            <div style={{ color: C.ts, fontSize: 12, marginTop: 6 }}>Mode: {nextLesson.practiceMode} · Level: {nextLesson.level} · Readiness: {scoreTopic(nextLesson)}%</div>
            <button onClick={() => onOpenTopic?.(nextLesson.category, nextLesson.topic || nextLesson.title)} style={{ marginTop: 12, border: 'none', borderRadius: 11, padding: '11px 14px', background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>
              Continue learning
            </button>
          </div>
        ) : <div style={{ color: C.ts }}>No lesson available yet.</div>}
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🟢 You know</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {learningState.knows.length === 0 ? <div style={{ color: C.ts }}>ჯერ ძლიერი თემები არ ჩანს.</div> : learningState.knows.slice(0, 6).map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={`${item.summary}${item.errorPattern ? ` · ${item.errorPattern}` : ''}`} mastery={item.mastery} onClick={() => onOpenTopic?.(item.category, item.topic)} C={C} compact />)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🔴 You do not know yet</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {learningState.doesNotKnow.length === 0 ? <div style={{ color: C.ts }}>Nothing critical yet.</div> : learningState.doesNotKnow.slice(0, 6).map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={`${item.summary}${item.errorPattern ? ` · ${item.errorPattern}` : ''}`} mastery={item.mastery} onClick={() => onOpenTopic?.(item.category, item.topic)} C={C} compact />)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🎯 Next to learn</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {learningState.nextToLearn.length === 0 ? <div style={{ color: C.ts }}>No next topic yet.</div> : learningState.nextToLearn.slice(0, 6).map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={`${item.summary}${item.due ? ' · due now' : ''}`} mastery={item.mastery} onClick={() => onOpenTopic?.(item.category, item.topic)} C={C} compact />)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>📚 Curriculum map</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {masteryBuckets.length === 0 ? <div style={{ color: C.ts }}>No curriculum data yet.</div> : masteryBuckets.map(group => (
            <div key={group.level} style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: C.t }}>{group.level}</strong>
                <span style={{ color: C.ts }}>{group.items.length} topics</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: C.card3, marginTop: 8 }}>
                <div style={{ height: '100%', width: `${Math.round((group.items.filter(item => item.mastery >= 80).length / group.items.length) * 100)}%`, background: C.a }} />
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {group.items.slice(0, 4).map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={item.summary} mastery={item.mastery} onClick={() => onOpenTopic?.(item.category, item.topic)} C={C} compact />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🧠 Adaptive practice</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ background: C.card2, borderRadius: 12, padding: 12, color: C.ts, lineHeight: 1.7 }}>
            Today's mode: <strong style={{ color: C.t }}>{nextLesson?.practiceMode || 'new'}</strong>
            <br />
            Recommended focus: <strong style={{ color: C.t }}>{nextLesson?.topic || 'n/a'}</strong>
          </div>
          {learningState.nextToLearn.slice(0, 3).map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={`${item.summary}${item.due ? ' · due now' : ''}`} mastery={item.mastery} onClick={() => onOpenTopic?.(item.category, item.topic)} C={C} compact />)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🧪 Production QA</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {qaChecks.map(check => (
            <div key={check.label} style={{ background: C.card2, borderRadius: 12, padding: 12, border: `1px solid ${check.ok ? C.g : C.r}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: C.t }}>{check.label}</strong>
                <span style={{ color: check.ok ? C.g : C.r }}>{check.ok ? 'PASS' : 'FAIL'}</span>
              </div>
            </div>
          ))}
        </div>
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