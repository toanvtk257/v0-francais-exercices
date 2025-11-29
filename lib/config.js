// Configuration file for static HTML app
// This file fetches config from the API to ensure we always have the latest credentials

// Initialize with empty config
window.APP_CONFIG = {
  supabase: {
    url: "https://rroensqrqmqxreczqldd.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2Vuc3FycW1xeHJlY3pxbGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMjMxMTYsImV4cCI6MjA1MjU5OTExNn0.cKaH5fCKLZPvLdLNchowxKmUQcmZ6sS3rkBNvpCPpgM",
  },
  loaded: true,
}

console.log("[v0] Supabase config loaded:", {
  url: window.APP_CONFIG.supabase.url,
  hasKey: !!window.APP_CONFIG.supabase.anonKey,
})
