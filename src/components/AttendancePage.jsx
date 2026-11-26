import { useEffect, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, Camera, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, History, ListChecks, LoaderCircle, MapPin, MapPinned, ScanLine, Search, ShieldCheck, Smartphone, UserRound, X } from 'lucide-react'
import {
  findParticipantByIdentifier,
  formatLocalDate,
  getAttendanceSchedule,
  getParticipantAttendanceSummary,
  getParticipantDayStatus,
  getParticipantIdentifier,
  logAttendanceAttempt,
  markAttendanceAlertReviewed,
  parseAttendanceQrValue,
  readAttendanceAlerts,
  readAttendanceRecords,
  readLeaveRequests,
  recordAttendance,
  reviewLeaveRequest,
} from './attendanceUtils'
import { ATTENDANCE_OFFICE, getDistanceFromAttendanceOffice } from './attendanceLocationUtils'

const scannerElementId = 'pintar-attendance-qr-reader'
const attendanceStatusLabels = {
  'on-time': 'Hadir tepat waktu',
  'hadir-tepat-waktu': 'Hadir tepat waktu',
  late: 'Terlambat',
  'belum-absen': 'Belum absen',
  izin: 'Izin',
  'tidak-hadir': 'Tidak hadir',
  'non-working-day': 'Hari libur',
}

function CameraScanner({ onRead }) {
  const scannerRef = useRef(null)
  const onReadRef = useRef(onRead)
  const processedRef = useRef(false)
  const [cameraState, setCameraState] = useState('idle')
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    onReadRef.current = onRead
  }, [onRead])

  useEffect(() => () => {
    const scanner = scannerRef.current
    if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {})
  }, [])

  const stopCamera = async () => {
    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      try {
        await scanner.stop()
      } catch {
        scannerRef.current = null
      }
    }
    if (scanner) {
      try {
        scanner.clear()
      } catch {
        scannerRef.current = null
      }
    }
    scannerRef.current = null
    setCameraState('idle')
  }

  const startCamera = async () => {
    setCameraError('')
    processedRef.current = false

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Kamera memerlukan izin browser dan koneksi aman (HTTPS atau localhost).')
      setCameraState('error')
      return
    }

    setCameraState('loading')
    let scanner
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) throw new Error('Tidak ada kamera yang tersedia pada perangkat ini.')

      scanner = new Html5Qrcode(scannerElementId, { verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
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
        try {
          await scanner.stop()
          scanner.clear()
        } catch {
          scannerRef.current = null
        }
      }
      scannerRef.current = null
      const message = String(error?.message || error || '')
      const denied = ['NotAllowedError', 'PermissionDeniedError'].includes(error?.name) || /permission|denied|not allowed/i.test(message)
      setCameraError(denied
        ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, atau masukkan kode peserta secara manual.'
        : message || 'Kamera tidak dapat dibuka. Coba kode peserta secara manual.')
      setCameraState('error')
    }
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#dde1e5] bg-[#f2f3f5]">
        <div className="flex items-center justify-between border-b border-[#dde1e5] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#303e4c]"><Camera size={17} /> Kamera perangkat</div>
          <span className="text-xs font-semibold text-[#838a91]">{cameraState === 'active' ? 'Memindai' : cameraState === 'loading' ? 'Menyiapkan kamera' : 'Tidak aktif'}</span>
        </div>
        <div className="min-h-64 bg-[#171d23] p-2">
          <div className="mx-auto min-h-60 max-w-md overflow-hidden rounded-lg" id={scannerElementId} />
          {cameraState !== 'active' && <div className="pointer-events-none -mt-52 flex h-52 flex-col items-center justify-center gap-3 text-center text-white/80"><ScanLine size={36} /><p className="text-sm">Area pemindaian QR</p></div>}
        </div>
      </div>
      {cameraError && <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff1ed] px-3 py-2.5 text-sm font-medium text-[#a74636]"><AlertCircle className="mt-0.5 shrink-0" size={16} />{cameraError}</p>}
      <div className="mt-3 flex gap-2">
        {cameraState === 'active' ? (
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#dde1e5] px-4 py-2.5 text-sm font-bold text-[#303e4c] hover:bg-[#ecf2f8]" onClick={stopCamera} type="button"><X size={16} /> Hentikan kamera</button>
        ) : (
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#222c35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#303e4c] disabled:cursor-wait disabled:opacity-60" disabled={cameraState === 'loading'} onClick={startCamera} type="button"><Camera size={16} /> {cameraState === 'loading' ? 'Menyiapkan...' : 'Mulai kamera'}</button>
        )}
      </div>
    </div>
  )
}

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(date)
}

function AttendanceOfficeMap() {
  return (
    <section className="overflow-hidden rounded-xl border border-[#dde1e5] bg-white">
      <div className="border-b border-[#eceef0] px-4 py-4">
        <h2 className="flex items-center gap-2 font-extrabold text-[#222c35]"><MapPinned size={18} /> Peta area absensi</h2>
        <p className="mt-1 text-xs text-[#838a91]">Visualisasi skematis titik kantor dan batas radius; bukan peta jalan berskala.</p>
      </div>
      <div className="relative m-4 grid min-h-72 place-items-center overflow-hidden rounded-xl border border-[#d6e0e7] bg-[#edf3f5]" aria-label="Diagram radius absensi kantor Pelindo">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(32deg, transparent 46%, #d2e0e4 47%, #d2e0e4 50%, transparent 51%), linear-gradient(112deg, transparent 46%, #d2e0e4 47%, #d2e0e4 50%, transparent 51%)', backgroundSize: '110px 90px' }} />
        <div className="absolute h-52 w-52 rounded-full border-2 border-dashed border-[#4e83b7] bg-[#9fc4e433]" />
        <div className="relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#2f5a84] text-white shadow-lg" title="Titik kantor"><MapPin size={22} /></div>
        <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-[#344b60] shadow-sm">Kantor Pelindo · {ATTENDANCE_OFFICE.radiusMeters} m</div>
        <div className="absolute right-4 top-4 rounded-lg bg-white/95 px-3 py-2 text-[10px] font-semibold text-[#64788a]">{ATTENDANCE_OFFICE.latitude}, {ATTENDANCE_OFFICE.longitude}</div>
      </div>
      <p className="px-4 pb-4 text-xs leading-5 text-[#838a91]">Pemeriksaan menggunakan jarak GPS dari koordinat kantor, bukan posisi pada gambar ini.</p>
    </section>
  )
}

export function AttendancePage({ participants }) {
  const [activeTab, setActiveTab] = useState('scan')
  const [records, setRecords] = useState(() => readAttendanceRecords())
  const [leaveRequests, setLeaveRequests] = useState(() => readLeaveRequests())
  const [alerts, setAlerts] = useState(() => readAttendanceAlerts())
  const [manualCode, setManualCode] = useState('')
  const [candidate, setCandidate] = useState(null)
  const [candidateSource, setCandidateSource] = useState('qr')
  const [feedback, setFeedback] = useState(null)
  const [isCheckingLocation, setIsCheckingLocation] = useState(false)
  const [distanceCheck, setDistanceCheck] = useState(null)
  const [dateFilter, setDateFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('Semua bagian')
  const [statusFilter, setStatusFilter] = useState('Semua status')
  const today = formatLocalDate(new Date())
  const schedule = getAttendanceSchedule(new Date())

  useEffect(() => {
    const refresh = () => {
      setRecords(readAttendanceRecords())
      setLeaveRequests(readLeaveRequests())
      setAlerts(readAttendanceAlerts())
    }
    window.addEventListener('pintar-attendance-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('pintar-attendance-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const acceptIdentifier = (identifier, source) => {
    const participant = findParticipantByIdentifier(participants, identifier)
    setCandidate(null)
    setCandidateSource(source)
    if (!participant) {
      setFeedback({ kind: 'error', text: 'Peserta tidak ditemukan. Pastikan QR/kode cocok dengan data peserta tersimpan.' })
      return
    }
    setFeedback({ kind: 'neutral', text: 'Peserta ditemukan. Periksa identitas sebelum mengonfirmasi pencatatan.' })
    setCandidate(participant)
  }

  const handleQrRead = (rawValue) => {
    const identifier = parseAttendanceQrValue(rawValue)
    if (!identifier) {
      setCandidate(null)
      setFeedback({ kind: 'error', text: 'QR tidak dikenali. Gunakan QR ID Card Pelindo yang valid.' })
      return
    }
    acceptIdentifier(identifier, 'qr')
  }

  const handleManualSubmit = (event) => {
    event.preventDefault()
    acceptIdentifier(manualCode.trim(), 'manual')
  }

  const confirmAttendance = async () => {
    if (!candidate) return
    if (!window.isSecureContext || !navigator.geolocation) {
      setFeedback({ kind: 'error', text: 'Pemeriksaan lokasi memerlukan izin lokasi dan koneksi aman (HTTPS atau localhost). Absensi tidak dicatat.' })
      return
    }

    setIsCheckingLocation(true)
    setDistanceCheck(null)
    setFeedback({ kind: 'neutral', text: 'Memeriksa lokasi perangkat...' })

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20_000,
        })
      })
      const distance = getDistanceFromAttendanceOffice(position.coords.latitude, position.coords.longitude)
      const withinRadius = distance <= ATTENDANCE_OFFICE.radiusMeters
      setDistanceCheck({ meters: Math.ceil(distance), withinRadius })

      if (!withinRadius) {
        const attempt = logAttendanceAttempt(getParticipantIdentifier(candidate), 'outside-radius', {
          distanceMeters: distance,
          detail: `Jarak ${Math.ceil(distance)} meter melebihi radius absensi.`,
        })
        setFeedback({
          kind: 'error',
          text: `Absensi ditolak. Lokasi Anda ${Math.ceil(distance)} meter dari kantor; batasnya ${ATTENDANCE_OFFICE.radiusMeters} meter.${attempt.ok ? '' : ' Peringatan gagal disimpan.'}`,
        })
        setAlerts(readAttendanceAlerts())
        return
      }

      const result = recordAttendance(candidate, { source: candidateSource, distanceMeters: distance })
      if (!result.ok) {
        const attempt = result.reason === 'duplicate'
          ? logAttendanceAttempt(getParticipantIdentifier(candidate), 'duplicate', { detail: 'Mencoba absen lebih dari sekali pada hari yang sama.' })
          : { ok: true }
        setFeedback({
          kind: 'error',
          text: result.reason === 'non-working-day'
            ? 'Absensi tidak tersedia pada akhir pekan sesuai jadwal kerja yang berlaku.'
            : result.reason === 'duplicate'
            ? `Absensi peserta ini sudah tercatat hari ini.${attempt.ok ? '' : ' Peringatan gagal disimpan.'}`
            : 'Absensi gagal disimpan. Penyimpanan browser tidak tersedia atau penuh.',
        })
        setAlerts(readAttendanceAlerts())
        return
      }

      setRecords((current) => [...current, result.record])
      setCandidate(null)
      setManualCode('')
      setFeedback({
        kind: 'success',
        text: `Absensi ${candidate.name} berhasil dicatat sebagai ${result.record.status === 'on-time' ? 'hadir tepat waktu' : 'terlambat'}.`,
      })
    } catch (error) {
      const locationMessage = error.code === 1
        ? 'Izin lokasi ditolak. Izinkan akses lokasi di browser untuk melakukan absensi.'
        : error.code === 2
          ? 'Lokasi tidak tersedia. Aktifkan GPS dan coba lagi.'
          : error.code === 3
            ? 'Pemeriksaan lokasi terlalu lama. Coba lagi di area dengan sinyal GPS lebih baik.'
            : 'Lokasi gagal diperiksa. Aktifkan GPS dan coba lagi.'
      setFeedback({ kind: 'error', text: `${locationMessage} Absensi tidak dicatat.` })
    } finally {
      setIsCheckingLocation(false)
    }
  }

  const divisions = ['Semua bagian', ...new Set(participants.map((participant) => participant.division).filter(Boolean))]
  const resolvedRecords = records.map((record) => {
    const participant = participants.find((item) => (
      (record.participantId && item.id === record.participantId)
      || getParticipantIdentifier(item) === record.participantIdentifier
    ))
    return { ...record, participant }
  })
  const filteredRecords = resolvedRecords.filter((record) => {
    const matchesDate = !dateFilter || record.date === dateFilter
    const matchesName = !nameFilter || record.participant?.name?.toLowerCase().includes(nameFilter.trim().toLowerCase())
    const matchesDivision = divisionFilter === 'Semua bagian' || record.participant?.division === divisionFilter
    const matchesStatus = statusFilter === 'Semua status' || record.status === statusFilter
    return matchesDate && matchesName && matchesDivision && matchesStatus
  }).sort((left, right) => right.scannedAt.localeCompare(left.scannedAt))

  const dailySummary = Object.values(filteredRecords.reduce((summary, record) => {
    summary[record.date] = summary[record.date] || { date: record.date, count: 0 }
    summary[record.date].count += 1
    return summary
  }, {})).sort((left, right) => right.date.localeCompare(left.date))
  const disciplineSummary = participants.map((participant) => ({
    participant,
    ...getParticipantAttendanceSummary(participant, records, leaveRequests),
    todayStatus: getParticipantDayStatus(participant, records, leaveRequests),
  })).sort((left, right) => right.attendancePercent - left.attendancePercent || left.participant.name.localeCompare(right.participant.name))

  const tabs = [
    { id: 'scan', label: 'Scan QR', icon: ScanLine },
    { id: 'history', label: 'Riwayat Absensi', icon: History },
    { id: 'summary', label: 'Rekap Absensi', icon: ListChecks },
    { id: 'requests', label: 'Pengajuan Izin', icon: FileCheck2 },
    { id: 'alerts', label: 'Peringatan', icon: AlertTriangle },
    { id: 'map', label: 'Peta Lokasi', icon: MapPinned },
  ]

  return (
    <section className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]"><ClipboardCheck size={15} /> Administrasi kehadiran</div>
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#1f2830] sm:text-4xl">Absensi Peserta</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#757c83]">Catatan tersimpan hanya di browser/perangkat ini dan belum tersinkronisasi ke perangkat lain.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#dbdfe3]" role="tablist" aria-label="Bagian absensi">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button aria-selected={activeTab === id} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition ${activeTab === id ? 'border-[#2f5a84] text-[#24425f]' : 'border-transparent text-[#737a82] hover:text-[#222c35]'}`} key={id} onClick={() => setActiveTab(id)} role="tab" type="button"><Icon size={16} />{label}</button>
        ))}
      </div>

      {activeTab === 'scan' && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-xl border border-[#dde1e5] bg-white p-4 shadow-[0_10px_24px_rgba(36,51,45,0.04)] sm:p-5">
            <div className="mb-4"><h2 className="text-lg font-extrabold text-[#222c35]">Pindai kartu peserta</h2><p className="mt-1 text-sm text-[#757c83]">Izinkan kamera saat browser meminta akses. Kamera memerlukan HTTPS atau localhost.</p></div>
            <CameraScanner onRead={handleQrRead} />
            <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#9aa0a6]"><span className="h-px flex-1 bg-[#e2e6ea]" />atau masukkan kode<span className="h-px flex-1 bg-[#e2e6ea]" /></div>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleManualSubmit}>
              <label className="sr-only" htmlFor="attendance-manual-code">Kode peserta</label>
              <input autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm text-[#222c35] outline-none focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20" id="attendance-manual-code" onChange={(event) => setManualCode(event.target.value)} placeholder="Contoh: MAGANG-2026-001" value={manualCode} />
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dde1e5] bg-white px-4 py-2.5 text-sm font-bold text-[#303e4c] hover:bg-[#ecf2f8]" type="submit"><Search size={16} /> Cari peserta</button>
            </form>
            {feedback && <p className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${feedback.kind === 'success' ? 'bg-[#e3ebf3] text-[#24425f]' : feedback.kind === 'error' ? 'bg-[#fff1ed] text-[#a74636]' : 'bg-[#eaeff3] text-[#24425f]'}`} role="status">{feedback.kind === 'success' ? <CheckCircle2 className="mt-0.5 shrink-0" size={16} /> : <AlertCircle className="mt-0.5 shrink-0" size={16} />}{feedback.text}</p>}
            {distanceCheck && (
              <p className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm font-bold ${distanceCheck.withinRadius ? 'bg-[#e7f3ed] text-[#286344]' : 'bg-[#fff1ed] text-[#a74636]'}`} role="status">
                {distanceCheck.withinRadius ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                <span>Lokasi Anda: {distanceCheck.meters} meter dari kantor. {distanceCheck.withinRadius ? 'Anda berada dalam area absensi.' : `Anda berada di luar radius absensi ${ATTENDANCE_OFFICE.radiusMeters} meter.`}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-[#dde1e5] bg-[#f9fbfc] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><ShieldCheck className="text-[#2f5a84]" size={18} /><h2 className="text-lg font-extrabold text-[#222c35]">Konfirmasi pencatatan</h2></div>
            {candidate ? (
              <>
                <div className="flex items-start gap-4 rounded-xl border border-[#dde1e5] bg-white p-4">
                  {candidate.photo ? <img alt={`Foto ${candidate.name || 'peserta'}`} className="h-16 w-16 rounded-xl object-cover" src={candidate.photo} /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#cedff0] text-[#305880]"><UserRound size={25} /></div>}
                  <div className="min-w-0 space-y-1 text-sm text-[#556e86]">
                    <p className="break-words text-base font-extrabold text-[#222c35]">{candidate.name}</p>
                    <p><span className="font-bold">Kode:</span> {getParticipantIdentifier(candidate)}</p>
                    <p><span className="font-bold">Institusi:</span> {candidate.institution || '-'}</p>
                    <p><span className="font-bold">Bagian:</span> {candidate.division || '-'}</p>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-lg border border-[#cbd9e6] bg-[#edf4fa] p-3 text-xs leading-5 text-[#34516c]"><MapPin className="mt-0.5 shrink-0" size={15} />Absensi hanya dapat dicatat dalam radius {ATTENDANCE_OFFICE.radiusMeters} meter dari kantor Pelindo Regional 1 Dumai. Izinkan akses lokasi saat konfirmasi.</p>
                <p className="mt-3 rounded-lg border border-[#e8e5d6] bg-[#fffdf4] p-3 text-xs leading-5 text-[#6b6857]">QR hanya membantu mencari data kartu. Pemindaian tidak membuktikan identitas pemegang kartu; aturan verifikasi masih perlu dikonfirmasi. Selfie tidak diwajibkan.</p>
                {schedule && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#526a81]"><Clock3 size={14} />Batas hadir tepat waktu: {schedule.time} WIB {schedule.time === '07:30' ? '(Jumat)' : '(Senin–Kamis)'}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#757c83]"><span>Jenis pencatatan: harian</span><span>Tanggal WIB: {today}</span></div>
                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#222c35] px-4 py-3 text-sm font-bold text-white hover:bg-[#303e4c] disabled:cursor-wait disabled:opacity-60" disabled={isCheckingLocation} onClick={confirmAttendance} type="button">{isCheckingLocation ? <><LoaderCircle className="animate-spin" size={17} /> Memeriksa lokasi...</> : <><CheckCircle2 size={17} /> Konfirmasi dan catat</>}</button>
              </>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[#c8d0d7] bg-white px-5 text-center">
                <Smartphone className="text-[#9aa0a6]" size={28} />
                <p className="mt-3 text-sm font-bold text-[#384858]">Belum ada peserta dipilih</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#838a91]">Hasil scan atau pencarian kode akan ditampilkan di sini untuk dikonfirmasi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'history' || activeTab === 'summary') && (
        <>
          <div className="grid gap-3 rounded-xl border border-[#dde1e5] bg-white p-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-bold text-[#4c6277]">Tanggal<input className="mt-1.5 w-full rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm font-medium text-[#222c35]" onChange={(event) => setDateFilter(event.target.value)} type="date" value={dateFilter} /></label>
            <label className="text-xs font-bold text-[#4c6277]">Nama peserta<input className="mt-1.5 w-full rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm font-medium text-[#222c35]" onChange={(event) => setNameFilter(event.target.value)} placeholder="Cari nama" value={nameFilter} /></label>
            <label className="text-xs font-bold text-[#4c6277]">Bagian<select className="mt-1.5 w-full rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm font-medium text-[#222c35]" onChange={(event) => setDivisionFilter(event.target.value)} value={divisionFilter}>{divisions.map((division) => <option key={division}>{division}</option>)}</select></label>
            <label className="text-xs font-bold text-[#4c6277]">Status<select className="mt-1.5 w-full rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm font-medium text-[#222c35]" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option>Semua status</option><option value="on-time">Hadir tepat waktu</option><option value="late">Terlambat</option></select></label>
          </div>

          {activeTab === 'history' ? (
            <div className="overflow-x-auto rounded-xl border border-[#dde1e5] bg-white">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#f7f8f9] text-[11px] font-bold uppercase tracking-[0.1em] text-[#899096]"><tr><th className="px-4 py-3">Waktu scan</th><th className="px-4 py-3">Peserta</th><th className="px-4 py-3">Bagian</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Sumber</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody>
                  {filteredRecords.length ? filteredRecords.map((record) => <tr className="border-t border-[#eceef0] text-sm" key={record.id}><td className="whitespace-nowrap px-4 py-3 text-[#556e86]">{formatDateTime(record.scannedAt)}</td><td className="px-4 py-3 font-bold text-[#222c35]">{record.participant?.name || record.participantCode || record.participantIdentifier}</td><td className="px-4 py-3 text-[#556e86]">{record.participant?.division || '-'}</td><td className="px-4 py-3 text-[#556e86]">Kehadiran harian</td><td className="px-4 py-3 text-[#556e86]">{record.source === 'manual' ? 'Kode manual' : 'QR'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.status === 'on-time' ? 'bg-[#e7f3ed] text-[#286344]' : 'bg-[#fff1ed] text-[#a74636]'}`}>{attendanceStatusLabels[record.status] || attendanceStatusLabels.late}</span></td></tr>) : <tr><td className="px-4 py-10 text-center text-sm text-[#828991]" colSpan={6}>Belum ada catatan yang sesuai filter.</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="overflow-hidden rounded-xl border border-[#dde1e5] bg-white">
                <div className="border-b border-[#eceef0] px-4 py-4"><h2 className="font-extrabold text-[#222c35]">Catatan per tanggal</h2><p className="mt-1 text-xs text-[#838a91]">Jumlah catatan sesuai filter</p></div>
                <div className="divide-y divide-[#eceef0]">{dailySummary.length ? dailySummary.map((summary) => <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm" key={summary.date}><span className="font-semibold text-[#475b6f]">{summary.date}</span><span className="font-extrabold text-[#222c35]">{summary.count} catatan</span></div>) : <p className="px-4 py-10 text-center text-sm text-[#828991]">Belum ada data rekap.</p>}</div>
              </section>
              <section className="overflow-hidden rounded-xl border border-[#dde1e5] bg-white xl:col-span-2">
                <div className="border-b border-[#eceef0] px-4 py-4"><h2 className="font-extrabold text-[#222c35]">Rekap kedisiplinan peserta</h2><p className="mt-1 text-xs text-[#838a91]">Persentase = hari hadir ÷ hari kerja terjadwal setelah izin disetujui.</p></div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f7f8f9] text-xs font-bold text-[#75808a]"><tr><th className="px-4 py-3">Peserta</th><th className="px-4 py-3">Status hari ini</th><th className="px-4 py-3">Kehadiran</th><th className="px-4 py-3">Tepat waktu</th><th className="px-4 py-3">Terlambat</th><th className="px-4 py-3">Izin</th><th className="px-4 py-3">Absen</th><th className="px-4 py-3">Persentase</th></tr></thead>
                    <tbody className="divide-y divide-[#eceef0]">
                      {disciplineSummary.length ? disciplineSummary.map(({ participant, attendedDays, onTime, late, leaveDays, absent, attendancePercent, todayStatus }) => (
                        <tr key={getParticipantIdentifier(participant)}>
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-[#303e4c]">{participant.name || getParticipantIdentifier(participant)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{attendanceStatusLabels[todayStatus] || todayStatus}</td>
                          <td className="px-4 py-3">{attendedDays} hari</td><td className="px-4 py-3">{onTime}</td><td className="px-4 py-3">{late}</td><td className="px-4 py-3">{leaveDays}</td><td className="px-4 py-3">{absent}</td>
                          <td className="px-4 py-3 font-extrabold text-[#2f5a84]">{attendancePercent}%</td>
                        </tr>
                      )) : <tr><td className="px-4 py-8 text-center text-[#838a91]" colSpan={8}>Belum ada peserta.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
          <p className="text-xs leading-5 text-[#838a91]">Status tepat waktu dihitung berdasarkan jadwal WIB 07.45 Senin–Kamis dan 07.30 Jumat. Hari kerja dihitung Senin–Jumat dalam rentang magang peserta. Jam perangkat tidak dapat diverifikasi secara tepercaya tanpa backend.</p>
        </>
      )}

      {activeTab === 'requests' && (
        <section className="space-y-3">
          <div className="rounded-xl border border-[#cbd9e6] bg-[#edf4fa] p-4 text-sm text-[#34516c]">
            <h2 className="font-extrabold">Persetujuan izin</h2>
            <p className="mt-1 text-xs leading-5">Permohonan yang disetujui mengubah status harian menjadi Izin dan dikecualikan dari persentase hari kerja.</p>
          </div>
          {leaveRequests.length ? [...leaveRequests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((request) => (
            <article className="rounded-xl border border-[#dde1e5] bg-white p-4" key={request.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-extrabold text-[#222c35]">{request.participantName || request.participantCode} <span className="font-semibold text-[#75808a]">· {request.date}</span></p>
                  <p className="mt-1 text-sm text-[#526a81]">{request.reason}</p>
                  <p className="mt-1 text-xs text-[#838a91]">Diajukan {formatDateTime(request.submittedAt)}</p>
                  {request.evidence && <a className="mt-2 inline-flex text-xs font-bold text-[#2f5a84] underline" download={`bukti-izin-${request.date}`} href={request.evidence} rel="noreferrer" target="_blank">Lihat / unduh bukti</a>}
                  {request.reviewNote && <p className="mt-2 text-xs text-[#75808a]">Catatan admin: {request.reviewNote}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#f1f3f4] px-3 py-1.5 text-xs font-bold text-[#526a81]">{request.status === 'pending' ? 'Menunggu' : request.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>
                  {request.status === 'pending' && (
                    <>
                      <button aria-label={`Setujui izin ${request.participantName}`} className="rounded-lg bg-[#e7f3ed] px-3 py-2 text-xs font-bold text-[#286344] hover:bg-[#d6eadf]" onClick={() => {
                        const result = reviewLeaveRequest(request.id, 'approved')
                        if (!result.ok) setFeedback({ kind: 'error', text: 'Status izin gagal diperbarui di penyimpanan browser.' })
                        setLeaveRequests(readLeaveRequests())
                      }} type="button">Setujui</button>
                      <button aria-label={`Tolak izin ${request.participantName}`} className="rounded-lg bg-[#fff1ed] px-3 py-2 text-xs font-bold text-[#a74636] hover:bg-[#f8ded7]" onClick={() => {
                        const result = reviewLeaveRequest(request.id, 'rejected')
                        if (!result.ok) setFeedback({ kind: 'error', text: 'Status izin gagal diperbarui di penyimpanan browser.' })
                        setLeaveRequests(readLeaveRequests())
                      }} type="button">Tolak</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          )) : <p className="rounded-xl border border-dashed border-[#c8d0d7] bg-white px-4 py-10 text-center text-sm text-[#828991]">Belum ada pengajuan izin.</p>}
        </section>
      )}

      {activeTab === 'alerts' && (
        <section className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-[#f1d8a8] bg-[#fff9e9] p-4 text-sm text-[#765b24]">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p><strong>Aktivitas absensi perlu diperiksa.</strong> Peringatan dibuat untuk lokasi di luar radius dan percobaan berulang. Pemeriksaan jam perangkat tidak dapat diverifikasi tanpa server.</p>
          </div>
          {alerts.filter((alert) => !alert.reviewed).length ? alerts.filter((alert) => !alert.reviewed).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((alert) => {
            const participant = findParticipantByIdentifier(participants, alert.participantIdentifier)
            const label = alert.kind === 'outside-radius' ? 'Lokasi di luar radius' : alert.kind === 'duplicate' ? 'Percobaan absen ganda' : 'Percobaan berulang'
            return (
              <article className="flex flex-col gap-3 rounded-xl border border-[#dde1e5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={alert.id}>
                <div><p className="font-extrabold text-[#303e4c]">{label} · {participant?.name || alert.participantIdentifier}</p><p className="mt-1 text-xs text-[#75808a]">{alert.detail} {alert.distanceMeters ? `Jarak: ${alert.distanceMeters} m.` : ''} {formatDateTime(alert.timestamp)}</p></div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dde1e5] px-3 py-2 text-xs font-bold text-[#384858] hover:bg-[#f4f6f7]" onClick={() => {
                  const saved = markAttendanceAlertReviewed(alert.id)
                  if (!saved) setFeedback({ kind: 'error', text: 'Peringatan gagal diperbarui.' })
                  setAlerts(readAttendanceAlerts())
                }} type="button"><CheckCircle2 size={15} /> Tandai ditinjau</button>
              </article>
            )
          }) : <p className="rounded-xl border border-dashed border-[#c8d0d7] bg-white px-4 py-10 text-center text-sm text-[#828991]">Tidak ada peringatan yang belum ditinjau.</p>}
        </section>
      )}

      {activeTab === 'map' && <AttendanceOfficeMap />}
    </section>
  )
}