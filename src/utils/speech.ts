export const speak = (text: string, enabled = true) => {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.82
  utterance.pitch = 1.08
  window.speechSynthesis.speak(utterance)
  return true
}

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}
