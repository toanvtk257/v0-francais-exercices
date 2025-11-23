// Audio storage using IndexedDB for local-first audio file management
const AUDIO_DB_NAME = "fr_audio_storage"
const AUDIO_STORE_NAME = "audio_files"

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME, { keyPath: "filename" })
      }
    }
  })
}

async function saveAudioFile(filename, blob) {
  const db = await openAudioDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIO_STORE_NAME], "readwrite")
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    const request = store.put({ filename, blob, timestamp: Date.now() })

    request.onsuccess = () => resolve(filename)
    request.onerror = () => reject(request.error)
  })
}

async function getAudioFile(filename) {
  const db = await openAudioDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIO_STORE_NAME], "readonly")
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    const request = store.get(filename)

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.blob)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

async function getAllAudioFiles() {
  const db = await openAudioDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIO_STORE_NAME], "readonly")
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    const request = store.getAllKeys()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function deleteAudioFile(filename) {
  const db = await openAudioDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIO_STORE_NAME], "readwrite")
    const store = transaction.objectStore(AUDIO_STORE_NAME)
    const request = store.delete(filename)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Create blob URL from stored audio file
async function getAudioBlobURL(filename) {
  const blob = await getAudioFile(filename)
  if (blob) {
    return URL.createObjectURL(blob)
  }
  return null
}
