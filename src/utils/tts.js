// ═══════════════════════════════════════════════════════
// LinguaMaster TTS — Google Translate quality, no API key
// Primary: Google Translate TTS (same voice as translate.google.com)
// Fallback: Web Speech API with best available voice
// ═══════════════════════════════════════════════════════

// Language code maps
const GT_CODE = {
  'de-DE': 'de', 'de': 'de',
  'en-US': 'en', 'en': 'en',
  'ru-RU': 'ru', 'ru': 'ru',
  'es-ES': 'es', 'es': 'es',
  'fr-FR': 'fr', 'fr': 'fr',
}

// Audio cache — avoids re-fetching same word
const _cache = {}
let _speaking = null

// Choose best Web Speech voice for a language code (e.g. 'de-DE')
let _wsVoices = []
const _loadVoices = () => new Promise(resolve => {
  const v = window.speechSynthesis?.getVoices() || []
  if (v.length) { _wsVoices = v; resolve(v); return }
  const handler = () => { _wsVoices = window.speechSynthesis.getVoices(); resolve(_wsVoices) }
  window.speechSynthesis?.addEventListener('voiceschanged', handler, { once: true })
  setTimeout(() => resolve(_wsVoices), 1500) // safety timeout
})

const _bestVoice = (langCode) => {
  const prefix = langCode.slice(0, 2)
  return (
    _wsVoices.find(v => v.lang === langCode && v.name.toLowerCase().includes('google')) ||
    _wsVoices.find(v => v.lang.startsWith(prefix) && v.name.toLowerCase().includes('google')) ||
    _wsVoices.find(v => v.lang === langCode) ||
    _wsVoices.find(v => v.lang.startsWith(prefix)) ||
    null
  )
}

// ── Main speak function ──────────────────────────────────
// langCode: 'de-DE' | 'en-US' | etc.
// slow: boolean — 70% speed for pronunciation practice
export const speak = async (text, langCode = 'de-DE', slow = false) => {
  if (!text) return
  window.speechSynthesis?.cancel()
  if (_speaking) { try { _speaking.pause() } catch {} }

  const gtCode = GT_CODE[langCode] || langCode.slice(0, 2)
  const cacheKey = `${gtCode}:${slow ? 's' : 'n'}:${text}`

  // ── Google Translate TTS (primary, best quality) ─────
  try {
    const speed = slow ? 0.24 : 1
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${gtCode}&q=${encodeURIComponent(text)}&ttsspeed=${speed}`

    let audio = _cache[cacheKey]
    if (!audio) {
      audio = new Audio(url)
      _cache[cacheKey] = audio
    }

    audio.currentTime = 0
    audio.playbackRate = 1
    _speaking = audio

    await audio.play()
    return true
  } catch (_err) {
    // Google TTS blocked or unavailable → fallback
  }

  // ── Web Speech API (fallback) ────────────────────────
  if (!window.speechSynthesis) return false
  await _loadVoices()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang    = langCode
  utter.rate    = slow ? 0.60 : 0.82
  utter.pitch   = 1.0
  utter.volume  = 1.0

  const voice = _bestVoice(langCode)
  if (voice) {
    utter.voice = voice
    utter.lang  = voice.lang
  }

  window.speechSynthesis.speak(utter)
  return true
}

// Preload audio silently (call when word becomes visible)
export const preload = (text, langCode = 'de-DE') => {
  const gtCode = GT_CODE[langCode] || langCode.slice(0, 2)
  const key = `${gtCode}:n:${text}`
  if (!_cache[key]) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${gtCode}&q=${encodeURIComponent(text)}`
    _cache[key] = new Audio(url)
    _cache[key].load() // start buffering
  }
}

// Stop any current audio
export const stopSpeech = () => {
  window.speechSynthesis?.cancel()
  if (_speaking) { try { _speaking.pause(); _speaking.currentTime = 0 } catch {} }
}

// ── TTS Button component (use in JSX) ─────────────────────
// Usage: <TtsButton text={word.w} langCode="de-DE" C={C} />
export const TtsButton = ({ text, langCode, C, size = 13, style = {} }) => {
  // Not a real React component here - use the speak() function directly in buttons
}
