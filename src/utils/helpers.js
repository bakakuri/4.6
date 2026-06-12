export const speakWord = (text, langCode) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = langCode
  u.rate = 0.82
  window.speechSynthesis.speak(u)
}

export const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)]
