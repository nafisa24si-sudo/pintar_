import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarCheck2, CheckCircle2, Clock3, FileText, MapPin, Send, UserRound } from 'lucide-react'
import {
  createLeaveRequest,
  findParticipantByIdentifier,
  formatLocalDate,
  getParticipantAttendanceSummary,
  getParticipantDayStatus,
  getParticipantIdentifier,
  readAttendanceRecords,
  readLeaveRequests,
} from './attendanceUtils'
import { ATTENDANCE_OFFICE } from './attendanceLocationUtils'

const fieldClass = 'mt-1.5 w-full rounded-lg border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2.5 text-sm text-[#222c35] outline-none focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20'

const statusLabels = {
  'hadir-tepat-waktu': 'Hadir tepat waktu',
  terlambat: 'Terlambat',
  'belum-absen': 'Belum absen',
  izin: 'Izin disetujui',
  'tidak-hadir': 'Tidak hadir',
  'non-working-day': 'Hari libur',
}

function formatDateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(date)
}

export function ParticipantAttendancePortal({ participants }) {
  const [code, setCode] = useState('')
  const [participant, setParticipant] = useState(null)
  const [records, setRecords] = useState(() => readAttendanceRecords())
  const [requests, setRequests] = useState(() => readLeaveRequests())
  const [leaveDate, setLeaveDate] = useState(formatLocalDate(new Date()))
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setRecords(readAttendanceRecords())
      setRequests(readLeaveRequests())
    }
    window.addEventListener('pintar-attendance-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('pintar-attendance-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const participantRecords = useMemo(() => records
    .filter((record) => record.participantIdentifier === getParticipantIdentifier(participant))
    .sort((left, right) => right.scannedAt.localeCompare(left.scannedAt)), [records, participant])
  const participantRequests = useMemo(() => requests
    .filter((request) => request.participantIdentifier === getParticipantIdentifier(participant))
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt)), [requests, participant])
  const summary = participant
    ? getParticipantAttendanceSummary(participant, records, requests)
    : null
  const todayStatus = participant
    ? getParticipantDayStatus(participant, records, requests)
    : null

  const findMyRecord = (event) => {
    event.preventDefault()
    const match = findParticipantByIdentifier(participants, code.trim())
    if (!match) {
      setParticipant(null)
      setFeedback({ kind: 'error', text: 'Kode peserta tidak ditemukan.' })
      return
    }
    setParticipant(match)
    setFeedback({ kind: 'success', text: `Data absensi ${match.name} ditampilkan.` })
  }

  const readEvidence = (event) => {
    const file = event.target.files?.[0]
    setEvidence('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setFeedback({ kind: 'error', text: 'Bukti harus berupa gambar JPG/PNG atau PDF.' })
      event.target.value = ''
      return
    }
    if (file.size > 1024 * 1024) {
      setFeedback({ kind: 'error', text: 'Ukuran bukti maksimal 1 MB untuk penyimpanan browser.' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => setEvidence(String(reader.result || ''))
    reader.onerror = () => setFeedback({ kind: 'error', text: 'Bukti gagal dibaca. Coba pilih file lain.' })
    reader.readAsDataURL(file)
  }

  const submitLeaveRequest = (event) => {
    event.preventDefault()
    if (!participant) return
    setIsSubmitting(true)
    const result = createLeaveRequest(participant, { date: leaveDate, reason, evidence })
    setIsSubmitting(false)

    if (!result.ok) {
      setFeedback({
        kind: 'error',
        text: result.reason === 'duplicate'
          ? 'Pengajuan untuk tanggal ini sudah ada dan belum ditolak.'
          : 'Pengajuan izin gagal disimpan. Periksa ruang penyimpanan browser.',
      })
      return
    }

    setRequests(readLeaveRequests())
    setReason('')
    setEvidence('')
    setFeedback({ kind: 'success', text: 'Pengajuan izin terkirim dan menunggu pemeriksaan admin.' })
  }

  return (
    <section className="page-shell max-w-5xl space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]"><CalendarCheck2 size={15} /> Portal peserta</div>
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#1f2830] sm:text-4xl">Riwayat & Izin Absensi</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#757c83]">Masukkan kode peserta untuk melihat riwayat, statistik, dan mengajukan izin.</p>
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-[#e8e5d6] bg-[#fffdf4] p-3 text-xs leading-5 text-[#6b6857]"><AlertCircle className="mt-0.5 shrink-0" size={15} />Prototipe lokal: kode peserta bukan autentikasi aman. Data hanya ada di browser/perangkat ini. Jangan unggah bukti sensitif.</p>
      </header>

      <form className="flex flex-col gap-2 rounded-xl border border-[#dde1e5] bg-white p-4 sm:flex-row" onSubmit={findMyRecord}>
        <label className="sr-only" htmlFor="participant-attendance-code">Kode peserta</label>
        <input autoComplete="off" className={fieldClass.replace('mt-1.5 ', '')} id="participant-attendance-code" onChange={(event) => setCode(event.target.value)} placeholder="Contoh: MAGANG-2026-001" required value={code} />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#222c35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#303e4c]" type="submit"><UserRound size={16} /> Tampilkan data</button>
      </form>

      {feedback && <p className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${feedback.kind === 'error' ? 'bg-[#fff1ed] text-[#a74636]' : 'bg-[#e3ebf3] text-[#24425f]'}`} role="status">{feedback.kind === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}{feedback.text}</p>}

      {participant && summary && (
        <>
          <section className="grid gap-4 rounded-xl border border-[#dde1e5] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Status hari ini', statusLabels[todayStatus] || todayStatus],
              ['Kehadiran', `${summary.attendedDays} hari`],
              ['Tepat waktu / terlambat', `${summary.onTime} / ${summary.late}`],
              ['Izin / persentase hadir', `${summary.leaveDays} / ${summary.attendancePercent}%`],
            ].map(([label, value]) => (
              <div className="rounded-lg bg-[#f5f8fa] p-4" key={label}>
                <p className="text-xs font-bold text-[#75808a]">{label}</p>
                <p className="mt-2 text-lg font-extrabold text-[#222c35]">{value}</p>
              </div>
            ))}
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="overflow-hidden rounded-xl border border-[#dde1e5] bg-white">
              <div className="border-b border-[#eceef0] px-4 py-4">
                <h2 className="flex items-center gap-2 font-extrabold text-[#222c35]"><Clock3 size={17} /> Riwayat absensi</h2>
                <p className="mt-1 text-xs text-[#838a91]">{participant.name} · {getParticipantIdentifier(participant)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f7f8f9] text-xs font-bold text-[#75808a]"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Jam WIB</th><th className="px-4 py-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-[#eceef0]">
                    {participantRecords.length ? participantRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="whitespace-nowrap px-4 py-3">{record.date}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDateTime(record.scannedAt)}</td>
                        <td className="px-4 py-3 font-bold">{statusLabels[record.status === 'on-time' ? 'hadir-tepat-waktu' : 'terlambat']}</td>
                      </tr>
                    )) : <tr><td className="px-4 py-8 text-center text-[#838a91]" colSpan={3}>Belum ada catatan absensi.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-[#dde1e5] bg-white p-4">
              <h2 className="flex items-center gap-2 font-extrabold text-[#222c35]"><FileText size={17} /> Ajukan izin</h2>
              <p className="mt-1 text-xs leading-5 text-[#838a91]">Permohonan masuk sebagai menunggu dan diproses admin.</p>
              <form className="mt-4 space-y-3" onSubmit={submitLeaveRequest}>
                <label className="block text-xs font-bold text-[#4c6277]">Tanggal izin<input className={fieldClass} min={formatLocalDate(new Date())} onChange={(event) => setLeaveDate(event.target.value)} required type="date" value={leaveDate} /></label>
                <label className="block text-xs font-bold text-[#4c6277]">Alasan<textarea className={`${fieldClass} min-h-24`} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Tuliskan alasan izin" required value={reason} /></label>
                <label className="block text-xs font-bold text-[#4c6277]">Bukti (opsional, JPG/PNG/PDF maks. 1 MB)<input accept="image/jpeg,image/png,application/pdf" className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#e3ebf3] file:px-3 file:py-2 file:text-xs file:font-bold`} onChange={readEvidence} type="file" /></label>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#222c35] px-4 py-3 text-sm font-bold text-white hover:bg-[#303e4c] disabled:opacity-60" disabled={isSubmitting} type="submit"><Send size={16} /> Kirim pengajuan</button>
              </form>
              <div className="mt-5 border-t border-[#eceef0] pt-4">
                <h3 className="text-sm font-extrabold text-[#303e4c]">Status pengajuan</h3>
                <div className="mt-2 space-y-2">
                  {participantRequests.length ? participantRequests.map((request) => (
                    <div className="rounded-lg bg-[#f7f8f9] p-3 text-xs" key={request.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-[#303e4c]">{request.date} · {request.reason}</strong>
                        <span className="rounded-full bg-white px-2 py-1 font-bold text-[#526a81]">{request.status === 'pending' ? 'Menunggu' : request.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>
                      </div>
                      {request.reviewNote && <p className="mt-1 text-[#75808a]">Catatan admin: {request.reviewNote}</p>}
                    </div>
                  )) : <p className="text-xs text-[#838a91]">Belum ada pengajuan izin.</p>}
                </div>
              </div>
            </section>
          </div>
          <p className="flex items-start gap-2 text-xs leading-5 text-[#838a91]"><MapPin className="mt-0.5 shrink-0" size={14} />Absensi menggunakan titik kantor ({ATTENDANCE_OFFICE.latitude}, {ATTENDANCE_OFFICE.longitude}) dengan radius {ATTENDANCE_OFFICE.radiusMeters} meter.</p>
        </>
      )}
    </section>
  )
}
