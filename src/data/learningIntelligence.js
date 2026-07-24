import GR from './grammar.js'
import A1 from './grammarA1.js'
import { supabase } from '../lib/supabase.js'
import { buildGrammarAnalytics, buildGrammarRoadmap, topicKey } from './grammarInsights.js'

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

function getGrammarCategories(lang = 'german') {
  const base = GR[lang] || GR.german || []
  return lang === 'german' ? [...A1, ...base] : base
}

function buildProgressMap(lang, rows = []) {
  const map = {}
  for (const row of rows || []) {
    if (!row?.category || !row?.topic) continue
    map[topicKey(lang, row.category, row.topic)] = row
  }
  return map
}

export function buildUnifiedLearningIntelligence({
  lang = 'german',
  stats = {},
  dailyLearned = 0,
  grammarProgress = [],
  grammarMistakes = [],
  grammarSessions = [],
  grammarDue = [],
}) {
  const categories = getGrammarCategories(lang)
  const progress = buildProgressMap(lang, grammarProgress)
  const grammarAnalytics = buildGrammarAnalytics({
    categories,
    progress,
    due: grammarDue,
    sessions: grammarSessions,
    mistakes: grammarMistakes,
    lang,
  })
  const grammarRoadmap = buildGrammarRoadmap({ categories, progress, lang })
  const learningState = grammarAnalytics.learningState || { knows: [], doesNotKnow: [], nextToLearn: [], allTopics: [] }

  const vocabMastery = stats.total ? clamp(Math.round((stats.learned / stats.total) * 100)) : 0
  const grammarMastery = grammarAnalytics.averageMastery || 0
  const overallMastery = clamp(Math.round((vocabMastery * 0.55) + (grammarMastery * 0.45)))
  const dailyGoal = stats.daily_goal || 10
  const dailyProgress = clamp(Math.round((dailyLearned / Math.max(1, dailyGoal)) * 100))

  const vocabularyKnow = stats.learned > 0
    ? {
        key: 'vocab-mastered',
        type: 'vocabulary',
        title: 'Vocabulary',
        mastery: vocabMastery,
        summary: `${stats.learned}/${stats.total} words mastered`,
      }
    : null

  const grammarKnow = grammarAnalytics.strongTopics?.[0]
    ? {
        key: grammarAnalytics.strongTopics[0].key,
        type: 'grammar',
        title: grammarAnalytics.strongTopics[0].topic,
        mastery: grammarAnalytics.strongTopics[0].mastery,
        summary: grammarAnalytics.strongTopics[0].topicSummary,
      }
    : null

  const knows = [
    vocabularyKnow,
    grammarKnow,
    stats.streak > 0 ? {
      key: 'streak',
      type: 'habit',
      title: 'Study streak',
      mastery: clamp(stats.streak * 10),
      summary: `${stats.streak} day streak`,
    } : null,
  ].filter(Boolean)

  const weaknessItems = [
    ...(learningState.doesNotKnow || []).slice(0, 3).map(item => ({
      key: item.key,
      type: 'grammar',
      title: item.topic,
      mastery: item.mastery,
      summary: item.errorPattern ? `${item.summary} · ${item.errorPattern}` : item.summary,
    })),
    stats.inProg > 0 ? {
      key: 'vocab-progress',
      type: 'vocabulary',
      title: 'Vocabulary review',
      mastery: stats.total ? clamp(Math.round((stats.learned / stats.total) * 100)) : 0,
      summary: `${stats.inProg} words still in progress`,
    } : null,
    grammarAnalytics.dueCount > 0 ? {
      key: 'grammar-due',
      type: 'review',
      title: 'Grammar review queue',
      mastery: clamp(100 - Math.min(100, grammarAnalytics.dueCount * 10)),
      summary: `${grammarAnalytics.dueCount} items due now`,
    } : null,
  ].filter(Boolean)

  const nextToLearn = [
    ...(learningState.nextToLearn || []).slice(0, 2).map(item => ({
      key: item.key,
      type: 'grammar',
      title: item.topic,
      mastery: item.mastery,
      summary: item.due ? `${item.summary} · due now` : item.summary,
    })),
    grammarRoadmap.nextFocus?.[0] ? {
      key: grammarRoadmap.nextFocus[0].key,
      type: 'grammar-roadmap',
      title: grammarRoadmap.nextFocus[0].topic,
      mastery: grammarRoadmap.nextFocus[0].mastery,
      summary: `Next roadmap step · ${grammarRoadmap.nextFocus[0].level}`,
    } : null,
    dailyProgress < 100 ? {
      key: 'daily-mission',
      type: 'mission',
      title: 'Daily mission',
      mastery: dailyProgress,
      summary: `${dailyLearned}/${dailyGoal} completed today`,
    } : null,
  ].filter(Boolean)

  const todayMission = {
    title: 'Today\'s mission',
    progress: dailyProgress,
    items: [
      { label: 'Vocabulary', value: `${stats.learned}/${stats.total}` },
      { label: 'Grammar', value: `${grammarMastery}%` },
      { label: 'Due reviews', value: String(grammarAnalytics.dueCount || 0) },
      { label: 'Streak', value: `${stats.streak} days` },
    ],
  }

  const nextLesson = nextToLearn[0] || weaknessItems[0] || knows[0] || null

  return {
    overallMastery,
    vocabularyMastery: vocabMastery,
    grammarMastery,
    dailyProgress,
    knows,
    weaknessItems,
    nextToLearn,
    nextLesson,
    todayMission,
    grammarAnalytics,
    grammarRoadmap,
    learningState,
    categoriesCount: categories.length,
  }
}

export async function loadUnifiedLearningIntelligence({
  userId,
  lang = 'german',
  stats = {},
  dailyLearned = 0,
}) {
  if (!userId) {
    return buildUnifiedLearningIntelligence({ lang, stats, dailyLearned })
  }

  const today = new Date().toISOString().slice(0, 10)
  const [progressRes, mistakesRes, sessionsRes, dueRes] = await Promise.all([
    supabase.from('grammar_progress').select('*').eq('user_id', userId).eq('lang', lang),
    supabase.from('grammar_mistakes').select('*').eq('user_id', userId).eq('lang', lang).order('updated_at', { ascending: false }).limit(50),
    supabase.from('grammar_sessions').select('*').eq('user_id', userId).eq('lang', lang).order('completed_at', { ascending: false }).limit(20),
    supabase.from('grammar_mistakes').select('*').eq('user_id', userId).eq('lang', lang).lte('next_review_at', new Date().toISOString()).order('next_review_at').limit(50),
  ])

  return buildUnifiedLearningIntelligence({
    lang,
    stats,
    dailyLearned,
    grammarProgress: progressRes.data || [],
    grammarMistakes: mistakesRes.data || [],
    grammarSessions: sessionsRes.data || [],
    grammarDue: dueRes.data || [],
  })
}
