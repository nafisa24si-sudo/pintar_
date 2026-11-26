import { getAttendanceSchedule, getJakartaDateTimeParts } from './attendanceUtils'

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
