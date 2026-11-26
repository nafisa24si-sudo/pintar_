const credentialStorageKey = 'pintar-participant-credentials'
export const participantSessionStorageKey = 'pintar-session'

function readCredentials() {
  const savedCredentials = window.localStorage.getItem(credentialStorageKey)
  if (!savedCredentials) return {}
  const credentials = JSON.parse(savedCredentials)
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    throw new Error('Data akun peserta tidak valid.')
  }
  return credentials
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(value) {
  if (!/^(?:[a-f0-9]{2})+$/i.test(value)) throw new Error('Data akun peserta tidak valid.')
  return new Uint8Array(value.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)))
}

async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) throw new Error('Browser ini tidak mendukung pemrosesan kata sandi. Gunakan HTTPS atau localhost.')
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const digest = await window.crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt,
    iterations: 310000,
  }, keyMaterial, 256)
  return bytesToHex(new Uint8Array(digest))
}

function findParticipantByEmail(participants, email) {
  const normalizedEmail = normalizeEmail(email)
  const matches = participants.filter((participant) => normalizeEmail(participant.email) === normalizedEmail)
  if (matches.length > 1) throw new Error('Email terdaftar lebih dari satu kali. Hubungi admin untuk memperbaiki data.')
  return matches[0] || null
}

export async function activateParticipantAccount(participants, {
  email,
  password,
}) {
  const participant = findParticipantByEmail(participants, email)
  if (!participant) throw new Error('Email belum terdaftar pada data peserta.')
  if (!participant.id) throw new Error('Data peserta tidak memiliki ID yang valid. Hubungi admin.')

  const credentials = readCredentials()
  if (credentials[participant.id]) throw new Error('Akun peserta ini sudah diaktifkan. Silakan masuk.')

  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  credentials[participant.id] = {
    salt: bytesToHex(salt),
    passwordHash: await hashPassword(password, salt),
  }
  window.localStorage.setItem(credentialStorageKey, JSON.stringify(credentials))
  return participant
}

export async function authenticateParticipant(participants, { email, password }) {
  const participant = findParticipantByEmail(participants, email)
  if (!participant) throw new Error('Email atau kata sandi tidak sesuai.')

  const credentials = readCredentials()
  const credential = credentials[participant.id]
  if (!credential) throw new Error('Akun belum dibuat. Pilih “Aktifkan akun” terlebih dahulu.')

  const passwordHash = await hashPassword(password, hexToBytes(credential.salt))
  if (credential.passwordHash !== passwordHash) {
    throw new Error('Email atau kata sandi tidak sesuai.')
  }
  return participant
}
