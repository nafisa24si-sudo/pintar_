import {
  getAttendanceSchedule,
  getJakartaDateTimeParts,
  getParticipantDayStatus,
} from './attendanceUtils'

export function getAttendanceNotifications(date = new Date()) {
  const schedule = getAttendanceSchedule(date)
  if (!schedule) return []

  const parts = getJakartaDateTimeParts(date)
  const currentMinute = Number(parts.hour) * 60 + Number(parts.minute)
  const dateKey = schedule.date
  const common = {
    dateKey,
    attendanceTime: schedule.time,
  }

  if (currentMinute >= schedule.startMinute - 5 && currentMinute < schedule.startMinute) {
    return [{
      ...common,
      phase: 'before',
      title: 'Absensi akan segera dimulai',
      body: `Waktu absensi dimulai pukul ${schedule.time} WIB. Bersiaplah untuk melakukan absensi.`,
    }]
  }

  if (currentMinute === schedule.startMinute) {
    return [{
      ...common,
      phase: 'start',
      title: 'Saatnya melakukan absensi',
      body: `Silakan lakukan absensi sekarang. Batas hadir tepat waktu pukul ${schedule.time} WIB.`,
    }]
  }

  if (currentMinute > schedule.startMinute) {
    return [{
      ...common,
      phase: 'late',
      title: 'Periksa status absensi Anda',
      body: `Waktu masuk ${schedule.time} WIB sudah lewat. Jika belum absen, Anda akan tercatat terlambat.`,
    }]
  }

  return []
}

export function getAttendanceReminder(date = new Date()) {
  const notification = getAttendanceNotifications(date).find(({ phase }) => phase === 'before')
  if (!notification) return null

  const reminderMinute = 7 * 60 + (notification.attendanceTime === '07:30' ? 25 : 40)
  return {
    ...notification,
    reminderTime: `${String(Math.floor(reminderMinute / 60)).padStart(2, '0')}:${String(reminderMinute % 60).padStart(2, '0')}`,
    isDue: true,
  }
}

export function getParticipantAttendanceNotifications(participant, records, leaveRequests, date = new Date()) {
  const schedule = getAttendanceSchedule(date)
  if (!schedule) return []

  const status = getParticipantDayStatus(participant, records, leaveRequests, date)
  if (['hadir-tepat-waktu', 'izin', 'sakit', 'non-working-day'].includes(status)) return []

  const parts = getJakartaDateTimeParts(date)
  const currentMinute = Number(parts.hour) * 60 + Number(parts.minute)
  const currentTimeInDay = currentMinute * 60_000
    + Number(parts.second) * 1_000
    + date.getMilliseconds()
  const reminderTime = (schedule.startMinute - 5) * 60_000
  const common = {
    dateKey: schedule.date,
    attendanceTime: schedule.time,
  }

  if (currentTimeInDay >= reminderTime && currentTimeInDay < reminderTime + 5_000) {
    return [{
      ...common,
      phase: 'before',
      title: '⏰ Segera Absen',
      body: '5 menit lagi batas waktu absensi. Segera lakukan absensi agar tidak terlambat.',
    }]
  }

  if (currentMinute > schedule.startMinute && status === 'terlambat') {
    return [{
      ...common,
      phase: 'late',
      title: '⚠️ Absensi Terlambat',
      body: 'Batas waktu absensi telah berakhir. Absensi Anda tercatat sebagai terlambat.',
    }]
  }

  return []
}
