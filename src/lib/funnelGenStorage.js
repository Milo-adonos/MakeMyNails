const DB_NAME = 'makemynails_funnel'
const STORE_NAME = 'pending_gen'
const KEY = 'payload'
const LEGACY_LS_KEY = 'funnel_pending_gen'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }

    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      event.target.result.createObjectStore(STORE_NAME)
    }
  })
}

async function idbGet() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(KEY)
    request.onsuccess = () => {
      db.close()
      resolve(request.result ?? null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

async function idbSet(data) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(data, KEY)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function idbClear() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(KEY)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

function readLegacyLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearLegacyLocalStorage() {
  try {
    localStorage.removeItem(LEGACY_LS_KEY)
  } catch {
    // ignore
  }
}

/** Persist funnel photos + choices (IndexedDB — avoids localStorage quota). */
export async function persistFunnelGenData(data) {
  if (!data) return
  await idbSet(data)
  clearLegacyLocalStorage()
}

/** Read persisted funnel payload (migrates legacy localStorage if needed). */
export async function getFunnelGenData() {
  const fromIdb = await idbGet()
  if (fromIdb) return fromIdb

  const legacy = readLegacyLocalStorage()
  if (!legacy) return null

  clearLegacyLocalStorage()
  try {
    await idbSet(legacy)
  } catch {
    // If IDB fails, return legacy data for this session
  }
  return legacy
}

export async function clearFunnelGenData() {
  try {
    await idbClear()
  } catch {
    // ignore
  }
  clearLegacyLocalStorage()
}
