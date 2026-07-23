export default function GrammarMetricCard({ icon, label, value, hint, C, gls }) {
  return (
    <div style={gls({ padding: 14 })}>
      <div style={{ color: C.ts, fontSize: 12 }}>{icon} {label}</div>
      <div style={{ color: C.t, fontSize: 23, fontWeight: 900, marginTop: 6 }}>{value}</div>
      {hint ? <div style={{ color: C.ts, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{hint}</div> : null}
    </div>
  )
}
