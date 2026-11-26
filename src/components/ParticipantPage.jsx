import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowUpFromLine, CalendarDays, ClipboardList, FileText, IdCard, LogOut, UserRound } from 'lucide-react'
import { IdCardPage } from './IdCardPage'
import {
  createLeaveRequest,
  formatLocalDate,
  getParticipantDayStatus,
  getParticipantIdentifier,
  readAttendanceRecords,
  readLeaveRequests,
} from './attendanceUtils'

const fieldClass = 'mt-1.5 w-full rounded-xl border border-[#dce4eb] bg-[#f9fbfc] px-3 py-3 text-sm text-[#20354a] outline-none focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20'

function formatClock(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '--:-- WIB'
    : `${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(date)} WIB`
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date)
}

function statusLabel(status) {
  return ({
    'hadir-tepat-waktu': 'Hadir',
    terlambat: 'Terlambat',
    'belum-absen': 'Belum Absen',
    izin: 'Izin',
    sakit: 'Sakit',
    'tidak-hadir': 'Tidak hadir',
    'non-working-day': 'Hari libur',
  })[status] || status
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <header className="mb-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#497aa2]">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[#183b5b]">{title}</h2>
      {description && <p className="mt-1 text-sm leading-5 text-[#718293]">{description}</p>}
    </header>
  )
}

export function ParticipantPage({ participant, onLogout }) {
  const [activeTab, setActiveTab] = useState('beranda')
  const [activePanel, setActivePanel] = useState('home')
  const [records, setRecords] = useState(() => readAttendanceRecords())
  const [requests, setRequests] = useState(() => readLeaveRequests())
  const [leaveType, setLeaveType] = useState('izin')
  const [startDate, setStartDate] = useState(formatLocalDate(new Date()))
  const [endDate, setEndDate] = useState(formatLocalDate(new Date()))
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState('')
  const [feedback, setFeedback] = useState('')

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

  const identifier = getParticipantIdentifier(participant)
  const myRecords = useMemo(() => records
    .filter((record) => record.participantIdentifier === identifier)
    .sort((left, right) => right.date.localeCompare(left.date)), [records, identifier])
  const myRequests = useMemo(() => requests
    .filter((request) => request.participantIdentifier === identifier)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt)), [requests, identifier])
  const today = formatLocalDate(new Date())
  const todayRecord = myRecords.find((record) => record.date === today)
  const todayStatus = getParticipantDayStatus(participant, records, requests)
  const countType = (type) => myRequests.filter((request) => (request.type || 'izin') === type).length
  const attendanceCounts = {
    hadir: new Set(myRecords.filter((record) => record.status === 'on-time').map((record) => record.date)).size,
    terlambat: new Set(myRecords.filter((record) => record.status !== 'on-time').map((record) => record.date)).size,
    izin: countType('izin'),
    sakit: countType('sakit'),
  }

  const readEvidence = (event) => {
    const file = event.target.files?.[0]
    setEvidence('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setFeedback('Lampiran harus berupa gambar JPG/PNG atau PDF.')
      event.target.value = ''
      return
    }
    if (file.size > 1024 * 1024) {
      setFeedback('Ukuran lampiran maksimal 1 MB untuk penyimpanan browser.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => setEvidence(String(reader.result || ''))
    reader.onerror = () => setFeedback('Lampiran gagal dibaca. Silakan pilih file lain.')
    reader.readAsDataURL(file)
  }

  const submitLeaveRequest = (event) => {
    event.preventDefault()
    const result = createLeaveRequest(participant, {
      type: leaveType,
      date: startDate,
      endDate,
      reason,
      evidence,
    })
    if (!result.ok) {
      setFeedback(result.reason === 'duplicate'
        ? 'Sudah ada pengajuan yang belum ditolak untuk rentang tanggal ini.'
        : 'Pengajuan gagal disimpan. Periksa tanggal dan ruang penyimpanan browser.')
      return
    }
    setRequests(readLeaveRequests())
    setReason('')
    setEvidence('')
    setFeedback('Pengajuan terkirim dengan status Menunggu.')
  }

  const selectTab = (tab) => {
    setActiveTab(tab)
    setActivePanel(tab === 'id-card' ? 'id-card' : tab === 'profil' ? 'profile' : 'home')
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#f3f7fa] pb-24">
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-5 sm:px-6 sm:pt-8">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#10385d] via-[#174c79] to-[#397da8] p-5 text-white shadow-[0_18px_40px_rgba(27,65,96,0.18)] sm:p-7">
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[28px] border-white/[0.07]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img alt="Logo Pelindo" className="h-10 w-auto rounded-lg bg-white px-3 py-2 object-contain" src="/pelindo-logo.png" />
              <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-extrabold tracking-[0.15em]">PINTAR</span>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20" onClick={onLogout} type="button"><LogOut size={14} /> Keluar</button>
          </div>
          <div className="relative z-10 mt-8">
            <p className="text-sm font-medium text-white/75">Selamat Datang,</p>
            <h1 className="mt-1 break-words text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{participant.name || 'Peserta Magang'}</h1>
            <p className="mt-2 text-sm font-semibold text-white/80">{participant.division || 'Bagian belum tersedia'}</p>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/85">
            <span className="rounded-full bg-white/10 px-3 py-1.5">{participant.participantCode || 'Kode peserta tidak tersedia'}</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">{formatDate(today)}</span>
          </div>
        </section>

        {activePanel === 'home' && (
          <div className="mt-6 space-y-6">
            <section>
              <SectionTitle eyebrow="Ringkasan hari ini" title="Kehadiran" description="Jam ditampilkan menurut waktu WIB." />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#758697]"><ArrowDownToLine size={15} /> JAM MASUK</div>
                  <p className="mt-3 text-2xl font-extrabold text-[#183b5b]">{todayRecord ? formatClock(todayRecord.scannedAt) : '--:-- WIB'}</p>
                </div>
                <div className="rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#758697]"><ArrowUpFromLine size={15} /> JAM PULANG</div>
                  <p className="mt-3 text-2xl font-extrabold text-[#183b5b]">--:-- WIB</p>
                  <p className="mt-1 text-[11px] text-[#8794a0]">Pencatatan jam pulang belum tersedia di sistem saat ini.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#dce5ec] bg-white px-4 py-3 shadow-sm">
                <span className="text-sm font-bold text-[#546c80]">Status kehadiran hari ini</span>
                <span className="rounded-full bg-[#e8f1f8] px-3 py-1.5 text-xs font-extrabold text-[#2c5e85]">{statusLabel(todayStatus)}</span>
              </div>
            </section>

            <section>
              <SectionTitle eyebrow="Layanan peserta" title="Menu utama" description="Akses riwayat, pengajuan, dan data akun kamu." />
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'history', label: 'Riwayat', description: 'Absensi dan rekap', icon: ClipboardList },
                  { id: 'leave', label: 'Ajukan izin / sakit', description: 'Kirim permohonan', icon: FileText },
                  { id: 'leave-history', label: 'Riwayat izin & sakit', description: `${myRequests.length} pengajuan`, icon: CalendarDays },
                ].map(({ id, label, description, icon: Icon }) => (
                  <button className="flex items-center gap-3 rounded-2xl border border-[#dce5ec] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bbad2]" key={id} onClick={() => setActivePanel(id)} type="button">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f1f8] text-[#2c5e85]"><Icon size={20} /></span>
                    <span><strong className="block text-sm text-[#27445d]">{label}</strong><span className="mt-1 block text-xs text-[#82909c]">{description}</span></span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activePanel === 'history' && (
          <section className="mt-6">
            <SectionTitle eyebrow="Aktivitas kamu" title="Riwayat kehadiran" description="Angka dihitung dari catatan absensi dan pengajuan yang tersimpan." />
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Hadir', attendanceCounts.hadir],
                ['Terlambat', attendanceCounts.terlambat],
                ['Izin', attendanceCounts.izin],
                ['Sakit', attendanceCounts.sakit],
              ].map(([label, count]) => <div className="rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm" key={label}><p className="text-xs font-bold text-[#758697]">{label}</p><p className="mt-1 text-2xl font-extrabold text-[#183b5b]">{count}</p></div>)}
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#dce5ec] bg-white">
              <div className="border-b border-[#eaf0f4] px-4 py-4"><h3 className="font-extrabold text-[#27445d]">Catatan absensi</h3></div>
              <div className="divide-y divide-[#edf1f4]">
                {myRecords.length ? myRecords.map((record) => (
                  <div className="flex items-center justify-between gap-4 px-4 py-4" key={record.id}>
                    <div><p className="text-sm font-bold text-[#344e64]">{formatDate(record.date)}</p><p className="mt-1 text-xs text-[#84919b]">Masuk · {formatClock(record.scannedAt)}</p></div>
                    <span className="rounded-full bg-[#e8f1f8] px-3 py-1.5 text-xs font-bold text-[#2c5e85]">{statusLabel(record.status === 'on-time' ? 'hadir-tepat-waktu' : 'terlambat')}</span>
                  </div>
                )) : <p className="px-4 py-9 text-center text-sm text-[#8794a0]">Belum ada data absensi.</p>}
              </div>
            </div>
          </section>
        )}

        {activePanel === 'leave' && (
          <section className="mt-6">
            <SectionTitle eyebrow="Permohonan" title="Ajukan izin atau sakit" description="Pengajuan akan berstatus Menunggu sampai diperiksa Admin." />
            <form className="space-y-4 rounded-2xl border border-[#dce5ec] bg-white p-4 shadow-sm sm:p-6" onSubmit={submitLeaveRequest}>
              <label className="block text-sm font-bold text-[#405a70]">Jenis
                <select className={fieldClass} onChange={(event) => setLeaveType(event.target.value)} value={leaveType}><option value="izin">Izin</option><option value="sakit">Sakit</option></select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-[#405a70]">Tanggal mulai
                  <input className={fieldClass} min={today} onChange={(event) => { setStartDate(event.target.value); if (endDate < event.target.value) setEndDate(event.target.value) }} required type="date" value={startDate} />
                </label>
                <label className="block text-sm font-bold text-[#405a70]">Tanggal selesai
                  <input className={fieldClass} min={startDate} onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} />
                </label>
              </div>
              <label className="block text-sm font-bold text-[#405a70]">Alasan
                <textarea className={`${fieldClass} min-h-28 resize-y`} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Jelaskan alasan pengajuan" required value={reason} />
              </label>
              <label className="block text-sm font-bold text-[#405a70]">Lampiran (opsional, JPG/PNG/PDF maks. 1 MB)
                <input accept="image/jpeg,image/png,application/pdf" className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#e8f1f8] file:px-3 file:py-2 file:text-xs file:font-bold`} onChange={readEvidence} type="file" />
              </label>
              {feedback && <p className="rounded-xl bg-[#edf5fa] px-3 py-2.5 text-sm font-semibold text-[#2c5e85]" role="status">{feedback}</p>}
              <button className="w-full rounded-xl bg-[#173f64] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#24567f]" type="submit">Kirim pengajuan</button>
            </form>
          </section>
        )}

        {activePanel === 'leave-history' && (
          <section className="mt-6">
            <SectionTitle eyebrow="Pengajuan kamu" title="Riwayat izin dan sakit" description={`Izin: ${attendanceCounts.izin} · Sakit: ${attendanceCounts.sakit}`} />
            <div className="divide-y divide-[#edf1f4] overflow-hidden rounded-2xl border border-[#dce5ec] bg-white">
              {myRequests.length ? myRequests.map((request) => (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4" key={request.id}>
                  <div><p className="text-sm font-bold text-[#344e64]">{formatDate(request.date)}{request.endDate && request.endDate !== request.date ? ` – ${formatDate(request.endDate)}` : ''}</p><p className="mt-1 text-xs font-semibold capitalize text-[#738596]">{request.type || 'izin'} · {request.reason}</p></div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${request.status === 'approved' ? 'bg-[#e8f5ed] text-[#33704e]' : request.status === 'rejected' ? 'bg-[#fff1ed] text-[#a74636]' : 'bg-[#fff7df] text-[#8a6a20]'}`}>{request.status === 'approved' ? 'Disetujui' : request.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</span>
                </div>
              )) : <p className="px-4 py-9 text-center text-sm text-[#8794a0]">Belum ada pengajuan izin atau sakit.</p>}
            </div>
          </section>
        )}

        {activePanel === 'id-card' && <div className="mt-5"><IdCardPage onBack={() => selectTab('beranda')} onFinish={() => selectTab('beranda')} participant={participant} /></div>}

        {activePanel === 'profile' && (
          <section className="mt-6">
            <SectionTitle eyebrow="Akun peserta" title="Profil saya" description="Informasi profil berasal dari data peserta yang terdaftar." />
            <div className="overflow-hidden rounded-2xl border border-[#dce5ec] bg-white shadow-sm">
              <div className="flex items-center gap-4 bg-[#eaf2f8] p-5">
                {participant.photo ? <img alt={`Foto ${participant.name}`} className="h-16 w-16 rounded-2xl object-cover" src={participant.photo} /> : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#2c5e85]"><UserRound size={28} /></span>}
                <div className="min-w-0"><h3 className="break-words text-lg font-extrabold text-[#183b5b]">{participant.name}</h3><p className="text-sm text-[#60788c]">{participant.email || '-'}</p></div>
              </div>
              <dl className="grid gap-px bg-[#edf1f4] sm:grid-cols-2">
                {[
                  ['Nomor WhatsApp', participant.phone],
                  ['Institusi', participant.institution],
                  ['Jenjang pendidikan', participant.education],
                  ['Program studi', participant.major],
                  ['Semester / tingkat', participant.semester || participant.grade],
                  ['Kelas', participant.className || participant.class],
                  ['Bagian', participant.division],
                  ['Tanggal mulai magang', participant.startDate],
                  ['Tanggal selesai magang', participant.endDate],
                  ['Kode peserta', participant.participantCode],
                ].map(([label, value]) => <div className="bg-white px-4 py-3.5" key={label}><dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#84919b]">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-[#344e64]">{value || '-'}</dd></div>)}
              </dl>
            </div>
          </section>
        )}
      </div>

      <nav aria-label="Navigasi peserta" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dce4eb] bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(27,56,82,0.08)] backdrop-blur-md">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {[
            ['beranda', 'Beranda', Activity],
            ['id-card', 'ID Card', IdCard],
            ['profil', 'Profil', UserRound],
          ].map(([tab, label, Icon]) => (
            <button aria-current={activeTab === tab ? 'page' : undefined} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold ${activeTab === tab ? 'text-[#24567f]' : 'text-[#84919b]'}`} key={tab} onClick={() => selectTab(tab)} type="button"><Icon size={19} />{label}</button>
          ))}
        </div>
      </nav>
    </div>
  )
}
