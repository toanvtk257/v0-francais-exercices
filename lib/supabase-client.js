// Supabase Client Library for French Learning Platform
// This file provides a unified API for all Supabase operations

// Import Supabase client from CDN
const createClient = window.supabase?.createClient

const SUPABASE_URL = "https://rroensqrqmqxreczqldd.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2Vuc3FycW1xeHJlY3pxbGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NjcwNDMsImV4cCI6MjA2NDQ0MzA0M30.P9wYMSSNt6pQUP33M7X6f3t9rDnDvMzCsMpMBiXlhS0"

let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient && createClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabaseClient
}

// Check if Supabase is available
function isSupabaseAvailable() {
  return typeof createClient !== "undefined" && createClient !== null
}

// =============================================
// Authentication Functions (using our users table with PIN)
// =============================================

async function loginWithEmailAndPin(email, pin) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("pin", pin)
    .eq("status", "approved")
    .single()

  if (error || !data) {
    throw new Error("Email ou PIN incorrect")
  }

  // Store user in localStorage for session persistence
  localStorage.setItem("fr_current_user", JSON.stringify(data))

  return data
}

async function getCurrentUser() {
  // First check localStorage
  const stored = localStorage.getItem("fr_current_user")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      localStorage.removeItem("fr_current_user")
    }
  }
  return null
}

async function logout() {
  localStorage.removeItem("fr_current_user")
  localStorage.removeItem("fr_auth_user")
}

// =============================================
// Users Functions
// =============================================

async function getAllUsers() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("users").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getStudents() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("role", "student")
    .eq("status", "approved")
    .order("name")

  if (error) throw error
  return data || []
}

async function getUserById(userId) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

async function createUser(userData) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("users")
    .insert({
      email: userData.email.toLowerCase().trim(),
      name: userData.name,
      role: userData.role || "student",
      pin: userData.pin,
      filiere: userData.filiere,
      zalo: userData.zalo,
      status: userData.status || "approved",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateUser(userId, updates) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteUser(userId) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("users").delete().eq("id", userId)

  if (error) throw error
}

// =============================================
// Exercises Functions
// =============================================

async function getExercises(type = null) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  let query = client.from("exercises").select("*").order("created_at", { ascending: false })

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function getExerciseById(id) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("exercises").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

async function createExercise(exercise) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  const { data, error } = await client
    .from("exercises")
    .insert({
      id: exercise.id,
      type: exercise.type,
      niveau: exercise.niveau,
      theme: exercise.theme,
      titre: exercise.titre,
      texte: exercise.texte,
      audio: exercise.audio,
      questions: exercise.questions || [],
      created_by: currentUser?.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateExercise(id, updates) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("exercises")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteExercise(id) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("exercises").delete().eq("id", id)

  if (error) throw error
}

// =============================================
// Exercise Attempts Functions
// =============================================

async function saveAttempt(attemptData) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("User not authenticated")

  const { data, error } = await client
    .from("exercise_attempts")
    .insert({
      user_id: currentUser.id,
      exercise_id: attemptData.lessonId,
      score: attemptData.score,
      max_score: attemptData.maxScore,
      percentage: attemptData.percentage,
      time_spent: attemptData.duration || 0,
      answers: attemptData.answers,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function getUserAttempts(userId = null) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  if (!userId) {
    const currentUser = await getCurrentUser()
    userId = currentUser?.id
  }

  if (!userId) return []

  const { data, error } = await client
    .from("exercise_attempts")
    .select("*, exercises(*)")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getAllAttempts() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("exercise_attempts")
    .select("*, users(name, email), exercises(titre, type, niveau)")
    .order("completed_at", { ascending: false })

  if (error) throw error
  return data || []
}

// =============================================
// Messages Functions
// =============================================

async function sendMessage(messageData) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("User not authenticated")

  const { data, error } = await client
    .from("messages")
    .insert({
      sender_id: currentUser.id,
      content: messageData.content,
      recipients: messageData.recipients || [],
      group_id: messageData.groupId,
      is_group_message: messageData.isGroupMessage || false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function getMessages(userId = null) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  if (!userId) {
    const currentUser = await getCurrentUser()
    userId = currentUser?.id
  }

  const { data, error } = await client
    .from("messages")
    .select("*, sender:users!sender_id(name, email, role)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function deleteMessage(messageId) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("messages").delete().eq("id", messageId)

  if (error) throw error
}

// =============================================
// Registration Requests Functions
// =============================================

async function createRegistrationRequest(requestData) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("registration_requests")
    .insert({
      email: requestData.email.toLowerCase().trim(),
      name: requestData.name,
      pin: requestData.pin,
      filiere: requestData.filiere,
      zalo: requestData.zalo,
      explanation: requestData.explanation,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function getPendingRegistrations() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("registration_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getAllRegistrations() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("registration_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function approveRegistration(requestId) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  // Get the registration request
  const { data: request, error: fetchError } = await client
    .from("registration_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError) throw fetchError

  // Create the user account
  const { data: newUser, error: createError } = await client
    .from("users")
    .insert({
      email: request.email,
      name: request.name,
      role: "student",
      pin: request.pin,
      filiere: request.filiere,
      zalo: request.zalo,
      status: "approved",
    })
    .select()
    .single()

  if (createError) throw createError

  // Update the request status
  const { error: updateError } = await client
    .from("registration_requests")
    .update({
      status: "approved",
      processed_at: new Date().toISOString(),
      processed_by: currentUser?.id,
    })
    .eq("id", requestId)

  if (updateError) throw updateError

  return { request, user: newUser }
}

async function rejectRegistration(requestId) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  const { error } = await client
    .from("registration_requests")
    .update({
      status: "rejected",
      processed_at: new Date().toISOString(),
      processed_by: currentUser?.id,
    })
    .eq("id", requestId)

  if (error) throw error
}

// =============================================
// External Resources Functions
// =============================================

async function getResources() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("external_resources").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function createResource(resource) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  const { data, error } = await client
    .from("external_resources")
    .insert({
      titre: resource.titre,
      description: resource.description,
      url: resource.url,
      categorie: resource.categorie,
      created_by: currentUser?.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteResource(id) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("external_resources").delete().eq("id", id)

  if (error) throw error
}

// =============================================
// Statistics Functions
// =============================================

async function getGlobalStats() {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  // Get counts
  const { data: users } = await client.from("users").select("id").eq("role", "student").eq("status", "approved")

  const { data: exercises } = await client.from("exercises").select("id")

  const { data: attempts } = await client.from("exercise_attempts").select("score, max_score, percentage")

  const totalAttempts = attempts?.length || 0
  const avgScore =
    attempts?.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + Number.parseFloat(a.percentage), 0) / attempts.length)
      : 0

  return {
    totalUsers: users?.length || 0,
    totalExercises: exercises?.length || 0,
    totalAttempts,
    averageScore: avgScore,
  }
}

async function getStudentStats(userId) {
  const client = getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data: attempts, error } = await client
    .from("exercise_attempts")
    .select("*, exercises(titre, type, niveau)")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })

  if (error) throw error

  const totalAttempts = attempts?.length || 0
  const avgScore =
    attempts?.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + Number.parseFloat(a.percentage), 0) / attempts.length)
      : 0

  // Group by level
  const byLevel = {}
  attempts?.forEach((a) => {
    const level = a.exercises?.niveau || "Unknown"
    if (!byLevel[level]) {
      byLevel[level] = { attempts: 0, totalScore: 0 }
    }
    byLevel[level].attempts++
    byLevel[level].totalScore += Number.parseFloat(a.percentage)
  })

  Object.keys(byLevel).forEach((level) => {
    byLevel[level].avgScore = Math.round(byLevel[level].totalScore / byLevel[level].attempts)
  })

  return {
    totalAttempts,
    averageScore: avgScore,
    byLevel,
    recentAttempts: attempts?.slice(0, 10) || [],
  }
}

// =============================================
// Export for use in HTML files
// =============================================

window.SupabaseDB = {
  // Client
  getClient: getSupabaseClient,
  isAvailable: isSupabaseAvailable,

  // Auth
  login: loginWithEmailAndPin,
  logout: logout,
  getCurrentUser: getCurrentUser,

  // Users
  getAllUsers: getAllUsers,
  getStudents: getStudents,
  getUserById: getUserById,
  createUser: createUser,
  updateUser: updateUser,
  deleteUser: deleteUser,

  // Exercises
  getExercises: getExercises,
  getExerciseById: getExerciseById,
  createExercise: createExercise,
  updateExercise: updateExercise,
  deleteExercise: deleteExercise,

  // Attempts
  saveAttempt: saveAttempt,
  getUserAttempts: getUserAttempts,
  getAllAttempts: getAllAttempts,

  // Messages
  sendMessage: sendMessage,
  getMessages: getMessages,
  deleteMessage: deleteMessage,

  // Registration
  createRegistrationRequest: createRegistrationRequest,
  getPendingRegistrations: getPendingRegistrations,
  getAllRegistrations: getAllRegistrations,
  approveRegistration: approveRegistration,
  rejectRegistration: rejectRegistration,

  // Resources
  getResources: getResources,
  createResource: createResource,
  deleteResource: deleteResource,

  // Stats
  getGlobalStats: getGlobalStats,
  getStudentStats: getStudentStats,
}

console.log("[Supabase] Client library loaded successfully")
