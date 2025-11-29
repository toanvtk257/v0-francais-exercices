// Supabase Client Library for French Learning Platform
// This file provides a unified API for all Supabase operations

console.log("[v0] Supabase library available:", typeof window.supabase)

let supabaseClient = null

async function waitForConfig() {
  // Wait for config to be loaded (max 5 seconds)
  for (let i = 0; i < 50; i++) {
    if (window.APP_CONFIG?.loaded) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  console.error("[v0] Timeout waiting for config to load")
  return false
}

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  // Check if Supabase CDN is loaded
  if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
    console.error("[v0] Supabase CDN not loaded. Make sure to include the CDN script.")
    return null
  }

  const configReady = await waitForConfig()
  if (!configReady) {
    console.error("[v0] Config not ready")
    return null
  }

  // Get config from APP_CONFIG
  const config = window.APP_CONFIG?.supabase

  console.log("[v0] Initializing Supabase client", {
    hasConfig: !!config,
    hasUrl: !!config?.url,
    hasKey: !!config?.anonKey,
    urlPreview: config?.url?.substring(0, 40) + "...",
    keyPreview: config?.anonKey?.substring(0, 20) + "...",
  })

  if (!config || !config.url || !config.anonKey) {
    console.error("[v0] Missing Supabase configuration. Make sure lib/config.js is loaded.")
    return null
  }

  try {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey)
    console.log("[v0] Supabase client created successfully")
    return supabaseClient
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    return null
  }
}

// Check if Supabase is available
function isSupabaseAvailable() {
  return typeof window.supabase !== "undefined" && window.supabase.createClient !== undefined
}

// =============================================
// Authentication Functions (using our users table with PIN)
// =============================================

async function loginWithEmailAndPin(email, pin) {
  console.log("[v0] Login attempt:", { email, pinLength: pin?.length })

  const client = await getSupabaseClient()
  if (!client) {
    console.error("[v0] Supabase client not available")
    throw new Error("Base de données non disponible")
  }

  console.log("[v0] Querying users table...")

  const { data: allMatches, error: searchError } = await client
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())

  console.log("[v0] All matches for email:", { count: allMatches?.length, matches: allMatches, searchError })

  const rejectedUser = allMatches?.find((u) => u.status === "rejected" && u.pin === pin)
  if (rejectedUser) {
    throw new Error("REJECTED_REGISTRATION")
  }

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("pin", pin)
    .eq("status", "approved")

  console.log("[v0] Query result:", {
    hasData: !!data,
    dataLength: data?.length,
    error: error?.message || error,
    fullError: error,
  })

  const user = Array.isArray(data) ? data[0] : data

  if (error || !user) {
    console.error("[v0] Login failed:", { error, data, user })
    throw new Error("Email ou PIN incorrect")
  }

  // Store user in localStorage for session persistence
  localStorage.setItem("fr_current_user", JSON.stringify(user))
  console.log("[v0] User logged in successfully:", user.email)

  return user
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("users").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getStudents() {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

async function createUser(userData) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("users").delete().eq("id", userId)

  if (error) throw error
}

async function createAdminAccount(adminData) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  console.log("[v0] Creating admin account:", { email: adminData.email, name: adminData.name })

  const { data, error } = await client
    .from("users")
    .insert({
      email: adminData.email.toLowerCase().trim(),
      name: adminData.name,
      role: "admin",
      pin: adminData.pin,
      status: "approved",
      filiere: null,
      zalo: null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating admin account:", error)
    throw error
  }

  console.log("[v0] Admin account created successfully:", data.email)
  return data
}

// =============================================
// Exercises Functions
// =============================================

async function getExercises(type = null) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("exercises").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

async function createExercise(exercise) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  const { data, error } = await client
    .from("exercises")
    .insert({
      titre: exercise.titre || exercise.title,
      type: exercise.type,
      niveau: exercise.niveau || exercise.level,
      theme: exercise.theme,
      texte: exercise.texte || exercise.text_content,
      audio: exercise.audio || exercise.audio_url,
      questions: exercise.questions || [],
      created_by: currentUser?.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function saveExercise(exercise) {
  return createExercise(exercise)
}

async function updateExercise(id, updates) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("exercises").delete().eq("id", id)

  if (error) throw error
}

// =============================================
// Exercise Attempts Functions
// =============================================

async function saveAttempt(attemptData) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("messages").delete().eq("id", messageId)

  if (error) throw error
}

// =============================================
// Registration Requests Functions
// =============================================

async function checkEmailExists(email) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const normalizedEmail = email.toLowerCase().trim()

  // Check in registration_requests table
  const { data: requests, error: reqError } = await client
    .from("registration_requests")
    .select("id, status")
    .eq("email", normalizedEmail)

  if (reqError) throw reqError

  // Check in users table
  const { data: users, error: userError } = await client.from("users").select("id, status").eq("email", normalizedEmail)

  if (userError) throw userError

  return {
    existsInRequests: requests && requests.length > 0,
    existsInUsers: users && users.length > 0,
    requestStatus: requests?.[0]?.status,
    userStatus: users?.[0]?.status,
  }
}

async function createRegistrationRequest(requestData) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("registration_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function approveRegistration(requestId) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  console.log("[v0] getResources: Starting to fetch external resources...")
  const client = await getSupabaseClient()
  if (!client) {
    console.error("[v0] getResources: Supabase client not available")
    throw new Error("Supabase not available")
  }

  console.log("[v0] getResources: Querying external_resources table...")
  const { data, error } = await client.from("external_resources").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] getResources: Error fetching resources:", error)
    throw error
  }

  console.log("[v0] getResources: Successfully fetched resources:", data?.length || 0, "items")
  return data || []
}

async function createResource(resource) {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { error } = await client.from("external_resources").delete().eq("id", id)

  if (error) throw error
}

// =============================================
// Statistics Functions
// =============================================

async function getGlobalStats() {
  const client = await getSupabaseClient()
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
  const client = await getSupabaseClient()
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
  createAdminAccount: createAdminAccount, // Export new admin creation function

  // Exercises
  getExercises: getExercises,
  getExerciseById: getExerciseById,
  createExercise: createExercise,
  saveExercise: saveExercise,
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
  checkEmailExists: checkEmailExists, // Export new function
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
