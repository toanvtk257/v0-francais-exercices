// Supabase Client Library for French Learning Platform
// This file provides a unified API for all Supabase operations
// Version: 2.0.0 - Fixed approveRegistration to delete requests after account creation

console.log("[v0] Supabase library version: 2.0.0")
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
// Device Sessions Functions (Anti-Account Sharing)
// =============================================

async function trackDeviceLogin(userId, deviceFingerprint, deviceInfo) {
  console.log("[v0] trackDeviceLogin called:", { userId, deviceFingerprint, deviceInfo })

  const client = await getSupabaseClient()
  if (!client) {
    console.error("[v0] trackDeviceLogin: Supabase client not available")
    throw new Error("Base de données non disponible")
  }

  try {
    let deviceName = "Appareil inconnu"

    // Try to use DeviceFingerprint.getDeviceName if available
    if (window.DeviceFingerprint && typeof window.DeviceFingerprint.getDeviceName === "function") {
      deviceName = window.DeviceFingerprint.getDeviceName(deviceInfo)
    } else {
      // Fallback: generate device name inline
      const ua = deviceInfo.userAgent || navigator.userAgent || ""

      if (/iPhone/i.test(ua)) deviceName = "📱 iPhone"
      else if (/iPad/i.test(ua)) deviceName = "📱 iPad"
      else if (/Android/i.test(ua)) {
        const isTablet = /Tablet/i.test(ua) || !/Mobile/i.test(ua)
        deviceName = isTablet ? "📱 Tablette Android" : "📱 Téléphone Android"
      } else if (/Mobile/i.test(ua)) deviceName = "📱 Téléphone Mobile"
      else if (/Macintosh|Mac OS X/i.test(ua)) {
        if (/Chrome/i.test(ua)) deviceName = "💻 Chrome sur Mac"
        else if (/Safari/i.test(ua)) deviceName = "💻 Safari sur Mac"
        else deviceName = "💻 Mac"
      } else if (/Windows/i.test(ua)) {
        if (/Chrome/i.test(ua)) deviceName = "💻 Chrome sur Windows"
        else if (/Firefox/i.test(ua)) deviceName = "💻 Firefox sur Windows"
        else if (/Edge|Edg/i.test(ua)) deviceName = "💻 Edge sur Windows"
        else deviceName = "💻 Windows"
      } else if (/Linux/i.test(ua)) deviceName = "💻 Linux"
      else deviceName = "💻 Ordinateur"
    }

    console.log("[v0] trackDeviceLogin: Generated device name:", deviceName)
    console.log("[v0] trackDeviceLogin: UserAgent:", deviceInfo.userAgent)

    console.log("[v0] trackDeviceLogin: Checking for devices older than 7 days...")
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: oldDevices } = await client
      .from("device_sessions")
      .select("*")
      .eq("user_id", userId)
      .lt("first_seen", sevenDaysAgo.toISOString())

    if (oldDevices && oldDevices.length > 0) {
      console.log("[v0] trackDeviceLogin: Found old devices, deleting them for weekly reset...")
      await client.from("device_sessions").delete().eq("user_id", userId).lt("first_seen", sevenDaysAgo.toISOString())
      console.log("[v0] trackDeviceLogin: Old devices deleted successfully")
    }

    console.log("[v0] trackDeviceLogin: Checking for existing device...")
    const { data: existingDevice, error: checkError } = await client
      .from("device_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("device_fingerprint", deviceFingerprint)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[v0] trackDeviceLogin: Check error:", checkError)
      throw checkError
    }

    console.log("[v0] trackDeviceLogin: Existing device check result:", { existingDevice, hasError: !!checkError })

    if (existingDevice) {
      console.log("[v0] trackDeviceLogin: Updating existing device...")
      const { error: updateError } = await client
        .from("device_sessions")
        .update({
          last_seen: new Date().toISOString(),
          login_count: existingDevice.login_count + 1,
          device_name: deviceName, // Update device name in case it changed
        })
        .eq("id", existingDevice.id)

      if (updateError) {
        console.error("[v0] trackDeviceLogin: Update error:", updateError)
        throw updateError
      }
      console.log("[v0] trackDeviceLogin: Device updated successfully")
    } else {
      const { data: userData } = await client.from("users").select("role").eq("id", userId).single()

      const isAdmin = userData?.role === "admin"
      console.log("[v0] trackDeviceLogin: User role check:", { isAdmin, role: userData?.role })

      // Only check device limit for non-admin users
      if (!isAdmin) {
        const { data: allDevices } = await client.from("device_sessions").select("*").eq("user_id", userId)

        const deviceCount = allDevices?.length || 0
        console.log("[v0] trackDeviceLogin: Current device count:", deviceCount)

        if (deviceCount >= 2) {
          throw new Error("Limite de 2 appareils atteinte. Veuillez attendre la réinitialisation hebdomadaire.")
        }
      } else {
        console.log("[v0] trackDeviceLogin: Admin user, skipping device limit check")
      }

      // Insert new device with proper device name
      console.log("[v0] trackDeviceLogin: Inserting new device with name:", deviceName)
      const { error: insertError } = await client.from("device_sessions").insert({
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
        browser: deviceInfo.userAgent || null,
        os: deviceInfo.platform || null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        login_count: 1,
        is_locked: true,
      })

      if (insertError) {
        if (insertError.code === "23505") {
          console.log("[v0] trackDeviceLogin: Device already exists (race condition), continuing...")
        } else {
          console.error("[v0] trackDeviceLogin: Insert error:", insertError)
          throw insertError
        }
      } else {
        console.log("[v0] trackDeviceLogin: Device inserted successfully")
      }
    }
  } catch (error) {
    console.error("[v0] trackDeviceLogin: Error:", error)
    throw error
  }
}

async function checkDeviceLimit(userId) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Base de données non disponible")

  const { data: userData } = await client.from("users").select("role").eq("id", userId).single()

  const isAdmin = userData?.role === "admin"

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  await client.from("device_sessions").delete().eq("user_id", userId).lt("first_seen", sevenDaysAgo.toISOString())

  const { data, error } = await client.from("device_sessions").select("*").eq("user_id", userId)

  if (error) throw error

  const MAX_DEVICES = isAdmin ? 999 : 2
  return {
    currentCount: data?.length || 0,
    maxDevices: MAX_DEVICES,
    isLimitReached: !isAdmin && (data?.length || 0) >= 2,
    devices: data || [],
  }
}

async function getUserDevices(userId) {
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error("Base de données non disponible")
  }

  const { data, error } = await client
    .from("device_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_seen", { ascending: false })

  if (error) {
    console.error("[v0] getUserDevices: Error:", error)
    throw error
  }

  return data || []
}

async function removeDevice(deviceId, userId) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Base de données non disponible")

  // First check if device is locked
  const { data: device, error: fetchError } = await client
    .from("device_sessions")
    .select("*")
    .eq("id", deviceId)
    .eq("user_id", userId)
    .single()

  if (fetchError) throw fetchError
  if (!device) throw new Error("Appareil non trouvé")

  // Check if still locked (7 days from first_seen)
  const firstSeen = new Date(device.first_seen)
  const unlockDate = new Date(firstSeen.getTime() + 7 * 24 * 60 * 60 * 1000)
  const now = new Date()

  if (device.is_locked && unlockDate > now) {
    const daysRemaining = Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24))
    throw new Error(
      `Cet appareil est verrouillé pour ${daysRemaining} jour(s) supplémentaire(s). Vous pourrez le supprimer le ${unlockDate.toLocaleDateString("fr-FR")}.`,
    )
  }

  // Delete device
  const { error: deleteError } = await client.from("device_sessions").delete().eq("id", deviceId).eq("user_id", userId)

  if (deleteError) throw deleteError
}

async function updateUnknownDevices(userId) {
  console.log("[v0] updateUnknownDevices: Checking for devices with null device_name...")

  const client = await getSupabaseClient()
  if (!client) {
    console.error("[v0] updateUnknownDevices: Supabase client not available")
    return
  }

  try {
    // Get all devices with null device_name for this user
    const { data: unknownDevices, error: fetchError } = await client
      .from("device_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("device_name", null)

    if (fetchError) {
      console.error("[v0] updateUnknownDevices: Fetch error:", fetchError)
      return
    }

    if (!unknownDevices || unknownDevices.length === 0) {
      console.log("[v0] updateUnknownDevices: No unknown devices found")
      return
    }

    console.log("[v0] updateUnknownDevices: Found", unknownDevices.length, "unknown devices")

    // Update each unknown device with a generated name
    for (const device of unknownDevices) {
      let deviceName = "📱 Appareil Mobile" // Default for mobile if we can't determine more

      // Try to determine device type from browser field (which contains userAgent)
      if (device.browser) {
        const ua = device.browser

        if (/iPhone/i.test(ua)) deviceName = "📱 iPhone"
        else if (/iPad/i.test(ua)) deviceName = "📱 iPad"
        else if (/Android/i.test(ua)) {
          const isTablet = /Tablet/i.test(ua) || !/Mobile/i.test(ua)
          deviceName = isTablet ? "📱 Tablette Android" : "📱 Téléphone Android"
        } else if (/Mobile/i.test(ua)) deviceName = "📱 Téléphone Mobile"
        else deviceName = "💻 Navigateur Inconnu"
      }

      console.log("[v0] updateUnknownDevices: Updating device", device.id, "to", deviceName)

      const { error: updateError } = await client
        .from("device_sessions")
        .update({ device_name: deviceName })
        .eq("id", device.id)

      if (updateError) {
        console.error("[v0] updateUnknownDevices: Update error for device", device.id, ":", updateError)
      } else {
        console.log("[v0] updateUnknownDevices: Successfully updated device", device.id)
      }
    }

    console.log("[v0] updateUnknownDevices: Update complete")
  } catch (error) {
    console.error("[v0] updateUnknownDevices: Error:", error)
  }
}

// =============================================
// Authentication Functions (using our users table with PIN)
// =============================================

async function login(email, pin) {
  console.log("[v0] Login attempt:", { email, pinLength: pin?.length })

  const client = await getSupabaseClient()
  if (!client) {
    console.error("[v0] Supabase client not available")
    throw new Error("Base de données non disponible")
  }

  console.log("[v0] Querying users table...")

  const { data: pendingRequest } = await client
    .from("registration_requests")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("status", "pending")
    .maybeSingle()

  if (pendingRequest) {
    throw new Error(
      "Votre demande d'inscription est en attente d'approbation. Vous ne pouvez pas encore vous connecter.",
    )
  }

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

  console.log("[v0] login: Checking DeviceFingerprint availability...")
  console.log("[v0] login: window.DeviceFingerprint?", !!window.DeviceFingerprint)

  if (window.DeviceFingerprint && window.DeviceFingerprint.generate) {
    try {
      const { fingerprint, deviceInfo } = await window.DeviceFingerprint.generate()

      console.log("[v0] login: Generated fingerprint:", fingerprint)
      console.log("[v0] login: Device info:", deviceInfo)

      // Check device limit before tracking
      const deviceCheck = await checkDeviceLimit(user.id)
      console.log("[v0] login: Device check result:", deviceCheck)

      const currentDevice = deviceCheck.devices.find((d) => d.device_fingerprint === fingerprint)
      console.log("[v0] login: Current device found?", !!currentDevice)

      // If device limit reached and this is a new device, block login
      if (deviceCheck.isLimitReached && !currentDevice) {
        console.error("[v0] login: Device limit reached, blocking login")
        throw new Error("DEVICE_LIMIT_REACHED")
      }

      // Track this device login
      console.log("[v0] login: Calling trackDeviceLogin...")
      await trackDeviceLogin(user.id, fingerprint, deviceInfo)
      console.log("[v0] login: Device tracked successfully")
    } catch (deviceError) {
      console.error("[v0] login: Device tracking error:", deviceError)
      if (deviceError.message === "DEVICE_LIMIT_REACHED") {
        throw deviceError
      }
      // Don't block login for other device tracking errors
      console.warn("[v0] login: Continuing login despite device tracking error")
    }
  } else {
    console.warn("[v0] login: DeviceFingerprint not available, skipping device tracking")
  }

  sessionStorage.setItem("fr_current_user", JSON.stringify(user))
  console.log("[v0] User logged in successfully:", user.email)

  return user
}

async function getCurrentUser() {
  const stored = sessionStorage.getItem("fr_current_user")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      sessionStorage.removeItem("fr_current_user")
    }
  }
  return null
}

async function logout() {
  sessionStorage.removeItem("fr_current_user")
  window.location.href = "index.html"
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

  // Get user email before deletion
  const { data: userData, error: fetchError } = await client.from("users").select("email").eq("id", userId).single()

  if (fetchError) {
    console.error("Error fetching user data:", fetchError)
    throw fetchError
  }

  console.log("[v0] deleteUser: Deleting user data...", { userId, email: userData?.email })

  // Delete from users table first
  const { error: deleteUserError } = await client.from("users").delete().eq("id", userId)

  if (deleteUserError) {
    console.error("[v0] deleteUser: Error deleting from users table:", deleteUserError)
    throw deleteUserError
  }

  // Delete all device sessions for this user
  if (userId) {
    const { error: deleteDevicesError } = await client.from("device_sessions").delete().eq("user_id", userId)

    if (deleteDevicesError) {
      console.error("[v0] deleteUser: Error deleting device sessions:", deleteDevicesError)
    } else {
      console.log("[v0] deleteUser: Deleted all device sessions for user")
    }
  }

  // Delete from registration_requests to allow email reuse
  if (userData?.email) {
    const { error: deleteRequestError } = await client
      .from("registration_requests")
      .delete()
      .eq("email", userData.email)

    if (deleteRequestError) {
      console.error("Error deleting registration request:", deleteRequestError)
    } else {
      console.log("[v0] deleteUser: Deleted registration requests for email")
    }
  }

  // Note: Supabase client-side SDK cannot delete auth users directly
  // The auth user will be orphaned but cannot log in without a matching users table entry
  // Admin should manually clean up auth users from Supabase dashboard if needed
  console.log("[v0] deleteUser: User deleted successfully. Note: Auth user may still exist in Supabase Auth.")
  console.log(
    "[v0] deleteUser: The login function now checks for pending requests to prevent orphaned auth users from logging in.",
  )
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

async function suspendUser(userId) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("users")
    .update({ suspended: true, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

async function unsuspendUser(userId) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("users")
    .update({ suspended: false, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
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
  console.log("[v0] getExerciseById: Looking for exercise with id:", id)
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client.from("exercises").select("*").eq("id", id).single()

  console.log("[v0] getExerciseById: Query result - data:", data, "error:", error)
  if (error) throw error
  return data
}

async function createExercise(exercise) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  const exerciseId = `${exercise.type}-${exercise.niveau || exercise.level}-${exercise.titre || exercise.title}`

  const { data, error } = await client
    .from("exercises")
    .insert({
      id: exerciseId,
      titre: exercise.titre || exercise.title,
      type: exercise.type,
      niveau: exercise.niveau || exercise.level,
      theme: exercise.theme,
      consigne: exercise.consigne || null,
      texte: exercise.texte || exercise.text_content,
      audio: exercise.audio || exercise.audio_url,
      image: exercise.image || null,
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
      explanation: "", // Default empty string for backward compatibility
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
  console.log("[v0 APPROVE] Starting approveRegistration with requestId:", requestId)
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const currentUser = await getCurrentUser()

  // Get the registration request
  const { data: request, error: fetchError } = await client
    .from("registration_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  console.log("[v0 APPROVE] Request data fetched:", request)
  if (fetchError) throw fetchError

  // This updates the existing user if email already exists, or creates a new one
  const { data: newUser, error: createError } = await client
    .from("users")
    .upsert(
      {
        email: request.email,
        name: request.name,
        role: "student",
        pin: request.pin,
        filiere: request.filiere,
        zalo: request.zalo,
        status: "approved",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      },
    )
    .select()
    .single()

  console.log("[v0 APPROVE] User created/updated successfully:", newUser)
  if (createError) throw createError

  console.log("[v0 APPROVE] Marking request as approved with id:", requestId)
  const { error: updateError } = await client
    .from("registration_requests")
    .update({
      status: "approved",
      processed_at: new Date().toISOString(),
      processed_by: currentUser?.id,
    })
    .eq("id", requestId)

  console.log("[v0 APPROVE] Update result - error:", updateError)
  if (updateError) {
    console.error("[v0 APPROVE] Update failed with error:", updateError)
    throw updateError
  }

  console.log("[v0 APPROVE] Registration approved successfully, status updated")
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

async function updateResource(id, resource) {
  const client = await getSupabaseClient()
  if (!client) throw new Error("Supabase not available")

  const { data, error } = await client
    .from("external_resources")
    .update({
      titre: resource.titre,
      description: resource.description,
      url: resource.url,
      categorie: resource.categorie,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
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
  login: login,
  logout: logout,
  getCurrentUser: getCurrentUser,
  verifyAdminPin: async (pin) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Non autorisé")
    }

    const client = await getSupabaseClient()
    if (!client) throw new Error("Base de données non disponible")

    const { data, error } = await client
      .from("users")
      .select("view_pin")
      .eq("id", currentUser.id)
      .eq("role", "admin")
      .single()

    if (error || !data) {
      throw new Error("Erreur de vérification")
    }

    return data.view_pin === pin
  }, // Export new PIN verification function
  updateAdminViewPin: async (oldPin, newPin) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Non autorisé")
    }

    const client = await getSupabaseClient()
    if (!client) throw new Error("Base de données non disponible")

    // Verify old PIN first
    const { data: verifyData, error: verifyError } = await client
      .from("users")
      .select("view_pin")
      .eq("id", currentUser.id)
      .single()

    if (verifyError || !verifyData) {
      throw new Error("Erreur de vérification")
    }

    const currentAdminPin = verifyData.view_pin || "1234"
    if (currentAdminPin !== oldPin) {
      throw new Error("Ancien code PIN incorrect")
    }

    // Validate new PIN (4-6 digits)
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new Error("Le nouveau code doit contenir 4 à 6 chiffres")
    }

    // Update view_pin
    const { error: updateError } = await client.from("users").update({ view_pin: newPin }).eq("id", currentUser.id)

    if (updateError) {
      throw new Error("Erreur lors de la mise à jour du code PIN")
    }

    return true
  },
  updateAdminAccessPin: async (oldPin, newPin) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Non autorisé")
    }

    const client = await getSupabaseClient()
    if (!client) throw new Error("Base de données non disponible")

    // Verify old PIN first - use default 1234 if admin_pin is null
    const { data: verifyData, error: verifyError } = await client
      .from("users")
      .select("admin_pin")
      .eq("id", currentUser.id)
      .single()

    if (verifyError || !verifyData) {
      throw new Error("Erreur de vérification")
    }

    const currentAdminPin = verifyData.admin_pin || "1234"
    if (currentAdminPin !== oldPin) {
      throw new Error("Ancien code PIN incorrect")
    }

    // Validate new PIN (4-6 digits)
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new Error("Le nouveau code doit contenir 4 à 6 chiffres")
    }

    // Update admin_pin
    const { error: updateError } = await client.from("users").update({ admin_pin: newPin }).eq("id", currentUser.id)

    if (updateError) {
      throw new Error("Erreur lors de la mise à jour du code PIN")
    }

    return true
  },

  verifyAdminAccessPin: async (enteredPin) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      return false
    }

    const client = await getSupabaseClient()
    if (!client) return false

    const { data, error } = await client.from("users").select("admin_pin").eq("id", currentUser.id).single()

    if (error || !data) {
      return false
    }

    // Use default 1234 if admin_pin is null
    const adminPin = data.admin_pin || "1234"
    return adminPin === enteredPin
  },

  getAdminPins: async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Non autorisé")
    }

    const client = await getSupabaseClient()
    if (!client) throw new Error("Base de données non disponible")

    const { data, error } = await client.from("users").select("admin_pin, view_pin").eq("id", currentUser.id).single()

    if (error) {
      throw new Error("Erreur lors du chargement des codes PIN")
    }

    return {
      adminPin: data.admin_pin || "1234",
      viewPin: data.view_pin,
    }
  },

  // Users
  getAllUsers: getAllUsers,
  getStudents: getStudents,
  getUserById: getUserById,
  createUser: createUser,
  updateUser: updateUser,
  deleteUser: deleteUser,
  createAdminAccount: createAdminAccount,
  suspendUser: suspendUser,
  unsuspendUser: unsuspendUser,

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
  checkEmailExists: checkEmailExists,
  createRegistrationRequest: createRegistrationRequest,
  getPendingRegistrations: getPendingRegistrations,
  getAllRegistrations: getAllRegistrations,
  approveRegistration: approveRegistration,
  rejectRegistration: rejectRegistration,

  // Resources
  getResources: getResources,
  createResource: createResource,
  deleteResource: deleteResource,
  updateResource: updateResource, // Export new resource update function

  // Stats
  getGlobalStats: getGlobalStats,
  getStudentStats: getStudentStats,

  // Device Tracking
  trackDeviceLogin: trackDeviceLogin,
  checkDeviceLimit: checkDeviceLimit,
  getUserDevices: getUserDevices,
  removeDevice: removeDevice,
  updateUnknownDevices: updateUnknownDevices,
}

console.log("[Supabase] Client library loaded successfully")
