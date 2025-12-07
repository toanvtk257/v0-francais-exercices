// Génère une empreinte unique pour identifier l'appareil
class DeviceFingerprint {
  static async generate() {
    const components = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touchSupport: "ontouchstart" in window,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    }

    // Créer un hash simple de ces composants
    const fingerprint = await this.hashComponents(components)

    return {
      fingerprint,
      deviceInfo: components,
    }
  }

  static async hashComponents(obj) {
    const str = JSON.stringify(obj)
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  static getDeviceName(deviceInfo) {
    const ua = deviceInfo.userAgent || ""

    // Détection du type d'appareil
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
      if (/iPhone/i.test(ua)) return "iPhone"
      if (/iPad/i.test(ua)) return "iPad"
      if (/Android/i.test(ua)) return "Android"
      return "Mobile"
    }

    // Détection du navigateur
    if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) return "Chrome sur PC"
    if (/Firefox/i.test(ua)) return "Firefox sur PC"
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari sur Mac"
    if (/Edge|Edg/i.test(ua)) return "Edge sur PC"

    return "Ordinateur"
  }
}

window.DeviceFingerprint = DeviceFingerprint
