export const ATTENDANCE_QR_PREFIX = 'PINTAR-ATTENDANCE:'
export const ATTENDANCE_TYPE = 'daily'
export const ATTENDANCE_STATUS = 'recorded'

export function getParticipantIdentifier(participant) {
  return String(participant?.participantCode || participant?.id || '').trim()
}

export function createAttendanceQrValue(participant) {
  const identifier = getParticipantIdentifier(participant)
  return identifier ? `${ATTENDANCE_QR_PREFIX}${identifier}` : ''
}

export function parseAttendanceQrValue(value) {
  const text = String(value || '').trim()
  if (!text.startsWith(ATTENDANCE_QR_PREFIX)) return ''

  const identifier = text.slice(ATTENDANCE_QR_PREFIX.length)
  return /^[A-Za-z0-9._-]{1,160}$/.test(identifier) ? identifier : ''
}

export function findParticipantByIdentifier(participants, identifier) {
  const normalizedIdentifier = String(identifier || '').trim()
  if (!normalizedIdentifier) return null

  return participants.find((participant) => getParticipantIdentifier(participant) === normalizedIdentifier) || null
}

export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function readAttendanceRecords(storage = globalThis.localStorage) {
  try {
    const savedRecords = storage?.getItem('pintar-attendance')
    const records = savedRecords ? JSON.parse(savedRecords) : []
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function recordAttendance(participant, { source = 'qr', timestamp = new Date(), storage = globalThis.localStorage } = {}) {
  const participantIdentifier = getParticipantIdentifier(participant)
  if (!participantIdentifier || !storage) return { ok: false, reason: 'storage-unavailable' }

  const records = readAttendanceRecords(storage)
  const date = formatLocalDate(timestamp)
  const duplicate = records.some((record) => (
    record.participantIdentifier === participantIdentifier
    && record.date === date
    && record.type === ATTENDANCE_TYPE
  ))

  if (duplicate) return { ok: false, reason: 'duplicate' }

  const record = {
    id: globalThis.crypto?.randomUUID?.() || `${timestamp.getTime()}-${Math.random().toString(36).slice(2)}`,
    participantId: participant.id || null,
    participantIdentifier,
    participantCode: participant.participantCode || '',
    date,
    scannedAt: timestamp.toISOString(),
    type: ATTENDANCE_TYPE,
    status: ATTENDANCE_STATUS,
    source,
  }

  try {
    storage.setItem('pintar-attendance', JSON.stringify([...records, record]))
    return { ok: true, record }
  } catch {
    return { ok: false, reason: 'storage-unavailable' }
  }
}