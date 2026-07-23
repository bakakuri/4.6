import { useMemo, useState } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import { GRAMMAR_COMPARISONS, GRAMMAR_REFERENCE, buildGrammarChallenges, buildGrammarMilestones } from '../data/grammarAdvanced.js'

function barWidth(value) {
  return `${Math.max(8, Math.min(100, value || 0))}%`
}

function Card({ children, C, gls }) {
  return <section style={gls({ padding: 16, marginBottom: 12 })}>{children}</section>
}

export default function GrammarAnalyticsScreen({ lang, analytics, onBack, onOpenDiagnostic, onOpenMistakes, onOpenReview, onOpenRoadmap, onOpenPractice, onOpenReport }) {
  const { C, gls } = useTheme()
  const data = analytics || {}
  const categories = useMemo(() => data.categoryLevels || [], [data.categoryLevels])
  const weakTopics = useMemo(() => (data.weakTopics || []).slice(0, 5), [data.weakTopics])
  const strongTopics = useMemo(() => (data.strongTopics || []).slice(0, 5), [data.strongTopics])
  const sessions = data.sessions || []
  const dueCount = data.dueCount || 0
  const totalTopics = data.totalTopics || 0
  const mastered = data.mastered || 0
  const averageMastery = data.averageMastery || 0
  const accuracy = data.accuracy || 0
  const mistakes = data.mistakes || []
  const recentSession = sessions[0]
  const challenges = buildGrammarChallenges({ accuracy, dueCount, mastered, averageMastery })
  const milestones = buildGrammarMilestones({ mastered, totalTopics, accuracy, sessions })
  const [comparisonId, setComparisonId] = useState(GRAMMAR_COMPARISONS[0]?.id || 'nom-akk')
  const currentComparison = GRAMMAR_COMPARISONS.find(item => item.id === comparisonId) || GRAMMAR_COMPARISONS[0]

  return (
    <div style={{ padding: 16, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>📊 Grammar Analytics</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} პროგრესის სურათი, სუსტი წერტილები და next steps.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="📚" label="თემები" value={totalTopics} C={C} gls={gls} />
        <GrammarMetricCard icon="🏆" label="ათვისებული" value={mastered} C={C} gls={gls} />
        <GrammarMetricCard icon="📈" label="საშ. Mastery" value={`${averageMastery}%`} C={C} gls={gls} />
        <GrammarMetricCard icon="🎯" label="Accuracy" value={`${accuracy}%`} C={C} gls={gls} />
      </div>

      <Card C={C} gls={gls}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: C.ts }}>
          <span>🔁 Due reviews</span>
          <strong style={{ color: C.a }}>{dueCount}</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
          <button onClick={onOpenReview} style={{ border: 'none', borderRadius: 11, padding: '10px 14px', background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🔁 Start review</button>
          <button onClick={onOpenMistakes} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: '10px 14px', background: C.card2, color: C.t, fontFamily: 'inherit' }}>❌ Mistake bank</button>
          <button onClick={onOpenDiagnostic} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: '10px 14px', background: C.card2, color: C.t, fontFamily: 'inherit' }}>🧭 New diagnostic</button>
          <button onClick={onOpenRoadmap} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: '10px 14px', background: C.card2, color: C.t, fontFamily: 'inherit' }}>🧭 Learning path</button>
          <button onClick={onOpenPractice} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: '10px 14px', background: C.card2, color: C.t, fontFamily: 'inherit' }}>🎛️ Practice modes</button>
          <button onClick={onOpenReport} style={{ border: `1px solid ${C.bdL}`, borderRadius: 11, padding: '10px 14px', background: C.card2, color: C.t, fontFamily: 'inherit' }}>📈 Progress report</button>
        </div>
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>⚖️ Comparison mode</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {GRAMMAR_COMPARISONS.map(item => <button key={item.id} onClick={() => setComparisonId(item.id)} style={{ borderRadius: 99, padding: '8px 12px', border: `1px solid ${comparisonId === item.id ? C.a : C.bdL}`, background: comparisonId === item.id ? `${C.a}18` : C.card3, color: comparisonId === item.id ? C.a : C.ts, fontFamily: 'inherit' }}>{item.title}</button>)}
        </div>
        {currentComparison && <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
            <div style={{ color: C.ts, fontSize: 12 }}>Left side</div>
            <div style={{ color: C.t, lineHeight: 1.7, marginTop: 4 }}>{currentComparison.left}</div>
          </div>
          <div style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
            <div style={{ color: C.ts, fontSize: 12 }}>Right side</div>
            <div style={{ color: C.t, lineHeight: 1.7, marginTop: 4 }}>{currentComparison.right}</div>
          </div>
          <div style={{ color: C.ts, lineHeight: 1.7 }}>{currentComparison.note}</div>
        </div>}
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>📖 Reference library</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {GRAMMAR_REFERENCE.map(section => (
            <div key={section.id} style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
              <div style={{ color: C.t, fontWeight: 800 }}>{section.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {section.items.map(item => <span key={item} style={{ padding: '6px 9px', borderRadius: 99, background: C.card3, color: C.ts, fontSize: 12 }}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>🎯 Challenges</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {challenges.map(item => (
            <div key={item.id} style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: C.t }}>{item.title}</strong>
                <span style={{ color: C.ts }}>{item.reward}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: C.card3, marginTop: 8 }}>
                <div style={{ height: '100%', width: barWidth((item.progress / item.total) * 100), background: item.progress >= item.total ? C.g : C.a }} />
              </div>
              <div style={{ color: C.ts, fontSize: 12, marginTop: 6 }}>{item.progress}/{item.total}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>🏅 Achievements & milestones</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {milestones.map(item => (
            <div key={item.id} style={{ background: C.card2, borderRadius: 12, padding: 12, border: `1px solid ${item.achieved ? C.g : C.bdL}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: C.t }}>{item.title}</strong>
                <span style={{ color: item.achieved ? C.g : C.ts }}>{item.achieved ? 'Unlocked' : 'Locked'}</span>
              </div>
              <div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>📌 Weak topics</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {weakTopics.length === 0 ? <div style={{ color: C.ts }}>ყველაფერი სუფთაა. იშვიათი, საეჭვო სილამაზეა.</div> : weakTopics.map(item => (
            <div key={item.key} style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: C.t }}>{item.title}</strong>
                <span style={{ color: C.ts }}>{item.mastery}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: C.card3, marginTop: 8 }}>
                <div style={{ height: '100%', width: barWidth(item.mastery), background: item.mastery >= 80 ? C.g : item.mastery >= 50 ? C.o : C.r }} />
              </div>
              <div style={{ color: C.ts, fontSize: 12, marginTop: 6 }}>{item.topicSummary}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>📚 Level mastery</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {categories.map(item => (
            <div key={item.name} style={{ background: C.card2, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong style={{ color: C.t }}>{item.name}</strong>
                <span style={{ color: C.ts }}>{item.mastery}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: C.card3, marginTop: 8 }}>
                <div style={{ height: '100%', width: barWidth(item.mastery), background: item.mastery >= 80 ? C.g : item.mastery >= 50 ? C.o : C.r }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>🕘 Recent grammar sessions</h2>
        {sessions.length === 0 ? <div style={{ color: C.ts }}>ჯერ არ გაქვს session ისტორია.</div> : <div style={{ display: 'grid', gap: 8 }}>{sessions.map(session => <div key={session.id} style={{ background: C.card2, borderRadius: 12, padding: 12, color: C.ts }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ color: C.t }}>{session.topic}</strong><span>{session.score ?? 0}%</span></div><div style={{ fontSize: 12, marginTop: 4 }}>Duration: {session.duration_sec ?? 0}s</div></div>)}</div>}
      </Card>

      <Card C={C} gls={gls}>
        <h2 style={{ color: C.t, fontSize: 17, margin: '0 0 12px' }}>❌ Recent mistakes</h2>
        {mistakes.length === 0 ? <div style={{ color: C.ts }}>შეცდომები არ არის. ან უბრალოდ ჯერ ვერ დავიჭირეთ.</div> : <div style={{ display: 'grid', gap: 8 }}>{mistakes.slice(0, 5).map(item => <div key={item.id} style={{ background: C.card2, borderRadius: 12, padding: 12 }}><div style={{ color: C.t, fontWeight: 800 }}>{item.topic}</div><div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>{item.question}</div></div>)}</div>}
      </Card>

      {recentSession && <div style={{ color: C.ts, fontSize: 12, marginTop: 12 }}>ბოლო diagnostic score: {recentSession.score ?? 0}%</div>}
    </div>
  )
}
