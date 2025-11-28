// Statistics and progress tracking library (localStorage-based)
const STATS_KEY = "fr_stats_db"
const DRAFTS_KEY = "fr_drafts_db"

function initStatsDB() {
  if (!localStorage.getItem(STATS_KEY)) {
    localStorage.setItem(STATS_KEY, JSON.stringify({}))
  }
  if (!localStorage.getItem(DRAFTS_KEY)) {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify({}))
  }
}

function getStats(userId) {
  const allStats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}")
  if (!allStats[userId]) {
    allStats[userId] = {}
  }
  return allStats[userId]
}

function saveStats(userId, stats) {
  const allStats = JSON.parse(localStorage.getItem(STATS_KEY) || "{}")
  allStats[userId] = stats
  localStorage.setItem(STATS_KEY, JSON.stringify(allStats))
}

function recordAttempt(userId, lessonId, type, earnedPoints, totalPoints, timeSpent) {
  const stats = getStats(userId)
  if (!stats[lessonId]) {
    stats[lessonId] = { attempts: [], totalTime: 0 }
  }

  stats[lessonId].attempts.push({
    timestamp: Date.now(),
    lessonId: lessonId,
    type: type,
    score: earnedPoints,
    maxScore: totalPoints,
    percentage: Math.round((earnedPoints / totalPoints) * 100),
    timeTaken: timeSpent,
  })

  stats[lessonId].totalTime += timeSpent
  saveStats(userId, stats)
}

function getAttempts(userId, lessonId) {
  const stats = getStats(userId)
  return stats[lessonId]?.attempts || []
}

function getLessonStats(userId, lessonId) {
  const stats = getStats(userId)
  const lesson = stats[lessonId]
  if (!lesson) return null

  const attempts = lesson.attempts || []
  if (attempts.length === 0) return null

  const bestScore = Math.max(...attempts.map((a) => a.percentage))
  const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
  const totalAttempts = attempts.length

  return {
    bestScore,
    avgScore,
    totalAttempts,
    totalTime: lesson.totalTime,
    lastAttempt: attempts[attempts.length - 1],
  }
}

function getUserProgress(userId) {
  const stats = getStats(userId)
  const lessons = Object.keys(stats)

  let totalAttempts = 0
  let totalScore = 0
  let totalTime = 0
  let completedLessons = 0

  lessons.forEach((lessonId) => {
    const lesson = stats[lessonId]
    if (lesson.attempts && lesson.attempts.length > 0) {
      completedLessons++
      totalAttempts += lesson.attempts.length
      totalScore += lesson.attempts.reduce((sum, a) => sum + a.percentage, 0)
      totalTime += lesson.totalTime || 0
    }
  })

  return {
    completedLessons,
    totalAttempts,
    avgScore: completedLessons > 0 ? Math.round(totalScore / totalAttempts) : 0,
    totalTime,
    lessonStats: stats,
  }
}

function saveDraft(userId, lessonId, formData) {
  const allDrafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
  if (!allDrafts[userId]) {
    allDrafts[userId] = {}
  }

  allDrafts[userId][lessonId] = {
    data: formData,
    savedAt: new Date().toISOString(),
  }

  localStorage.setItem(DRAFTS_KEY, JSON.stringify(allDrafts))
}

function getDraft(userId, lessonId) {
  const allDrafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
  return allDrafts[userId]?.[lessonId] || null
}

function deleteDraft(userId, lessonId) {
  const allDrafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
  if (allDrafts[userId]) {
    delete allDrafts[userId][lessonId]
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(allDrafts))
  }
}

function getAllDrafts(userId) {
  const allDrafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}")
  return allDrafts[userId] || {}
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

window.stats = {
  initStatsDB,
  recordAttempt,
  getAttempts,
  getUserProgress,
  saveDraft,
  getDraft,
  deleteDraft,
  getAllDrafts,
}

initStatsDB()
