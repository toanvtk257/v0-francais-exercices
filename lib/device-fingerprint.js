// Device fingerprinting to identify unique devices and prevent account sharing
// This creates a unique identifier based on browser and system characteristics

function generateDeviceFingerprint() {
  const components = []

  // Browser information
  components.push(navigator.userAgent || "unknown")
  components.push(navigator.language || "unknown")
  components.push(navigator.platform || "unknown")
  components.push(navigator.hardwareConcurrency || "unknown")
  components.push(navigator.deviceMemory || "unknown")

  // Screen information
  components.push(screen.width || "unknown")
  components.push(screen.height || "unknown")
  components.push(screen.colorDepth || "unknown")
  components.push(screen.pixelDepth || "unknown")

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown")
  components.push(new Date().getTimezoneOffset())

  // Canvas fingerprint (more advanced)
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.fillText("Device fingerprint", 2, 2)
    components.push(canvas.toDataURL())
  } catch (e) {
    components.push("canvas-error")
  }

  // Create hash from all components
  const fingerprint = simpleHash(components.join("|||"))
  return fingerprint
}

function getDeviceName() {
  const ua = navigator.userAgent
  let deviceName = "Unknown Device"

  // Detect device type
  if (/mobile/i.test(ua)) {
    if (/iphone/i.test(ua)) deviceName = "iPhone"
    else if (/ipad/i.test(ua)) deviceName = "iPad"
    else if (/android/i.test(ua)) deviceName = "Android Phone"
    else deviceName = "Mobile Device"
  } else if (/tablet/i.test(ua)) {
    deviceName = "Tablet"
  } else {
    // Desktop
    if (/windows/i.test(ua)) deviceName = "Windows PC"
    else if (/mac/i.test(ua)) deviceName = "Mac"
    else if (/linux/i.test(ua)) deviceName = "Linux PC"
    else deviceName = "Desktop"
  }

  // Add browser
  let browser = ""
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = " - Chrome"
  else if (/firefox/i.test(ua)) browser = " - Firefox"
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = " - Safari"
  else if (/edge/i.test(ua)) browser = " - Edge"

  return deviceName + browser
}

// Simple hash function (FNV-1a)
function simpleHash(str) {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(36)
}

// Store device fingerprint in localStorage for persistence
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("fr_device_id")
  if (!deviceId) {
    deviceId = generateDeviceFingerprint()
    localStorage.setItem("fr_device_id", deviceId)
  }
  return deviceId
}

// Export functions
window.DeviceFingerprint = {
  getFingerprint: getOrCreateDeviceId,
  getDeviceName: getDeviceName,
}
