import { useMemo } from 'react'
import { LANG } from '../theme.js'
import { useTheme } from '../lib/ThemeContext.jsx'
import GrammarMetricCard from '../components/grammar/GrammarMetricCard.jsx'
import GrammarTopicCard from '../components/grammar/GrammarTopicCard.jsx'
import { buildGrammarRoadmap, topicSummary } from '../data/grammarInsights.js'

export default function GrammarRoadmapScreen({ lang, categories, progress, onBack, onOpenTopic }) {
  const { C, gls } = useTheme()
  const roadmap = useMemo(() => buildGrammarRoadmap({ categories, progress, lang }), [categories, progress, lang])

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ border: `1px solid ${C.bdL}`, background: C.card3, color: C.ts, borderRadius: 11, padding: '9px 13px', fontFamily: 'inherit' }}>← უკან</button>
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <div style={{ color: C.t, fontWeight: 900, fontSize: 24 }}>🧭 Personal Learning Path</div>
        <div style={{ color: C.ts, fontSize: 13, marginTop: 4 }}>{LANG[lang]?.flag} დალაგებული გზა ძლიერი და სუსტი თემების მიხედვით.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
        <GrammarMetricCard icon="🔴" label="სუსტი თემები" value={roadmap.nextFocus.length} C={C} gls={gls} />
        <GrammarMetricCard icon="🏆" label="დონეები" value={roadmap.byLevel.length} C={C} gls={gls} />
      </div>

      {roadmap.byLevel.map(group => (
        <section key={group.level} style={gls({ padding: 16, marginBottom: 12 })}>
          <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>{group.level}</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {group.topics.map(topic => (
              <GrammarTopicCard
                key={topic.key}
                title={topic.topic}
                subtitle={topic.summary}
                mastery={topic.mastery}
                onClick={() => onOpenTopic(topic.category, topic.topic)}
                C={C}
              />
            ))}
          </div>
        </section>
      ))}

      <section style={gls({ padding: 16 })}>
        <h2 style={{ color: C.t, fontSize: 18, margin: '0 0 10px' }}>🎯 Next focus</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {roadmap.nextFocus.map(item => (
            <GrammarTopicCard
              key={item.key}
              title={item.topic}
              subtitle={topicSummary({ body: item.summary })}
              mastery={item.mastery}
              onClick={() => onOpenTopic(item.category, item.topic)}
              C={C}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
