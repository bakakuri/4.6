export const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

export function getNextReviewDate(intervalDays = 1) {
  const date = new Date()
  date.setDate(date.getDate() + intervalDays)
  return date.toISOString()
}

export function getNextInterval(reviewCount = 0, isCorrect = false) {
  if (!isCorrect) return 1
  return REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)]
}

export function getReviewStatus(nextReviewAt) {
  if (!nextReviewAt) return 'new'
  return new Date(nextReviewAt) <= new Date() ? 'due' : 'scheduled'
}
