import { useMemo } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import GrammarTopicCard from '../components/grammar/GrammarTopicCard.jsx'
import { buildGrammarRoadmap } from '../data/grammarInsights.js'

export default function GrammarPracticeModesScreen({ lang, categories, progress, due, onBack, onOpenTopic, onStartReview }) {
  const { C, gls } = useTheme()
  const roadmap = useMemo(() => buildGrammarRoadmap({ categories, progress, lang }), [categories, progress, lang])
  const weakSet = roadmap.nextFocus.slice(0, 5)
  const mastered = roadmap.recommendedTopics.filter(item => item.mastery >= 80).slice(0, 5)

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🎛️ Practice Modes</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} აირჩიე რეჟიმი, რომელიც დღეს რეალურად გჭირდება.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="🔁" label="Due reviews" value={due.length} C={C} gls={gls} />
        <GrammarMetricCard icon="⚡" label="Weak picks" value={weakSet.length} C={C} gls={gls} />
      </div>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🎯 Quick practice</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {weakSet.map(item => (
            <GrammarTopicCard
              key={item.key}
              title={item.topic}
              subtitle={item.summary}
              mastery={item.mastery}
              onClick={() => onOpenTopic(item.category, item.topic)}
              C={C}
            />
          ))}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🔥 Weakness practice</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {weakSet.length === 0 ? <div style={{ color: C.ts }}>Weak topics არ გვაქვს. ეჭვიანად სუფთაა ყველაფერი.</div> : weakSet.map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={item.summary} mastery={item.mastery} onClick={() => onOpenTopic(item.category, item.topic)} C={C} />)}
        </div>
      </section>

      <section style={gls({ padding: 16, marginBottom: 12 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🏆 Mastery challenge</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {mastered.length === 0 ? <div style={{ color: C.ts }}>ჯერ mastery challenge-ისთვის საკმარისი დონე არ არის.</div> : mastered.map(item => <GrammarTopicCard key={item.key} title={item.topic} subtitle={item.summary} mastery={item.mastery} onClick={() => onOpenTopic(item.category, item.topic)} C={C} />)}
        </div>
      </section>

      <section style={gls({ padding: 16 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🧾 Review queue</h2>
        <button onClick={onStartReview} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>
          დაიწყე SRS Review ({due.length})
        </button>
      </section>
    </div>
  )
}
