import { useRef, useState } from 'react'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  ScanLine,
  Search,
  X,
} from 'lucide-react'
import {
  findParticipantByIdentifier,
  formatLocalDate,
  getAttendanceSchedule,
  getJakartaDateTimeParts,
  getParticipantIdentifier,
  logAttendanceAttempt,
  parseAttendanceQrValue,
  recordAttendance,
} from './attendanceUtils'
import { ATTENDANCE_OFFICE, getDistanceFromAttendanceOffice } from './attendanceLocationUtils'

const scannerElementId = 'pintar-attendance-qr-reader'

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatWorkDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} menit`
  if (m === 0) return `${h} jam`
  return `${h} jam ${m} menit`
}

/**
 * Returns how many minutes late the check-in is (0 if on time).
 * Uses Jakarta time.
 */
function getLateMinutes(timestamp) {
  const schedule = getAttendanceSchedule(timestamp)
  if (!schedule) return 0
  const parts = getJakartaDateTimeParts(timestamp)
  const actual = Number(parts.hour) * 60 + Number(parts.minute)
  return Math.max(0, actual - schedule.startMinute)
}

// ─── Camera scanner ────────────────────────────────────────────────────────

function CameraScanner({ onRead }) {
  const scannerRef = useRef(null)
  const onReadRef = useRef(onRead)
  const processedRef = useRef(false)
  const [cameraState, setCameraState] = useState('idle')
  const [cameraError, setCameraError] = useState('')

  onReadRef.current = onRead

  const stopCamera = async () => {
    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      try { await scanner.stop() } catch { /* ignore */ }
    }
    if (scanner) {
      try { scanner.clear() } catch { /* ignore */ }
    }
    scannerRef.current = null
    setCameraState('idle')
  }

  const startCamera = async () => {
    setCameraError('')
    processedRef.current = false

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Kamera memerlukan koneksi aman (HTTPS atau localhost).')
      setCameraState('error')
      return
    }

    setCameraState('loading')
    let scanner
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) throw new Error('Tidak ada kamera pada perangkat ini.')

      scanner = new Html5Qrcode(scannerElementId, { verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.4 },
        async (decodedText) => {
          if (processedRef.current) return
          processedRef.current = true
          await stopCamera()
          onReadRef.current(decodedText)
        },
        () => {},
      )
      setCameraState('active')
    } catch (error) {
      if (scanner?.isScanning) {
        try { await scanner.stop(); scanner.clear() } catch { /* ignore */ }
      }
      scannerRef.current = null
      const message = String(error?.message || error || '')
      const denied = ['NotAllowedError', 'PermissionDeniedError'].includes(error?.name)
        || /permission|denied|not allowed/i.test(message)
      setCameraError(denied
        ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, atau masukkan kode secara manual.'
        : message || 'Kamera tidak dapat dibuka. Coba masukkan kode secara manual.')
      setCameraState('error')
    }
  }

  return (
    <div>
      {/* Camera viewport */}
      <div className="relative overflow-hidden rounded-xl border border-[#dde1e5] bg-[#171d23]" style={{ minHeight: '420px' }}>
        <div className="absolute right-3 top-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
          {cameraState === 'active' ? '● Memindai' : cameraState === 'loading' ? '○ Menyiapkan...' : '○ Tidak aktif'}
        </div>
        <div className="p-2" id={scannerElementId} style={{ minHeight: '416px' }} />
        {cameraState !== 'active' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/70">
            <ScanLine size={48} strokeWidth={1.5} />
            <p className="text-sm font-semibold">Arahkan QR ID Card ke kamera</p>
          </div>
        )}
      </div>

      {cameraError && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff1ed] px-3 py-2.5 text-sm font-medium text-[#a74636]">
          <AlertCircle className="mt-0.5 shrink-0" size={16} /> {cameraError}
        </p>
      )}

      <div className="mt-3">
        {cameraState === 'active' ? (
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-[#dde1e5] px-4 py-2.5 text-sm font-bold text-[#303e4c] hover:bg-[#ecf2f8]"
            onClick={stopCamera}
            type="button"
          >
            <X size={16} /> Hentikan kamera
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#222c35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#303e4c] disabled:cursor-wait disabled:opacity-60"
            disabled={cameraState === 'loading'}
            onClick={startCamera}
            type="button"
          >
            <Camera size={16} /> {cameraState === 'loading' ? 'Menyiapkan...' : 'Mulai kamera'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Result card ───────────────────────────────────────────────────────────

function ResultCard({ result, onDismiss }) {
  if (!result) return null

  const isSuccess = result.kind === 'success'
  const isError = result.kind === 'error'
  const isLoading = result.kind === 'loading'

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#dce5ec] bg-white px-5 py-4 shadow-sm">
        <LoaderCircle className="animate-spin text-[#2f5a84]" size={22} />
        <p className="text-sm font-semibold text-[#344e64]">{result.text}</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#f8c4bb] bg-[#fff5f3] px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-[#b34d3b]" size={20} />
          <div className="min-w-0">
            <p className="font-bold text-[#b34d3b]">Absensi tidak berhasil</p>
            <p className="mt-1 text-sm text-[#8a4030]">{result.text}</p>
          </div>
        </div>
        <button
          className="mt-4 w-full rounded-xl border border-[#f0c0b4] px-4 py-2.5 text-sm font-bold text-[#8a4030] transition hover:bg-[#fce8e3]"
          onClick={onDismiss}
          type="button"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  // success — check-in or check-out
  const isCheckIn = result.scanType === 'check-in'

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-[0_8px_24px_rgba(27,65,96,0.12)] ${isCheckIn ? 'border-[#b8d4e8] bg-gradient-to-br from-[#eaf4fc] to-[#f4f9fd]' : 'border-[#b5d6c4] bg-gradient-to-br from-[#eaf6f0] to-[#f3faf6]'}`}>
      {/* Photo + name */}
      <div className={`px-6 py-5 ${isCheckIn ? 'bg-gradient-to-br from-[#1a4f7a] to-[#2d7ab5]' : 'bg-gradient-to-br from-[#1a5c3a] to-[#2d8f5a]'} text-white`}>
        <div className="flex items-center gap-4">
          {result.participant?.photo ? (
            <img
              alt={result.participant.name}
              className="h-14 w-14 rounded-2xl border-2 border-white/30 object-cover"
              src={result.participant.photo}
            />
          ) : (
            <div className={`grid h-14 w-14 place-items-center rounded-2xl border-2 border-white/30 text-xl font-extrabold ${isCheckIn ? 'bg-white/20' : 'bg-white/20'}`}>
              {result.participant?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              {isCheckIn ? 'Absensi Masuk' : 'Absensi Pulang'}
            </p>
            <p className="mt-0.5 break-words text-lg font-extrabold leading-tight">
              {result.participant?.name || 'Peserta'}
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="px-6 py-5">
        <p className={`text-2xl font-extrabold tracking-[-0.03em] ${isCheckIn ? 'text-[#1a3f5c]' : 'text-[#1a3d2a]'}`}>
          {result.message}
        </p>
        {result.submessage && (
          <p className={`mt-1.5 text-sm font-semibold ${isCheckIn ? 'text-[#4a7a9b]' : 'text-[#3a7a56]'}`}>
            {result.submessage}
          </p>
        )}

        <div className={`mt-4 grid grid-cols-2 gap-3 rounded-xl p-3 text-xs ${isCheckIn ? 'bg-[#ddeef8]' : 'bg-[#d8eed8]'}`}>
          <div>
            <p className={`font-bold uppercase tracking-[0.1em] ${isCheckIn ? 'text-[#4a7a9b]' : 'text-[#3a7a56]'}`}>Bagian</p>
            <p className="mt-0.5 font-semibold text-[#2a3e4c]">{result.participant?.division || '-'}</p>
          </div>
          <div>
            <p className={`font-bold uppercase tracking-[0.1em] ${isCheckIn ? 'text-[#4a7a9b]' : 'text-[#3a7a56]'}`}>Waktu</p>
            <p className="mt-0.5 font-semibold text-[#2a3e4c]">{result.timeLabel}</p>
          </div>
        </div>

        <button
          className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${isCheckIn ? 'bg-[#1a4f7a] hover:bg-[#2a6a9a]' : 'bg-[#1a5c3a] hover:bg-[#2a7a50]'}`}
          onClick={onDismiss}
          type="button"
        >
          Scan berikutnya
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function AttendancePage({ participants }) {
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const today = formatLocalDate(new Date())
  const schedule = getAttendanceSchedule(new Date())

  // Format WIB time label
  const formatTimeWIB = (date) => new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(date) + ' WIB'

  const processIdentifier = async (identifier) => {
    if (isProcessing) return
    setIsProcessing(true)
    setResult({ kind: 'loading', text: 'Memeriksa lokasi...' })

    const participant = findParticipantByIdentifier(participants, identifier)
    if (!participant) {
      setResult({ kind: 'error', text: 'Peserta tidak ditemukan. Pastikan QR atau kode cocok dengan data yang tersimpan.' })
      setIsProcessing(false)
      return
    }

    // GPS check
    if (!window.isSecureContext || !navigator.geolocation) {
      setResult({ kind: 'error', text: 'Pemeriksaan lokasi memerlukan koneksi aman (HTTPS atau localhost).' })
      setIsProcessing(false)
      return
    }

    let position
    try {
      position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20_000,
        })
      })
    } catch (geoError) {
      const msg = geoError.code === 1
        ? 'Izin lokasi ditolak. Aktifkan akses lokasi di browser.'
        : geoError.code === 2
          ? 'Lokasi tidak tersedia. Aktifkan GPS dan coba lagi.'
          : geoError.code === 3
            ? 'Pemeriksaan lokasi terlalu lama. Coba lagi.'
            : 'Lokasi gagal diperiksa.'
      setResult({ kind: 'error', text: msg })
      setIsProcessing(false)
      return
    }

    const distance = getDistanceFromAttendanceOffice(position.coords.latitude, position.coords.longitude)
    const withinRadius = distance <= ATTENDANCE_OFFICE.radiusMeters

    if (!withinRadius) {
      logAttendanceAttempt(getParticipantIdentifier(participant), 'outside-radius', {
        distanceMeters: distance,
        detail: `Jarak ${Math.ceil(distance)} meter melebihi radius absensi.`,
      })
      setResult({
        kind: 'error',
        text: `Lokasi Anda ${Math.ceil(distance)} meter dari kantor. Batas radius absensi ${ATTENDANCE_OFFICE.radiusMeters} meter.`,
      })
      setIsProcessing(false)
      return
    }

    const now = new Date()
    const attendanceResult = recordAttendance(participant, {
      source: 'qr',
      timestamp: now,
      distanceMeters: distance,
    })

    if (!attendanceResult.ok) {
      const errText = attendanceResult.reason === 'non-working-day'
        ? 'Absensi tidak tersedia pada akhir pekan.'
        : attendanceResult.reason === 'duplicate'
          ? 'Absensi peserta ini sudah lengkap hari ini (masuk & pulang sudah tercatat).'
          : 'Absensi gagal disimpan. Periksa ruang penyimpanan browser.'
      setResult({ kind: 'error', text: errText })
      setIsProcessing(false)
      return
    }

    const { record, scanType, workMinutes } = attendanceResult
    const timeLabel = formatTimeWIB(now)

    if (scanType === 'check-in') {
      const lateMin = getLateMinutes(now)
      const isLate = lateMin > 0
      const greeting = isLate
        ? `Selamat Datang, ${participant.name} (Terlambat ${lateMin} menit)`
        : `Selamat Datang, ${participant.name}`
      const sub = isLate
        ? `Jam masuk: ${timeLabel} · Batas: ${schedule?.time || '07:45'} WIB`
        : `Tepat waktu · ${timeLabel}`

      setResult({
        kind: 'success',
        scanType: 'check-in',
        message: greeting,
        submessage: sub,
        participant,
        timeLabel,
        record,
      })
    } else {
      // check-out
      const durationLabel = workMinutes !== null ? formatWorkDuration(workMinutes) : null
      setResult({
        kind: 'success',
        scanType: 'check-out',
        message: `Hati-Hati di Jalan, ${participant.name}`,
        submessage: durationLabel ? `${durationLabel} kerja hari ini · ${timeLabel}` : timeLabel,
        participant,
        timeLabel,
        record,
      })
    }

    setManualCode('')
    setIsProcessing(false)
  }

  const handleQrRead = (rawValue) => {
    const identifier = parseAttendanceQrValue(rawValue)
    if (!identifier) {
      setResult({ kind: 'error', text: 'QR tidak dikenali. Gunakan QR dari ID Card PINTAR.' })
      return
    }
    processIdentifier(identifier)
  }

  const handleManualSubmit = (event) => {
    event.preventDefault()
    const code = manualCode.trim()
    if (!code) return
    processIdentifier(code)
  }

  const dismiss = () => setResult(null)

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]">
          <ClipboardCheck size={15} /> Pencatatan kehadiran
        </div>
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#1f2830] sm:text-4xl">Scan Absensi</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#757c83]">
          Scan QR di ID Card peserta. Scan pertama mencatat jam masuk, scan kedua mencatat jam pulang.
          Hari kerja Senin–Jumat · Batas masuk {schedule?.time || '07:45'} WIB{schedule?.time === '07:30' ? ' (Jumat)' : ' (Senin–Kamis)'}.
        </p>
      </div>

      {/* Main layout — single column, camera full width */}
      <div className="space-y-5">

        {/* Camera — full width */}
        <div className="rounded-xl border border-[#dde1e5] bg-white p-4 shadow-[0_10px_24px_rgba(36,51,45,0.04)] sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-[#222c35]">Pindai ID Card</h2>
            <p className="mt-1 text-sm text-[#757c83]">Izinkan akses kamera saat browser meminta. Memerlukan HTTPS atau localhost.</p>
          </div>

          {/* Camera scanner — wider viewport */}
          <CameraScanner onRead={handleQrRead} />

          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9aa0a6]">
            <span className="h-px flex-1 bg-[#e2e6ea]" /> atau masukkan kode <span className="h-px flex-1 bg-[#e2e6ea]" />
          </div>

          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleManualSubmit}>
            <label className="sr-only" htmlFor="attendance-manual-code">Kode peserta</label>
            <input
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm text-[#222c35] outline-none focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20"
              id="attendance-manual-code"
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Contoh: MAGANG-2026-001"
              value={manualCode}
            />
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dde1e5] bg-white px-4 py-2.5 text-sm font-bold text-[#303e4c] hover:bg-[#ecf2f8] disabled:cursor-wait disabled:opacity-60"
              disabled={isProcessing}
              type="submit"
            >
              {isProcessing ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}
              Proses
            </button>
          </form>
        </div>

        {/* Result panel — below camera */}
        {result ? (
          <ResultCard result={result} onDismiss={dismiss} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#c8d0d7] bg-white px-5 py-8 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f1f8] text-[#2f5a84]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#384858]">Siap memindai</p>
              <p className="mt-1 text-xs leading-5 text-[#838a91]">Hasil scan akan tampil di sini secara otomatis.</p>
            </div>
            <p className="text-xs font-semibold text-[#2f5a84]">
              {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date())}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
