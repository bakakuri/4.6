import { useTheme } from '../../lib/ThemeContext.jsx'

function StatChip({ label, value, tone, C }) {
  return (
    <div style={{ background: `${tone}14`, border: `1px solid ${tone}33`, borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ color: C.ts, fontSize: 10 }}>{label}</div>
      <div style={{ color: tone, fontSize: 18, fontWeight: 900, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function CompactCard({ item, C, onNav }) {
  return (
    <button
      onClick={() => onNav?.(item.type === 'grammar' || item.type === 'grammar-roadmap' ? 'grammar' : 'flashcards')}
      className="tap"
      style={{ width: '100%', textAlign: 'left', borderRadius: 12, padding: 12, border: `1px solid ${C.bdL}`, background: C.card2, color: C.t, fontFamily: 'inherit' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <strong style={{ fontSize: 14 }}>{item.title}</strong>
        <span style={{ color: C.ts, fontSize: 11 }}>{item.mastery}%</span>
      </div>
      <div style={{ color: C.ts, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{item.summary}</div>
    </button>
  )
}

export default function UnifiedLearningPanel({ data, onNav }) {
  const { C, gls } = useTheme()
  const snapshot = data || {}
  const know = snapshot.knows || []
  const weak = snapshot.weaknessItems || []
  const next = snapshot.nextToLearn || []
  const mission = snapshot.todayMission || { title: "Today's mission", progress: 0, items: [] }

  return (
    <section style={gls({ padding: 16, marginBottom: 12 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <div style={{ color: C.t, fontSize: 18, fontWeight: 900 }}>🧠 Unified Learning Intelligence</div>
          <div style={{ color: C.ts, fontSize: 12, marginTop: 4 }}>What you know, what you do not know, what comes next.</div>
        </div>
        <div style={{ color: C.a, fontWeight: 900, fontSize: 18 }}>{snapshot.overallMastery || 0}%</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
        <StatChip label="Vocabulary" value={`${snapshot.vocabularyMastery || 0}%`} tone={C.g} C={C} />
        <StatChip label="Grammar" value={`${snapshot.grammarMastery || 0}%`} tone={C.a} C={C} />
        <StatChip label="Today" value={`${snapshot.dailyProgress || 0}%`} tone={C.gold} C={C} />
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 13 }}>✅ You know</div>
        {know.length === 0 ? <div style={{ color: C.ts, fontSize: 12 }}>ჯერ ცოდნის სიგნალები არ არის.</div> : know.map(item => <CompactCard key={item.key} item={item} C={C} onNav={onNav} />)}
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 13 }}>🔴 Needs attention</div>
        {weak.length === 0 ? <div style={{ color: C.ts, fontSize: 12 }}>სუსტი ადგილები ჯერ არ ჩანს.</div> : weak.slice(0, 3).map(item => <CompactCard key={item.key} item={item} C={C} onNav={onNav} />)}
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
        <div style={{ color: C.t, fontWeight: 800, fontSize: 13 }}>🎯 Next to learn</div>
        {next.length === 0 ? <div style={{ color: C.ts, fontSize: 12 }}>შემდეგი ნაბიჯი ჯერ არ გამოთვლილა.</div> : next.slice(0, 3).map(item => <CompactCard key={item.key} item={item} C={C} onNav={onNav} />)}
      </div>

      <div style={{ background: C.card2, borderRadius: 14, padding: 12, border: `1px solid ${C.bdL}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
          <strong style={{ color: C.t }}>📅 {mission.title}</strong>
          <span style={{ color: C.a, fontWeight: 900 }}>{mission.progress}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: C.card3, marginTop: 8 }}>
          <div style={{ width: `${mission.progress || 0}%`, height: '100%', background: C.a }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
          {mission.items.map(item => (
            <div key={item.label} style={{ background: C.card3, borderRadius: 10, padding: 10 }}>
              <div style={{ color: C.ts, fontSize: 10 }}>{item.label}</div>
              <div style={{ color: C.t, fontWeight: 800, marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 12 }}>
        <button onClick={() => onNav?.('grammar')} style={{ border: 'none', borderRadius: 12, padding: 12, background: C.a, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>Grammar</button>
        <button onClick={() => onNav?.('flashcards')} style={{ border: 'none', borderRadius: 12, padding: 12, background: C.g, color: '#fff', fontWeight: 800, fontFamily: 'inherit' }}>Flashcards</button>
        <button onClick={() => onNav?.('exercises')} style={{ border: 'none', borderRadius: 12, padding: 12, background: C.gold, color: '#111', fontWeight: 800, fontFamily: 'inherit' }}>Practice</button>
      </div>
    </section>
  )
}
