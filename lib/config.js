// Configuration file for static HTML app
// Loads Supabase credentials from API endpoint

window.APP_CONFIG = {
  supabase: {
    url: null,
    anonKey: null,
  },
  loaded: false,
}

async function loadConfig() {
  try {
    console.log("[v0] Loading Supabase config from API...")

    const response = await fetch("/api/supabase-config")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const config = await response.json()

    window.APP_CONFIG.supabase.url = config.url
    window.APP_CONFIG.supabase.anonKey = config.anonKey
    window.APP_CONFIG.loaded = true

    console.log("[v0] Supabase config loaded from API:", {
      url: config.url,
      hasKey: !!config.anonKey,
      keyPreview: config.anonKey ? config.anonKey.substring(0, 20) + "..." : "none",
    })
  } catch (error) {
    console.error("[v0] Error loading config from API:", error)
    console.log("[v0] Using fallback hardcoded credentials...")

    window.APP_CONFIG.supabase.url = "https://rroensqrqmqxreczqldd.supabase.co"
    window.APP_CONFIG.supabase.anonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2Vuc3FycW1xeHJlY3pxbGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMjMxMTYsImV4cCI6MjA1MjU5OTExNn0.cKaH5fCKLZPvLdLNchowxKmUQcmZ6sS3rkBNvpCPpgM"
    window.APP_CONFIG.loaded = true

    console.log("[v0] Fallback config loaded:", {
      url: window.APP_CONFIG.supabase.url,
      hasKey: !!window.APP_CONFIG.supabase.anonKey,
    })
  }
}

// Load config immediately
loadConfig()
