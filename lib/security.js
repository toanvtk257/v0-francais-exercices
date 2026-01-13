/**
 * Bibliothèque de sécurité pour protéger contre les attaques XSS, injection, etc.
 */

// Protection XSS: Sanitize HTML pour éviter l'injection de code malveillant
export function sanitizeHTML(str) {
  if (!str) return ""
  const temp = document.createElement("div")
  temp.textContent = str
  return temp.innerHTML
}

// Échapper les caractères spéciaux pour éviter l'injection
export function escapeHTML(str) {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Valider un email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Valider un PIN (4-6 chiffres uniquement)
export function isValidPIN(pin) {
  const pinRegex = /^\d{4,6}$/
  return pinRegex.test(pin)
}

// Valider un numéro de téléphone
export function isValidPhone(phone) {
  const phoneRegex = /^[0-9]{10,15}$/
  return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
}

// Nettoyer les inputs pour éviter l'injection SQL/NoSQL
export function sanitizeInput(input) {
  if (typeof input !== "string") return input
  // Supprimer les caractères potentiellement dangereux
  return input.trim().replace(/[<>{}]/g, "")
}

// Rate Limiting côté client (complémentaire au rate limiting serveur)
const loginAttempts = new Map()

export function checkClientRateLimit(identifier, maxAttempts = 5, windowMs = 900000) {
  const now = Date.now()
  const attempts = loginAttempts.get(identifier) || []

  // Nettoyer les anciennes tentatives
  const recentAttempts = attempts.filter((time) => now - time < windowMs)

  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts)
    const waitTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000 / 60)
    throw new Error(`Trop de tentatives. Veuillez réessayer dans ${waitTime} minute(s).`)
  }

  recentAttempts.push(now)
  loginAttempts.set(identifier, recentAttempts)

  return true
}

// Générer un token CSRF
export function generateCSRFToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Vérifier un token CSRF
export function verifyCSRFToken(token) {
  const storedToken = sessionStorage.getItem("csrf_token")
  return token === storedToken
}

// Content Security Policy - À ajouter dans les meta tags HTML
export function getCSPMetaContent() {
  return `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.supabase.co;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https://*.supabase.co https://blob.vercel-storage.com;
        connect-src 'self' https://*.supabase.co;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    `
    .replace(/\s+/g, " ")
    .trim()
}

// Fonction pour logger les événements de sécurité (sans exposer de données sensibles)
export function logSecurityEvent(eventType, details = {}) {
  // En production, envoyer ces logs à un service de monitoring sécurisé
  if (process.env.NODE_ENV === "production") {
    // Ne jamais logger de données sensibles (mots de passe, PINs, etc.)
    const sanitizedDetails = {
      type: eventType,
      timestamp: new Date().toISOString(),
      // Inclure seulement les informations non-sensibles
      userAgent: navigator.userAgent.substring(0, 100),
      ...details,
    }

    // Envoyer à un service de monitoring (à implémenter)
    console.info("[Security Event]", sanitizedDetails)
  }
}
