import { useEffect, useRef, useState } from 'react'
import { BellRing, BellOff, Volume2 } from 'lucide-react'
import { getAttendanceNotifications } from './attendanceReminderUtils'

const enabledStorageKey = 'pintar-attendance-reminder-enabled'
const notifiedStorageKey = 'pintar-attendance-reminder-last-notified'

function getInitialReminderState() {
  if (typeof window.Notification === 'undefined') {
    return { enabled: false, message: 'Browser ini belum mendukung notifikasi.' }
  }

  try {
    const enabled = window.localStorage.getItem(enabledStorageKey) === 'true'
      && window.Notification.permission === 'granted'
    return {
      enabled,
      message: 'Jadwal WIB: sebelum mulai, saat mulai, dan setelah batas masuk. Web harus tetap terbuka.',
    }
  } catch {
    return { enabled: false, message: 'Pengaturan pengingat tidak dapat disimpan di browser ini.' }
  }
}

function playReminderChime(audioContext) {
  const startTime = audioContext.currentTime

  ;[880, 1174].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const noteStart = startTime + index * 0.24

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.48)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteStart + 0.5)
  })
}

export function AttendanceReminder() {
  const [initialState] = useState(getInitialReminderState)
  const [enabled, setEnabled] = useState(initialState.enabled)
  const [soundReady, setSoundReady] = useState(false)
  const [message, setMessage] = useState(initialState.message)
  const audioContextRef = useRef(null)
  const notifiedEventsRef = useRef(new Set())

  useEffect(() => () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
  }, [])

  const activateSound = async () => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor) return false

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextConstructor()
      }
      await audioContextRef.current.resume()
      const isReady = audioContextRef.current.state === 'running'
      setSoundReady(isReady)
      return isReady
    } catch {
      setSoundReady(false)
      return false
    }
  }

  const enableReminder = async () => {
    if (typeof window.Notification === 'undefined') {
      setMessage('Browser ini belum mendukung notifikasi.')
      return
    }

    let permission = window.Notification.permission
    if (permission === 'default') {
      try {
        permission = await window.Notification.requestPermission()
      } catch {
        setMessage('Browser gagal meminta izin notifikasi. Periksa pengaturan situs di browser.')
        return
      }
    }
    if (permission !== 'granted') {
      setMessage('Izin notifikasi belum diberikan. Izinkan notifikasi dari pengaturan browser.')
      return
    }

    const hasSound = await activateSound()
    try {
      window.localStorage.setItem(enabledStorageKey, 'true')
    } catch {
      setMessage('Pengingat tidak dapat diaktifkan karena penyimpanan browser tidak tersedia.')
      return
    }

    setEnabled(true)
    setMessage(hasSound
      ? 'Pengingat aktif: 5 menit sebelum, saat mulai, dan setelah batas masuk.'
      : 'Notifikasi aktif, tetapi bunyi diblokir browser. Tekan Aktifkan bunyi untuk mengizinkannya.')
  }

  const disableReminder = () => {
    try {
      window.localStorage.removeItem(enabledStorageKey)
    } catch {
      setMessage('Pengaturan pengingat tidak dapat diubah di browser ini.')
      return
    }
    setEnabled(false)
    setMessage('Pengingat absensi dimatikan.')
  }

  const enableSound = async () => {
    const hasSound = await activateSound()
    setMessage(hasSound
      ? 'Bunyi pengingat sudah aktif.'
      : 'Browser tidak mengizinkan bunyi. Periksa pengaturan suara browser.')
  }

  useEffect(() => {
    if (!enabled) return undefined

    const checkReminder = () => {
      if (window.Notification.permission !== 'granted') {
        setEnabled(false)
        setMessage('Izin notifikasi dicabut. Aktifkan ulang pengingat untuk melanjutkan.')
        return
      }

      getAttendanceNotifications().forEach((reminder) => {
        const eventKey = `${reminder.dateKey}:${reminder.phase}`
        if (notifiedEventsRef.current.has(eventKey)) return

        try {
          if (window.localStorage.getItem(notifiedStorageKey) === eventKey) {
            notifiedEventsRef.current.add(eventKey)
            return
          }
          window.localStorage.setItem(notifiedStorageKey, eventKey)
        } catch {
          setMessage('Pengingat gagal dijadwalkan karena penyimpanan browser tidak tersedia.')
          return
        }

        notifiedEventsRef.current.add(eventKey)
        let notificationSent = false
        try {
          const notification = new window.Notification(reminder.title, {
            body: reminder.body,
            icon: '/pelindo-logo.png',
            tag: `pintar-attendance-${eventKey}`,
          })
          notification.onclick = () => window.focus()
          notificationSent = true
        } catch {
          setMessage('Browser gagal menampilkan notifikasi absensi.')
        }

        if (audioContextRef.current?.state === 'running') {
          try {
            playReminderChime(audioContextRef.current)
          } catch {
            setMessage('Notifikasi tampil, tetapi bunyi pengingat gagal diputar.')
          }
        } else if (notificationSent) {
          setMessage(`${reminder.title} (${reminder.attendanceTime} WIB).`)
        }
      })
    }

    checkReminder()
    const intervalId = window.setInterval(checkReminder, 15_000)
    document.addEventListener('visibilitychange', checkReminder)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', checkReminder)
    }
  }, [enabled])

  return (
    <div className="sm:max-w-56">
      {enabled ? (
        <div className="flex flex-wrap items-center gap-1">
          <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#2f5a84] transition hover:bg-[#dbe7f3]" onClick={disableReminder} type="button">
            <BellRing size={16} /> Pengingat aktif
          </button>
          {!soundReady && (
            <button aria-label="Aktifkan bunyi pengingat" className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3]" onClick={enableSound} type="button">
              <Volume2 size={15} /> Aktifkan bunyi
            </button>
          )}
        </div>
      ) : (
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35]" onClick={enableReminder} type="button">
          <BellOff size={16} /> Aktifkan pengingat
        </button>
      )}
      <p className="px-3 text-[10px] leading-4 text-[#7a828a]" role="status">{message}</p>
    </div>
  )
}
