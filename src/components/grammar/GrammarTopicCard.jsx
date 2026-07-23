export default function GrammarTopicCard({ title, subtitle, mastery = 0, onClick, C, compact = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: compact ? 12 : 14,
        borderRadius: 12,
        border: `1px solid ${C.bdL}`,
        background: C.card2,
        color: C.t,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <strong>{title}</strong>
        <span style={{ color: C.a, fontSize: 12 }}>{mastery}%</span>
      </div>
      {subtitle ? <div style={{ color: C.ts, fontSize: 12, marginTop: 5, lineHeight: 1.6 }}>{subtitle}</div> : null}
    </button>
  )
}
