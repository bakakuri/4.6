import { Component } from 'react'

export default class GrammarErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[GrammarErrorBoundary]', error, info)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (!this.state.hasError) return this.props.children

    const C = this.props.C || {}
    return (
      <section style={{ padding: 18, borderRadius: 14, background: C.card3 || '#171b2e', color: C.t || '#fff' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
        <h3 style={{ margin: '0 0 8px' }}>სავარჯიშო ვერ ჩაიტვირთა</h3>
        <p style={{ color: C.ts || '#aaa', lineHeight: 1.6, margin: 0 }}>
          ამ კონკრეტულ სავარჯიშოში ტექნიკური შეცდომა მოხდა. მთელი Grammar გვერდი აღარ უნდა გათეთრდეს.
        </p>
        <button onClick={this.reset} style={{ marginTop: 14, border: 'none', borderRadius: 10, padding: '11px 15px', background: C.a || '#6366f1', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
          🔄 თავიდან ცდა
        </button>
      </section>
    )
  }
}
