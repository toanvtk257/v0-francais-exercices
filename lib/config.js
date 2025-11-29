// Configuration file for static HTML app
// In production, these values come from environment variables

window.APP_CONFIG = {
  supabase: {
    // These are the actual values from your Supabase integration
    url: "https://rroensqrqmqxreczqldd.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2Vuc3FycW1xeHJlY3pxbGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMjMxMTYsImV4cCI6MjA1MjU5OTExNn0.cKaH5fCKLZPvLdLNchowxKmUQcmZ6sS3rkBNvpCPpgM",
  },
  loaded: true,
}

console.log("[v0] Supabase config loaded:", {
  url: window.APP_CONFIG.supabase.url,
  hasKey: !!window.APP_CONFIG.supabase.anonKey,
  keyPreview: window.APP_CONFIG.supabase.anonKey.substring(0, 20) + "...",
})
