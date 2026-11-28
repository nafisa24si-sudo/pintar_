export const ATTENDANCE_QR_PREFIX = 'PINTAR-ATTENDANCE:'
export const ATTENDANCE_TYPE = 'daily'
export const ATTENDANCE_STATUS = 'recorded'
export const ATTENDANCE_TIME_ZONE = 'Asia/Jakarta'
export const ATTENDANCE_STORAGE_KEY = 'pintar-attendance'
export const LEAVE_REQUEST_STORAGE_KEY = 'pintar-leave-requests'
export const ATTENDANCE_ALERT_STORAGE_KEY = 'pintar-attendance-alerts'

const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ATTENDANCE_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

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

export function getJakartaDateTimeParts(date = new Date()) {
  return Object.fromEntries(jakartaFormatter.formatToParts(date).map(({ type, value }) => [type, value]))
}

export function formatLocalDate(date) {
  const parts = getJakartaDateTimeParts(date)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function getAttendanceSchedule(date = new Date()) {
  const parts = getJakartaDateTimeParts(date)
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return null

  const isFriday = parts.weekday === 'Fri'
  const hour = 7
  const minute = isFriday ? 30 : 45
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    startMinute: hour * 60 + minute,
  }
}

export function getAttendanceTimingStatus(timestamp = new Date()) {
  const schedule = getAttendanceSchedule(timestamp)
  if (!schedule) return 'non-working-day'

  const parts = getJakartaDateTimeParts(timestamp)
  const recordedMinute = Number(parts.hour) * 60 + Number(parts.minute)
  return recordedMinute <= schedule.startMinute ? 'on-time' : 'late'
}

export function readAttendanceRecords(storage = globalThis.localStorage) {
  try {
    const savedRecords = storage?.getItem(ATTENDANCE_STORAGE_KEY)
    const records = savedRecords ? JSON.parse(savedRecords) : []
    if (!Array.isArray(records)) return []
    return records.map((record) => {
      if (record.status !== ATTENDANCE_STATUS || !record.scannedAt) return record
      const timestamp = new Date(record.scannedAt)
      return Number.isNaN(timestamp.getTime())
        ? record
        : { ...record, status: getAttendanceTimingStatus(timestamp) }
    })
  } catch {
    return []
  }
}

export function readLeaveRequests(storage = globalThis.localStorage) {
  try {
    const savedRequests = storage?.getItem(LEAVE_REQUEST_STORAGE_KEY)
    const requests = savedRequests ? JSON.parse(savedRequests) : []
    return Array.isArray(requests) ? requests : []
  } catch {
    return []
  }
}

export function readAttendanceAlerts(storage = globalThis.localStorage) {
  try {
    const savedAlerts = storage?.getItem(ATTENDANCE_ALERT_STORAGE_KEY)
    const alerts = savedAlerts ? JSON.parse(savedAlerts) : []
    return Array.isArray(alerts) ? alerts : []
  } catch {
    return []
  }
}

function saveList(storage, key, values) {
  if (!storage) return false
  try {
    storage?.setItem(key, JSON.stringify(values))
    globalThis.window?.dispatchEvent(new Event('pintar-attendance-updated'))
    return true
  } catch {
    return false
  }
}

export function logAttendanceAttempt(participantIdentifier, kind, details = {}, {
  timestamp = new Date(),
  storage = globalThis.localStorage,
} = {}) {
  if (!participantIdentifier || !storage) return { ok: false, reason: 'storage-unavailable' }

  const alerts = readAttendanceAlerts(storage)
  const recentAttempts = alerts.filter((alert) => (
    alert.participantIdentifier === participantIdentifier
    && timestamp.getTime() - new Date(alert.timestamp).getTime() <= 10 * 60 * 1000
  )).length
  const alert = {
    id: globalThis.crypto?.randomUUID?.() || `${timestamp.getTime()}-${Math.random().toString(36).slice(2)}`,
    participantIdentifier,
    kind: recentAttempts >= 2 ? 'repeated-attempt' : kind,
    detail: recentAttempts >= 2 ? 'Percobaan absensi berulang dalam 10 menit.' : details.detail || '',
    distanceMeters: Number.isFinite(details.distanceMeters) ? Math.ceil(details.distanceMeters) : null,
    timestamp: timestamp.toISOString(),
    reviewed: false,
  }

  return saveList(storage, ATTENDANCE_ALERT_STORAGE_KEY, [...alerts, alert].slice(-200))
    ? { ok: true, alert }
    : { ok: false, reason: 'storage-unavailable' }
}

export function recordAttendance(participant, {
  source = 'qr',
  timestamp = new Date(),
  distanceMeters = null,
  storage = globalThis.localStorage,
} = {}) {
  const participantIdentifier = getParticipantIdentifier(participant)
  if (!participantIdentifier || !storage) return { ok: false, reason: 'storage-unavailable' }
  if (!getAttendanceSchedule(timestamp)) return { ok: false, reason: 'non-working-day' }

  const records = readAttendanceRecords(storage)
  const date = formatLocalDate(timestamp)

  // Check existing records for this participant today
  const todayRecords = records.filter((record) => (
    record.participantIdentifier === participantIdentifier
    && record.date === date
  ))

  const hasCheckIn = todayRecords.some((r) => r.type === 'check-in')
  const hasCheckOut = todayRecords.some((r) => r.type === 'check-out')

  // Determine scan type
  let scanType
  if (!hasCheckIn) {
    scanType = 'check-in'
  } else if (!hasCheckOut) {
    scanType = 'check-out'
  } else {
    // Both already recorded
    return { ok: false, reason: 'duplicate' }
  }

  // For check-out, calculate work duration
  let workMinutes = null
  if (scanType === 'check-out' && hasCheckIn) {
    const checkInRecord = todayRecords.find((r) => r.type === 'check-in')
    if (checkInRecord?.scannedAt) {
      const checkInTime = new Date(checkInRecord.scannedAt)
      workMinutes = Math.round((timestamp.getTime() - checkInTime.getTime()) / 60000)
    }
  }

  const timingStatus = scanType === 'check-in' ? getAttendanceTimingStatus(timestamp) : 'check-out'

  const record = {
    id: globalThis.crypto?.randomUUID?.() || `${timestamp.getTime()}-${Math.random().toString(36).slice(2)}`,
    participantId: participant.id || null,
    participantIdentifier,
    participantCode: participant.participantCode || '',
    date,
    scannedAt: timestamp.toISOString(),
    type: scanType,
    status: timingStatus,
    source,
    distanceMeters: Number.isFinite(distanceMeters) ? Math.ceil(distanceMeters) : null,
    workMinutes,
  }

  if (!saveList(storage, ATTENDANCE_STORAGE_KEY, [...records, record])) {
    return { ok: false, reason: 'storage-unavailable' }
  }
  return { ok: true, record, scanType, workMinutes }
}

export function createLeaveRequest(participant, {
  date,
  endDate = date,
  type = 'izin',
  reason,
  evidence = '',
  timestamp = new Date(),
  storage = globalThis.localStorage,
} = {}) {
  const participantIdentifier = getParticipantIdentifier(participant)
  if (!participantIdentifier || !date || !endDate || endDate < date || !['izin', 'sakit'].includes(type) || !reason?.trim() || !storage) {
    return { ok: false, reason: 'invalid-request' }
  }

  const requests = readLeaveRequests(storage)
  const duplicate = requests.some((request) => (
    request.participantIdentifier === participantIdentifier
    && request.date <= endDate
    && (request.endDate || request.date) >= date
    && request.status !== 'rejected'
  ))
  if (duplicate) return { ok: false, reason: 'duplicate' }

  const request = {
    id: globalThis.crypto?.randomUUID?.() || `${timestamp.getTime()}-${Math.random().toString(36).slice(2)}`,
    participantIdentifier,
    participantCode: participant.participantCode || '',
    participantName: participant.name || '',
    type,
    date,
    endDate,
    reason: reason.trim(),
    evidence,
    status: 'pending',
    submittedAt: timestamp.toISOString(),
    reviewedAt: null,
    reviewNote: '',
  }

  return saveList(storage, LEAVE_REQUEST_STORAGE_KEY, [...requests, request])
    ? { ok: true, request }
    : { ok: false, reason: 'storage-unavailable' }
}

export function reviewLeaveRequest(requestId, status, reviewNote = '', storage = globalThis.localStorage) {
  if (!['approved', 'rejected'].includes(status)) return { ok: false, reason: 'invalid-status' }
  const requests = readLeaveRequests(storage)
  const requestExists = requests.some((request) => request.id === requestId)
  if (!requestExists) return { ok: false, reason: 'not-found' }
  const reviewedAt = new Date().toISOString()
  const updatedRequests = requests.map((request) => (
    request.id === requestId ? { ...request, status, reviewNote: reviewNote.trim(), reviewedAt } : request
  ))

  return saveList(storage, LEAVE_REQUEST_STORAGE_KEY, updatedRequests)
    ? { ok: true }
    : { ok: false, reason: 'storage-unavailable' }
}

export function markAttendanceAlertReviewed(alertId, storage = globalThis.localStorage) {
  const alerts = readAttendanceAlerts(storage)
  const updatedAlerts = alerts.map((alert) => (
    alert.id === alertId ? { ...alert, reviewed: true } : alert
  ))
  return saveList(storage, ATTENDANCE_ALERT_STORAGE_KEY, updatedAlerts)
}

function getWeekdayDates(start, end) {
  const firstDay = new Date(`${start}T12:00:00`)
  const lastDay = new Date(`${end}T12:00:00`)
  if (Number.isNaN(firstDay.getTime()) || Number.isNaN(lastDay.getTime()) || firstDay > lastDay) return []

  const dates = []
  for (const cursor = new Date(firstDay); cursor <= lastDay; cursor.setDate(cursor.getDate() + 1)) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const year = cursor.getFullYear()
      const month = String(cursor.getMonth() + 1).padStart(2, '0')
      const day = String(cursor.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
    }
  }
  return dates
}

export function getParticipantAttendanceSummary(participant, records, leaveRequests, now = new Date()) {
  const identifier = getParticipantIdentifier(participant)
  const participantRecords = records.filter((record) => record.participantIdentifier === identifier)
  const participantLeaves = leaveRequests.filter((request) => (
    request.participantIdentifier === identifier && request.status === 'approved'
  ))
  const onTime = participantRecords.filter((record) => record.status === 'on-time').length
  const late = participantRecords.filter((record) => record.status === 'late' || record.status === 'recorded').length
  const approvedLeaveDates = new Set()
  const approvedSickDates = new Set()
  participantLeaves.forEach((request) => {
    getWeekdayDates(request.date, request.endDate || request.date).forEach((date) => {
      approvedLeaveDates.add(date)
      if (request.type === 'sakit') approvedSickDates.add(date)
    })
  })
  const start = participant.startDate || participantRecords.map((record) => record.date).sort()[0] || formatLocalDate(now)
  const end = participant.endDate && participant.endDate < formatLocalDate(now) ? participant.endDate : formatLocalDate(now)
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)
  let scheduledDays = 0

  if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && startDate <= endDate) {
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) scheduledDays += 1
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const leaveDays = approvedLeaveDates.size
  const attendedDays = new Set(participantRecords.map((record) => record.date)).size
  const eligibleDays = Math.max(scheduledDays - leaveDays, attendedDays, 0)
  return {
    attendedDays,
    onTime,
    late,
    leaveDays,
    sickDays: approvedSickDates.size,
    absent: Math.max(scheduledDays - attendedDays - leaveDays, 0),
    attendancePercent: eligibleDays ? Math.round((attendedDays / eligibleDays) * 100) : 0,
  }
}

export function getParticipantDayStatus(participant, records, leaveRequests, date = new Date()) {
  const dateKey = formatLocalDate(date)
  const identifier = getParticipantIdentifier(participant)
  const record = records.find((item) => item.participantIdentifier === identifier && item.date === dateKey)
  if (record) return record.status === 'on-time' ? 'hadir-tepat-waktu' : 'terlambat'

  const leave = leaveRequests.find((request) => (
    request.participantIdentifier === identifier
    && request.date <= dateKey
    && (request.endDate || request.date) >= dateKey
    && request.status === 'approved'
  ))
  if (leave) return leave.type === 'sakit' ? 'sakit' : 'izin'

  const schedule = getAttendanceSchedule(date)
  if (!schedule) return 'non-working-day'
  if (dateKey < formatLocalDate(new Date())) return 'tidak-hadir'
  const parts = getJakartaDateTimeParts(date)
  if (Number(parts.hour) * 60 + Number(parts.minute) > schedule.startMinute) return 'terlambat'
  return 'belum-absen'
}
