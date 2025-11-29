// Configuration file for static HTML app
// This file fetches config from the API to ensure we always have the latest credentials

// Initialize with empty config
window.APP_CONFIG = {
  supabase: {
    url: "",
    anonKey: "",
  },
  loaded: false,
}

// Fetch config from API
;(async function loadConfig() {
  try {
    console.log("[v0] Fetching Supabase config from API...")
    const response = await fetch("/api/config")
    const config = await response.json()
    window.APP_CONFIG = {
      ...config,
      loaded: true,
    }
    console.log("[v0] Config loaded successfully:", {
      url: config.supabase.url,
      hasKey: !!config.supabase.anonKey,
    })
  } catch (error) {
    console.error("[v0] Failed to load config:", error)
    // Fallback to hardcoded values if API fails
    window.APP_CONFIG = {
      supabase: {
        url: "https://rroensqrqmqxreczqldd.supabase.co",
        anonKey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2Vuc3FycW1xeHJlY3pxbGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMjMxMTYsImV4cCI6MjA1MjU5OTExNn0.cKaH5fCKLZPvLdLNchowxKmUQcmZ6sS3rkBNvpCPpgM",
      },
      loaded: true,
    }
    console.log("[v0] Using fallback config")
  }
})()
