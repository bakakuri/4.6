import { useMemo } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import GrammarTopicCard from '../components/grammar/GrammarTopicCard.jsx'
import { buildCurriculumMap, buildMasteryProfile, buildNextLesson } from '../data/grammarPlanning.js'

export default function GrammarCurriculumScreen({ lang, categories, progress, due, mistakes, onBack, onOpenTopic, onOpenReview, onOpenDiagnostics }) {
  const { C, gls } = useTheme()
  const curriculum = useMemo(() => buildCurriculumMap({ categories, progress, lang }), [categories, progress, lang])
  const mastery = useMemo(() => buildMasteryProfile({ categories, progress, due, mistakes, lang }), [categories, progress, due, mistakes, lang])
  const nextLesson = useMemo(() => buildNextLesson({ categories, progress, due, mistakes, lang }), [categories, progress, due, mistakes, lang])

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>

      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🗺️ Learning Path 2.0</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} from diagnostic to mastery, topic by topic.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="🎯" label="Overall readiness" value={`${mastery.overall}%`} C={C} gls={gls} />
        <GrammarMetricCard icon="🔁" label="Due reviews" value={due.length} C={C} gls={gls} />
        <GrammarMetricCard icon="⚡" label="Weak topics" value={curriculum.allTopics.filter(item => item.mastery < 50).length} C={C} gls={gls} />
        <GrammarMetricCard icon="🏁" label="Unlocked levels" value={curriculum.levels.filter(level => level.unlocked).length} C={C} gls={gls} />
      </div>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 12px' }}>🎯 Next lesson</h2>
        <div style={{ background: C.card2, borderRadius: 12, padding: 14 }}>
          <div style={{ color: C.ts, fontSize: 12 }}>Why this next?</div>
          <div style={{ color: C.t, fontWeight: 900, fontSize: 20, marginTop: 6 }}>{nextLesson.category} · {nextLesson.title}</div>
          <div style={{ color: C.ts, lineHeight: 1.7, marginTop: 6 }}>{nextLesson.reason}</div>
          <div style={{ color: C.ts, fontSize: 12, marginTop: 6 }}>Mode: {nextLesson.practiceMode} · Level: {nextLesson.level}</div>
          <button onClick={() => onOpenTopic(nextLesson.category, nextLesson.title)} style={{ marginTop: 12, border: 'none', borderRadius: 11, padding: '11px 14px', background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>
            Continue learning
          </button>
        </div>
      </section>

      {curriculum.levels.map(level => (
        <section key={level.level} style={gls({ padding: 16, marginBottom: 12 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
            <h2 style={{ color: C.t, fontSize: 18, margin: 0 }}>{level.level}</h2>
            <span style={{ color: level.unlocked ? C.g : C.ts }}>{level.unlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
          <div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>Progress: {level.progress}% · {level.completed}/{level.total}</div>
          <div style={{ height: 8, background: C.card3, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${level.progress}%`, height: '100%', background: level.unlocked ? C.g : C.o, borderRadius: 99 }} />
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {level.topics.length === 0 ? <div style={{ color: C.ts }}>No topics here yet.</div> : level.topics.map(topic => (
              <GrammarTopicCard
                key={topic.key}
                title={topic.topic}
                subtitle={`${topic.summary}${topic.due ? ' · due now' : ''}`}
                mastery={topic.mastery}
                onClick={() => onOpenTopic(topic.category, topic.topic)}
                C={C}
                compact
              />
            ))}
          </div>
        </section>
      ))}

      <section style={gls({ padding: 16 })}>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={onOpenReview} style={{ border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>🔁 Start review</button>
          <button onClick={onOpenDiagnostics} style={{ border: `1px solid ${C.bdL}`, borderRadius: 12, padding: 13, background: C.card2, color: C.t, fontFamily: 'inherit' }}>🧭 Run diagnostic</button>
        </div>
      </section>
    </div>
  )
}
