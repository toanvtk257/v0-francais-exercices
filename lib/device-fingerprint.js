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
    const ua = deviceInfo.userAgent || navigator.userAgent || ""
    const platform = deviceInfo.platform || navigator.platform || ""

    const isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua)

    // Detect specific mobile devices
    if (/iPhone/i.test(ua)) return "📱 iPhone"
    if (/iPad/i.test(ua)) return "📱 iPad"
    if (/Android/i.test(ua)) {
      if (isTablet) return "📱 Tablette Android"
      return "📱 Téléphone Android"
    }
    if (isMobile) return "📱 Téléphone Mobile"

    if (/Macintosh|Mac OS X/i.test(ua)) {
      if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "💻 Safari sur Mac"
      if (/Chrome/i.test(ua)) return "💻 Chrome sur Mac"
      if (/Firefox/i.test(ua)) return "💻 Firefox sur Mac"
      return "💻 Mac"
    }

    if (/Windows/i.test(ua)) {
      if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) return "💻 Chrome sur Windows"
      if (/Firefox/i.test(ua)) return "💻 Firefox sur Windows"
      if (/Edge|Edg/i.test(ua)) return "💻 Edge sur Windows"
      return "💻 Windows"
    }

    if (/Linux/i.test(ua)) return "💻 Linux"

    return "💻 Ordinateur"
  }
}

window.DeviceFingerprint = DeviceFingerprint
