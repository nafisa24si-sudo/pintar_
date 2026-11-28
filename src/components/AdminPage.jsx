import { useEffect, useMemo, useState } from 'react'
import { Activity, Award, ArrowLeft, ArrowRight, BadgeCheck, CalendarClock, CalendarDays, ClipboardCheck, Clock3, Download, FileText, IdCard, LayoutDashboard, LogOut, Pencil, Search, Sparkles, TrendingUp, Users, X } from 'lucide-react'
import { CertificateDirectory } from './CertificateDirectory'
import { CertificatePage } from './CertificatePage'
import { isCertificateAvailable } from './certificateUtils'
import {
  formatLocalDate,
  getParticipantAttendanceSummary,
  getParticipantDayStatus,
  getParticipantIdentifier,
  readAttendanceRecords,
  readLeaveRequests,
  reviewLeaveRequest,
} from './attendanceUtils'
import { createParticipantReportXlsx } from './participantReportUtils'
import { IdCardFrame } from './IdCardPage'

export function AdminPage({ participants, onBack, onOpenParticipants, onUpdateParticipant, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedCardId, setSelectedCardId] = useState(participants[0]?.id ?? null)
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState('Semua Periode')
  const [divisionFilter, setDivisionFilter] = useState('Semua Divisi')
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [printCertificateOnOpen, setPrintCertificateOnOpen] = useState(false)
  const [reportYear, setReportYear] = useState('Semua Tahun')
  const [reportExportError, setReportExportError] = useState('')
  const [cardModalParticipant, setCardModalParticipant] = useState(null)
  const [editingParticipant, setEditingParticipant] = useState(null)
  const [editData, setEditData] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState(() => readAttendanceRecords())
  const [leaveRequests, setLeaveRequests] = useState(() => readLeaveRequests())
  const [reportsTab, setReportsTab] = useState('participants')
  const [rekapYear, setRekapYear] = useState(String(new Date().getFullYear()))
  const [rekapMonth, setRekapMonth] = useState(String(new Date().getMonth()))
  const [selectedAttendanceParticipantId, setSelectedAttendanceParticipantId] = useState(null)

  useEffect(() => {
    const refreshAttendance = () => {
      setAttendanceRecords(readAttendanceRecords())
      setLeaveRequests(readLeaveRequests())
    }
    window.addEventListener('pintar-attendance-updated', refreshAttendance)
    window.addEventListener('storage', refreshAttendance)
    return () => {
      window.removeEventListener('pintar-attendance-updated', refreshAttendance)
      window.removeEventListener('storage', refreshAttendance)
    }
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'participants', label: 'Data Peserta', icon: Users },
    { id: 'certificates', label: 'Kelola Sertifikat', icon: Award },
    { id: 'id-card', label: 'Kelola ID Card', icon: IdCard },
    { id: 'attendance', label: 'Absensi', icon: ClipboardCheck },
    { id: 'reports', label: 'Rekap', icon: FileText },
  ]

  const parseDate = (value) => {
    if (!value) return null
    const date = new Date(`${value}T12:00:00`)
    if (Number.isNaN(date.getTime())) return null
    return date
  }

  const isActiveParticipant = (participant) => {
    const startDate = parseDate(participant.startDate)
    const endDate = parseDate(participant.endDate)
    if (!startDate || !endDate) return false
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return startDate <= today && today < endDate
  }

  const isCompletedParticipant = (participant) => isCertificateAvailable(participant)

  const totalParticipants = participants.length
  const activeParticipants = participants.filter(isActiveParticipant)
  const completedParticipants = participants.filter(isCompletedParticipant)
  const idCardAvailable = participants.filter((participant) => participant.participantCode || participant.photo).length
  const idCardUnavailable = Math.max(totalParticipants - idCardAvailable, 0)
  const todayDate = formatLocalDate(new Date())
  const todayAttendance = attendanceRecords.filter((record) => record.date === todayDate)
  const activeIdentifiers = new Set(activeParticipants.map(getParticipantIdentifier))
  const todayActiveRecords = todayAttendance.filter((record) => activeIdentifiers.has(record.participantIdentifier))
  const todayApprovedRequests = leaveRequests.filter((request) => (
    request.date <= todayDate
    && (request.endDate || request.date) >= todayDate
    && request.status === 'approved'
    && activeIdentifiers.has(request.participantIdentifier)
  ))
  const todayApprovedLeave = todayApprovedRequests.filter((request) => request.type !== 'sakit')
  const todayApprovedSick = todayApprovedRequests.filter((request) => request.type === 'sakit')
  const todayStatuses = activeParticipants.map((participant) => ({
    participant,
    status: getParticipantDayStatus(participant, attendanceRecords, leaveRequests),
  }))
  const todayOnTime = todayActiveRecords.filter((record) => record.status === 'on-time').length
  const todayLate = todayStatuses.filter(({ status }) => status === 'terlambat').length
  const todayNotCheckedIn = todayStatuses.filter(({ status }) => status === 'belum-absen').length

  const weeklyAttendance = useMemo(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setHours(12, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return Array.from({ length: 5 }, (_, index) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + index)
      const date = formatLocalDate(day)
      const count = attendanceRecords.filter((record) => record.date === date).length
      return {
        date,
        label: new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' }).format(day),
        count,
      }
    })
  }, [attendanceRecords])

  const disciplineLeaders = useMemo(() => participants
    .map((participant) => ({
      participant,
      ...getParticipantAttendanceSummary(participant, attendanceRecords, leaveRequests),
    }))
    .filter((entry) => entry.attendedDays > 0)
    .sort((left, right) => right.attendancePercent - left.attendancePercent || right.attendedDays - left.attendedDays)
    .slice(0, 3), [participants, attendanceRecords, leaveRequests])
  const maxWeeklyAttendance = Math.max(1, ...weeklyAttendance.map((day) => day.count))

  const activePeriods = useMemo(() => {
    const periodsMap = new Map()

    participants.forEach((participant) => {
      if (!participant.startDate || !participant.endDate || !isActiveParticipant(participant)) return
      const key = `${participant.startDate}__${participant.endDate}`
      const current = periodsMap.get(key) || { startDate: participant.startDate, endDate: participant.endDate, count: 0 }
      periodsMap.set(key, { ...current, count: current.count + 1 })
    })

    return [...periodsMap.values()].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  }, [participants])

  const divisionStats = useMemo(() => {
    const counts = new Map()

    participants.forEach((participant) => {
      const division = participant.division?.trim()
      if (!division) return
      counts.set(division, (counts.get(division) || 0) + 1)
    })

    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [participants])

  const maxDivisionCount = divisionStats.length ? Math.max(...divisionStats.map(([, count]) => count)) : 1

  const upcomingEndings = useMemo(() => {
    const today = new Date()

    return participants
      .filter((participant) => participant.endDate && !isCompletedParticipant(participant))
      .map((participant) => {
        const endDate = parseDate(participant.endDate)
        const diffMs = endDate.getTime() - today.getTime()
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        return { ...participant, daysLeft }
      })
      .filter((participant) => participant.daysLeft >= 0 && participant.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }, [participants])

  const recentParticipants = useMemo(() => [...participants].reverse().slice(0, 5), [participants])
  const idCardProgress = totalParticipants > 0 ? Math.round((idCardAvailable / totalParticipants) * 100) : 0

  // ── Rekap Absensi ─────────────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set()
    attendanceRecords.forEach((r) => { if (r.date) years.add(r.date.slice(0, 4)) })
    leaveRequests.forEach((r) => { if (r.date) years.add(r.date.slice(0, 4)) })
    if (!years.size) years.add(String(new Date().getFullYear()))
    return [...years].sort((a, b) => Number(b) - Number(a))
  }, [attendanceRecords, leaveRequests])

  const monthlyAttendance = useMemo(() => {
    const year = Number(rekapYear)
    const month = Number(rekapMonth)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = formatLocalDate(new Date())

    // Build list of weekday dates in this month
    const weekdays = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const dow = date.getDay()
      if (dow !== 0 && dow !== 6) {
        weekdays.push({
          day: d,
          key: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          dow,
        })
      }
    }

    return participants.map((participant) => {
      const identifier = getParticipantIdentifier(participant)
      const dayMap = {}

      attendanceRecords
        .filter((r) => r.participantIdentifier === identifier && r.type === 'check-in')
        .forEach((r) => {
          const d = new Date(`${r.date}T12:00:00`)
          if (d.getFullYear() === year && d.getMonth() === month) {
            dayMap[r.date] = r.status === 'on-time' ? 'hadir' : 'terlambat'
          }
        })

      leaveRequests
        .filter((r) => r.participantIdentifier === identifier && r.status === 'approved')
        .forEach((r) => {
          const start = new Date(`${r.date}T12:00:00`)
          const end = new Date(`${r.endDate || r.date}T12:00:00`)
          for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
            const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
            if (cursor.getFullYear() === year && cursor.getMonth() === month && !dayMap[key]) {
              dayMap[key] = r.type === 'sakit' ? 'sakit' : 'izin'
            }
          }
        })

      let hadir = 0; let terlambat = 0; let izin = 0; let sakit = 0; let absen = 0
      weekdays.forEach(({ key }) => {
        const status = dayMap[key]
        if (status === 'hadir') hadir++
        else if (status === 'terlambat') terlambat++
        else if (status === 'izin') izin++
        else if (status === 'sakit') sakit++
        else if (key <= today) absen++
      })

      return { participant, hadir, terlambat, izin, sakit, absen, dayMap, weekdays }
    })
  }, [participants, attendanceRecords, leaveRequests, rekapYear, rekapMonth])

  const selectedAttendanceEntry = monthlyAttendance.find(({ participant }) => (
    participant.id === selectedAttendanceParticipantId
  )) || null

  const openAttendanceDetail = (participant) => {
    setSelectedAttendanceParticipantId(participant.id)
  }

  const openAttendanceDetailAndExport = (participant) => {
    setSelectedAttendanceParticipantId(participant.id)
    window.setTimeout(() => window.print(), 250)
  }

  const exportAttendancePdf = () => {
    window.setTimeout(() => window.print(), 150)
  }

  const uniquePeriods = useMemo(() => {
    const periods = participants
      .filter((participant) => participant.startDate || participant.endDate)
      .map((participant) => `${participant.startDate || '-'} - ${participant.endDate || '-'}`)
    return ['Semua Periode', ...Array.from(new Set(periods))]
  }, [participants])

  const uniqueDivisions = useMemo(() => {
    const divisions = participants.map((participant) => participant.division).filter(Boolean)
    return ['Semua Divisi', ...Array.from(new Set(divisions))]
  }, [participants])

  const filteredParticipants = useMemo(() => participants.filter((participant) => {
    const matchesSearch = !searchQuery || participant.name?.toLowerCase().includes(searchQuery.toLowerCase()) || participant.institution?.toLowerCase().includes(searchQuery.toLowerCase())
    const participantPeriod = `${participant.startDate || '-'} - ${participant.endDate || '-'}`
    const matchesPeriod = periodFilter === 'Semua Periode' || participantPeriod === periodFilter
    const matchesDivision = divisionFilter === 'Semua Divisi' || participant.division === divisionFilter
    return matchesSearch && matchesPeriod && matchesDivision
  }), [participants, searchQuery, periodFilter, divisionFilter])

  const selectedParticipant = filteredParticipants.find((participant) => participant.id === selectedCardId) || filteredParticipants[0] || participants[0] || null
  const annualReportRows = useMemo(() => {
    const counts = new Map()
    participants.forEach((participant) => {
      const year = /^\d{4}$/.test(participant.startDate?.slice(0, 4) || '') ? participant.startDate.slice(0, 4) : 'Tidak diketahui'
      counts.set(year, (counts.get(year) || 0) + 1)
    })
    return [...counts.entries()].sort(([left], [right]) => {
      if (left === 'Tidak diketahui') return 1
      if (right === 'Tidak diketahui') return -1
      return Number(right) - Number(left)
    })
  }, [participants])
  const reportYears = annualReportRows.map(([year]) => year)
  const reportedParticipants = useMemo(() => participants
    .filter((participant) => {
      if (reportYear === 'Semua Tahun') return true
      const year = /^\d{4}$/.test(participant.startDate?.slice(0, 4) || '') ? participant.startDate.slice(0, 4) : 'Tidak diketahui'
      return year === reportYear
    })
    .sort((left, right) => (left.startDate || '').localeCompare(right.startDate || '') || (left.name || '').localeCompare(right.name || '')), [participants, reportYear])

  const exportParticipantReport = () => {
    try {
      const yearsToExport = reportYear === 'Semua Tahun'
        ? annualReportRows
        : annualReportRows.filter(([year]) => year === reportYear)
      const sheets = [
        {
          name: 'Ringkasan Tahunan',
          rows: [['Tahun Mulai Magang', 'Jumlah Peserta'], ...annualReportRows],
          columnWidths: [24, 20],
        },
        ...yearsToExport.map(([year]) => {
          const yearlyParticipants = reportedParticipants.filter((participant) => {
            const participantYear = /^\d{4}$/.test(participant.startDate?.slice(0, 4) || '') ? participant.startDate.slice(0, 4) : 'Tidak diketahui'
            return participantYear === year
          })
          const yearLabel = year === 'Tidak diketahui' ? 'tanpa tahun' : year

          return {
            name: year === 'Tidak diketahui' ? 'Tanpa Tahun' : year,
            rows: [
              [`Data Peserta Magang Tahun ${yearLabel}`],
              ['Nama Lengkap', 'Asal Sekolah / Kampus', 'Jenjang Pendidikan', 'NIM / NISN', 'Jurusan / Program Studi', 'Divisi Magang', 'Email', 'Nomor Telepon', 'Tanggal Mulai', 'Tanggal Akhir', 'Kode Peserta'],
              ...yearlyParticipants.map((participant) => [
                participant.name || '',
                participant.institution || '',
                participant.education || '',
                participant.studentNumber || '',
                participant.major || '',
                participant.division || '',
                participant.email || '',
                participant.phone || '',
                participant.startDate || '',
                participant.endDate || '',
                participant.participantCode || '',
              ]),
            ],
            columnWidths: [28, 32, 22, 20, 32, 24, 32, 20, 18, 18, 22],
          }
        }),
      ]
      const workbook = createParticipantReportXlsx(sheets)
      const blob = new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const downloadUrl = URL.createObjectURL(blob)
      const downloadLink = document.createElement('a')
      downloadLink.href = downloadUrl
      downloadLink.download = `laporan-peserta-magang-${reportYear === 'Semua Tahun' ? 'semua-tahun' : reportYear}.xlsx`
      document.body.append(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      setReportExportError('')
    } catch (error) {
      setReportExportError(`Ekspor laporan gagal: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleSelectCard = (participantId) => setSelectedCardId(participantId)
  const openCardModal = (participant) => {
    setSelectedCardId(participant.id)
    setCardModalParticipant(participant)
  }
  const openEditModal = (participant) => {
    setCardModalParticipant(null)
    setEditingParticipant(participant)
    setEditData({ ...participant })
  }
  const updateEditField = (event) => {
    const { name, value } = event.target
    setEditData((current) => ({ ...current, [name]: value }))
  }
  const updateEditPhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) return
    const reader = new FileReader()
    reader.onload = () => setEditData((current) => ({ ...current, photo: String(reader.result) }))
    reader.readAsDataURL(file)
  }
  const saveParticipantEdit = (event) => {
    event.preventDefault()
    if (!editData) return
    onUpdateParticipant(editData)
    setCardModalParticipant(editData)
    setEditingParticipant(null)
    setEditData(null)
  }
  const activeMenu = menuItems.find((item) => item.id === activeSection) || menuItems[0]
  const ActiveIcon = activeMenu.icon

  const selectSection = (sectionId) => {
    if (sectionId === 'participants') {
      onOpenParticipants()
      return
    }
    setActiveSection(sectionId)
  }

  return (
    <section className="admin-glass page-shell grid max-w-7xl gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-[#dbdfe3] bg-white p-3 shadow-[0_12px_30px_rgba(36,51,45,0.05)]">
        <div className="mb-4 flex items-center justify-between px-3 pt-2 lg:block">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]">PELINDO</p>
            <p className="mt-1 text-sm font-extrabold text-[#222c35]">Menu admin</p>
          </div>
          <button aria-label="Keluar dari admin" className="rounded-lg p-2 text-[#838a91] transition hover:bg-[#fff1ed] hover:text-[#b34d3b] lg:hidden" onClick={onLogout} type="button"><X size={17} /></button>
        </div>

        <nav className="grid gap-1" aria-label="Navigasi admin">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeSection === id ? 'bg-[#dbe7f3] text-[#2d4f70]' : 'text-[#556d84] hover:bg-[#f9fbfc] hover:text-[#222c35]'}`}
              key={id}
              onClick={() => selectSection(id)}
              type="button"
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <button className="mt-5 hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-[#556d84] transition hover:bg-[#fff1ed] hover:text-[#b34d3b] lg:flex" onClick={onLogout} type="button">
          <LogOut size={17} />
          Keluar
        </button>
      </aside>

      <div className="min-w-0">
        <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#737a81] transition hover:text-[#222c35]" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Kembali ke beranda
        </button>

        {activeSection === 'dashboard' && (
          <>
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]"><Sparkles size={14} /> Dashboard</div>
                <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f2830] sm:text-5xl">Dashboard</h1>
                <p className="mt-3 max-w-2xl text-base text-[#757c83]">Pantau data dan aktivitas peserta magang secara ringkas.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7dde2] bg-white px-3 py-2 text-xs font-bold text-[#556d84] shadow-[0_8px_18px_rgba(36,51,45,0.04)]"><span className="h-2 w-2 rounded-full bg-[#659fd8] shadow-[0_0_0_4px_#c0d7ed]" /> Admin aktif</span>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total Peserta', value: totalParticipants, detail: 'Seluruh peserta terdata', tone: 'border-[#cbd7e3] bg-[#eaf1f7]', icon: Users, accent: 'text-[#2d4f70]', valueColor: 'text-[#27323c]' },
                { label: 'Peserta Aktif', value: activeParticipants.length, detail: 'Sedang menjalani magang', tone: 'border-[#dde1e5] bg-[#ffffff]', icon: Activity, accent: 'text-[#2e5c66]', valueColor: 'text-[#222c35]' },
                { label: 'Peserta Selesai', value: completedParticipants.length, detail: 'Masa magang berakhir', tone: 'border-[#dde3e8] bg-[#fffdf8]', icon: BadgeCheck, accent: 'text-[#3b5e81]', valueColor: 'text-[#222c35]' },
                { label: 'ID Card', value: idCardAvailable, detail: `${idCardUnavailable} belum siap`, tone: 'border-[#dde1e5] bg-[#ecf0f4]', icon: IdCard, accent: 'text-[#425568]', valueColor: 'text-[#202931]' },
              ].map(({ label, value, detail, tone, icon: Icon, accent, valueColor }, index) => (
                <div className={`dashboard-card group rounded-2xl border p-5 shadow-[0_10px_22px_rgba(36,51,45,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(36,51,45,0.08)] ${tone}`} key={label} style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#4c6277]">{label}</span>
                    <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white/80 ${accent}`}><Icon size={18} /></span>
                  </div>
                  <strong className={`block text-4xl font-extrabold tracking-[-0.05em] ${valueColor}`}>{value}</strong>
                  <span className="mt-2 block text-sm text-[#59728c]">{detail}</span>
                </div>
              ))}
            </div>

            <section className="mb-8 rounded-2xl border border-[#dde1e5] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Kedisiplinan · {todayDate}</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#1f2830]">Kehadiran Hari Ini</h2>
                </div>
                <button className="inline-flex items-center gap-2 self-start rounded-lg bg-[#222c35] px-3 py-2 text-xs font-bold text-white hover:bg-[#303e4c] sm:self-auto" onClick={() => setActiveSection('attendance')} type="button">Kelola absensi <ArrowRight size={14} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['Total peserta', totalParticipants, 'Seluruh peserta terdata'],
                  ['Hadir hari ini', todayActiveRecords.length, `${todayOnTime} tepat waktu`],
                  ['Terlambat', todayLate, 'Termasuk yang belum absen lewat batas'],
                  ['Izin', todayApprovedLeave.length, 'Izin disetujui admin'],
                  ['Sakit', todayApprovedSick.length, 'Sakit disetujui admin'],
                  ['Belum absen', todayNotCheckedIn, 'Belum ada catatan hari ini'],
                ].map(([label, value, detail]) => (
                  <div className="rounded-xl border border-[#e4e8eb] bg-[#f9fbfc] p-4" key={label}>
                    <p className="text-xs font-bold text-[#75808a]">{label}</p>
                    <strong className="mt-2 block text-3xl font-extrabold text-[#222c35]">{value}</strong>
                    <p className="mt-1 text-[11px] text-[#838a91]">{detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-[#eceef0] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#303e4c]"><TrendingUp size={16} /> Kehadiran Mingguan</h3>
                  <div className="mt-4 grid grid-cols-5 items-end gap-3">
                    {weeklyAttendance.map((day) => (
                      <div className="text-center" key={day.date}>
                        <p className="mb-2 text-xs font-bold text-[#526a81]">{day.count}</p>
                        <div className="mx-auto flex h-24 w-full max-w-12 items-end overflow-hidden rounded-t-md bg-[#eef2f5]">
                          <div className="w-full rounded-t-md bg-[#5c8ab7] transition-[height]" style={{ height: `${Math.max((day.count / maxWeeklyAttendance) * 100, day.count ? 8 : 0)}%` }} />
                        </div>
                        <p className="mt-2 text-[11px] font-bold capitalize text-[#75808a]">{day.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-[#838a91]">Jumlah peserta yang tercatat hadir per hari, berdasarkan data lokal browser ini.</p>
                </div>
                <div className="rounded-xl border border-[#eceef0] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#303e4c]"><Award size={16} /> Peserta paling disiplin</h3>
                  <p className="mt-1 text-[11px] text-[#838a91]">Informasi positif berdasarkan persentase kehadiran selama periode magang.</p>
                  <div className="mt-3 divide-y divide-[#eceef0]">
                    {disciplineLeaders.length ? disciplineLeaders.map(({ participant, attendancePercent, attendedDays }, index) => (
                      <div className="flex items-center justify-between gap-3 py-3" key={getParticipantIdentifier(participant)}>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e3ebf3] text-xs font-black text-[#2f5a84]">{index + 1}</span>
                          <div className="min-w-0"><p className="truncate text-sm font-bold text-[#303e4c]">{participant.name || getParticipantIdentifier(participant)}</p><p className="text-[11px] text-[#838a91]">{attendedDays} hari hadir</p></div>
                        </div>
                        <strong className="shrink-0 text-sm text-[#2f5a84]">{attendancePercent}%</strong>
                      </div>
                    )) : <p className="py-5 text-xs text-[#838a91]">Belum ada data untuk menampilkan rekap.</p>}
                  </div>
                </div>
              </div>
            </section>

            <div className="mb-8 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-[#dde1e5] bg-[#fffdf8] p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Periode aktif</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f2830]">Periode Magang Aktif</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3ebf3] text-[#2f5a84]"><CalendarDays size={18} /></span>
                </div>

                {activePeriods.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#c8d0d7] bg-white/70 px-4 py-6 text-sm text-[#737a81]">Belum ada periode magang yang sedang berjalan.</div>
                ) : (
                  <div className="space-y-4">
                    {activePeriods.map((period) => (
                      <div className="rounded-2xl border border-[#dce1e5] bg-white p-4 shadow-[0_8px_18px_rgba(36,51,45,0.03)]" key={`${period.startDate}-${period.endDate}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Periode magang</p>
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#e3ebf3] px-2.5 py-1 text-xs font-bold text-[#304c67]">{period.count} peserta aktif</span>
                        </div>
                        <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#1f2830]">{new Date(`${period.startDate}T12:00:00`).toLocaleDateString('id-ID', { month: 'long' })} — {new Date(`${period.endDate}T12:00:00`).toLocaleDateString('id-ID', { month: 'long' })} {new Date(`${period.endDate}T12:00:00`).getFullYear()}</h3>
                        <p className="mt-3 flex items-center gap-2 text-sm text-[#526980]"><CalendarClock size={15} /> {new Date(`${period.startDate}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} — {new Date(`${period.endDate}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="rounded-2xl border border-[#dde1e5] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Ringkasan</p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-[#1f2830]">Status ID Card</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8eff5] text-[#304c67]"><IdCard size={18} /></span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#222c35]">ID Card tersedia</span>
                    <span className="font-extrabold text-[#222c35]">{idCardAvailable}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#59728a]">Belum tersedia</span>
                    <span className="font-extrabold text-[#59728a]">{idCardUnavailable}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eceef0]">
                    <div className="h-full rounded-full bg-[#4e83b7] transition-[width] duration-700" style={{ width: `${idCardProgress}%` }} />
                  </div>
                  <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#222c35] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={() => setActiveSection('id-card')} type="button">Kelola ID Card <ArrowRight size={16} /></button>
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-[#dde1e5] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Distribusi</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f2830]">Peserta Berdasarkan Divisi</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9e6f2] text-[#2f5a84]"><TrendingUp size={18} /></span>
                </div>

                <div className="space-y-4">
                  {divisionStats.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#c8d0d7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#737a81]">Belum ada data peserta untuk divisi.</div>
                  ) : (
                    divisionStats.map(([division, count]) => (
                      <div key={division}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-[#222c35]">
                          <span>{division}</span>
                          <span className="text-[#4c6277]">{count}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eceef0]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#7eabd8] via-[#5c8ab7] to-[#3a6895] transition-[width] duration-700" style={{ width: `${(count / maxDivisionCount) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dde1e5] bg-[#fffdf8] p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Prioritas</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f2830]">Masa Magang Akan Selesai</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4edf5] text-[#2f5a84]"><Clock3 size={18} /></span>
                </div>

                {upcomingEndings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#c8d0d7] bg-white/70 px-4 py-6 text-sm text-[#737a81]">Tidak ada peserta yang akan segera selesai.</div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEndings.map((participant) => (
                      <button className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[#e1e4e8] bg-white p-3 text-left transition hover:border-[#6091c2] hover:bg-[#ebf2f8]" key={participant.id} onClick={() => onOpenParticipants()} type="button">
                        <div>
                          <p className="text-sm font-extrabold text-[#222c35]">{participant.name || '-'}</p>
                          <p className="mt-1 text-xs text-[#59728a]">{participant.major || '-'} • {participant.division || '-'}</p>
                          <p className="mt-2 text-xs font-bold text-[#59728c]">Selesai: {new Date(`${participant.endDate}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex rounded-full bg-[#e3ebf3] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#304c67]">{participant.daysLeft} hari lagi</span>
                        </div>
                      </button>
                    ))}
                    <button className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#2d4f70] transition hover:text-[#222c35]" onClick={onOpenParticipants} type="button">Lihat semua <ArrowRight size={15} /></button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dde1e5] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Aktivitas terbaru</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f2830]">Data Peserta Terbaru</h2>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl border border-[#dde1e5] bg-[#f9fbfc] px-3 py-2 text-sm font-bold text-[#222c35] transition hover:bg-[#dbe7f3]" onClick={onOpenParticipants} type="button">Lihat semua <ArrowRight size={15} /></button>
              </div>

              <div className="space-y-3">
                {recentParticipants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#c8d0d7] bg-[#f9fbfc] px-4 py-6 text-sm text-[#737a81]">Belum ada data peserta.</div>
                ) : (
                  recentParticipants.map((participant) => {
                    const status = isActiveParticipant(participant) ? 'Aktif' : isCompletedParticipant(participant) ? 'Selesai' : 'Belum dimulai'
                    return (
                      <div className="flex flex-col gap-3 rounded-2xl border border-[#eceef0] bg-[#f9fbfc] p-3 sm:flex-row sm:items-center" key={participant.id}>
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#dfe8f1] text-sm font-extrabold text-[#34485b]">
                          {participant.photo ? <img alt={participant.name || 'Foto peserta'} className="h-full w-full object-cover" src={participant.photo} /> : (participant.name || 'P').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[15px] font-extrabold text-[#222c35]">{participant.name || '-'}</p>
                              <p className="mt-1 text-xs text-[#59728a]">{participant.institution || '-'} • {participant.major || '-'}</p>
                            </div>
                            <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${status === 'Selesai' ? 'bg-[#f3f0e7] text-[#867659]' : status === 'Belum dimulai' ? 'bg-[#f1f3f4] text-[#6c737a]' : 'bg-[#e3ebf3] text-[#304c67]'}`}>{status}</span>
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-xs text-[#59728a] sm:flex-row sm:items-center sm:justify-between">
                            <span>Divisi: {participant.division || '-'}</span>
                            <span>{participant.startDate || '-'} - {participant.endDate || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

        {activeSection === 'attendance' && (
          <section className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]">
                <ClipboardCheck size={15} /> Administrasi kehadiran
              </div>
              <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#1f2830] sm:text-4xl">Pengajuan Izin & Sakit</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#757c83]">
                Kelola permohonan izin dan sakit dari peserta magang. Permohonan yang disetujui akan mengubah status kehadiran harian peserta.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Menunggu', value: leaveRequests.filter((r) => r.status === 'pending').length, color: 'bg-[#fff9e9] border-[#f1d8a8] text-[#765b24]' },
                { label: 'Disetujui', value: leaveRequests.filter((r) => r.status === 'approved').length, color: 'bg-[#e8f5ed] border-[#b5d6c4] text-[#286344]' },
                { label: 'Ditolak', value: leaveRequests.filter((r) => r.status === 'rejected').length, color: 'bg-[#fff1ed] border-[#f8c4bb] text-[#a74636]' },
              ].map(({ label, value, color }) => (
                <div className={`rounded-xl border p-4 ${color}`} key={label}>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] opacity-70">{label}</p>
                  <strong className="mt-1 block text-3xl font-extrabold">{value}</strong>
                </div>
              ))}
            </div>

            {/* Leave requests list */}
            <div className="overflow-hidden rounded-2xl border border-[#dde1e5] bg-white shadow-sm">
              <div className="border-b border-[#eceef0] px-5 py-4">
                <h2 className="font-extrabold text-[#222c35]">Daftar Pengajuan</h2>
                <p className="mt-1 text-xs text-[#838a91]">Klik Setujui atau Tolak untuk memproses pengajuan yang masih menunggu.</p>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-[#828991]">
                  Belum ada pengajuan izin atau sakit dari peserta.
                </div>
              ) : (
                <div className="divide-y divide-[#eceef0]">
                  {[...leaveRequests]
                    .sort((a, b) => {
                      // pending first, then by submission date desc
                      if (a.status === 'pending' && b.status !== 'pending') return -1
                      if (a.status !== 'pending' && b.status === 'pending') return 1
                      return b.submittedAt.localeCompare(a.submittedAt)
                    })
                    .map((request) => {
                      const statusConfig = {
                        pending: { label: 'Menunggu', cls: 'bg-[#fff7df] text-[#8a6a20]' },
                        approved: { label: 'Disetujui', cls: 'bg-[#e8f5ed] text-[#286344]' },
                        rejected: { label: 'Ditolak', cls: 'bg-[#fff1ed] text-[#a74636]' },
                      }
                      const { label: statusLabel, cls: statusCls } = statusConfig[request.status] || statusConfig.pending

                      const formatDate = (val) => {
                        const d = new Date(`${val}T12:00:00`)
                        return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      }
                      const formatSubmit = (val) => {
                        const d = new Date(val)
                        return Number.isNaN(d.getTime()) ? val : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(d)
                      }

                      const dateRange = request.endDate && request.endDate !== request.date
                        ? `${formatDate(request.date)} – ${formatDate(request.endDate)}`
                        : formatDate(request.date)

                      return (
                        <article className="px-5 py-4" key={request.id}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-extrabold text-[#222c35]">{request.participantName || request.participantCode || '-'}</p>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${request.type === 'sakit' ? 'bg-[#fce8e3] text-[#8a4030]' : 'bg-[#dbe7f3] text-[#2d4f70]'}`}>
                                  {request.type === 'sakit' ? 'Sakit' : 'Izin'}
                                </span>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusCls}`}>{statusLabel}</span>
                              </div>

                              <div className="mt-2 grid gap-1 text-sm text-[#526a81] sm:grid-cols-2">
                                <p><span className="font-bold text-[#75808a]">Tanggal:</span> {dateRange}</p>
                                <p><span className="font-bold text-[#75808a]">Diajukan:</span> {formatSubmit(request.submittedAt)}</p>
                              </div>

                              <p className="mt-2 text-sm text-[#303e4c]">
                                <span className="font-bold text-[#75808a]">Alasan:</span> {request.reason}
                              </p>

                              {request.evidence && (
                                <a
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2f5a84] underline"
                                  download={`bukti-${request.type}-${request.date}`}
                                  href={request.evidence}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Lihat bukti lampiran
                                </a>
                              )}

                              {request.reviewNote && (
                                <p className="mt-2 text-xs text-[#838a91]">
                                  <span className="font-bold">Catatan admin:</span> {request.reviewNote}
                                </p>
                              )}
                            </div>

                            {request.status === 'pending' && (
                              <div className="flex shrink-0 gap-2">
                                <button
                                  className="rounded-lg bg-[#e7f3ed] px-4 py-2 text-sm font-bold text-[#286344] transition hover:bg-[#d0e9d8]"
                                  onClick={() => {
                                    reviewLeaveRequest(request.id, 'approved')
                                    setLeaveRequests(readLeaveRequests())
                                  }}
                                  type="button"
                                >
                                  Setujui
                                </button>
                                <button
                                  className="rounded-lg bg-[#fff1ed] px-4 py-2 text-sm font-bold text-[#a74636] transition hover:bg-[#f8ded7]"
                                  onClick={() => {
                                    reviewLeaveRequest(request.id, 'rejected')
                                    setLeaveRequests(readLeaveRequests())
                                  }}
                                  type="button"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === 'reports' && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]"><FileText size={15} /> Rekap</div>
              <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#1f2830] sm:text-4xl">Rekap</h1>
            </div>

            {/* Sub-tab pills */}
            <div className="flex gap-2">
              {[
                { id: 'participants', label: 'Peserta per Tahun' },
                { id: 'attendance', label: 'Rekap Absensi' },
              ].map(({ id, label }) => (
                <button
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${reportsTab === id ? 'bg-[#222c35] text-white' : 'border border-[#dde1e5] bg-white text-[#556d84] hover:bg-[#f4f7fa]'}`}
                  key={id}
                  onClick={() => setReportsTab(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Tab: Peserta per Tahun ── */}
            {reportsTab === 'participants' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-[#1f2830]">Peserta Magang per Tahun</h2>
                    <p className="mt-1 text-sm text-[#757c83]">Rekap peserta dikelompokkan berdasarkan tahun mulai magang.</p>
                  </div>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#222c35] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c] disabled:cursor-not-allowed disabled:opacity-50" disabled={participants.length === 0} onClick={exportParticipantReport} type="button">
                    <Download size={17} /> Ekspor ke Excel
                  </button>
                </div>

                {reportExportError && <p className="rounded-xl border border-[#f2c7bd] bg-[#fff1ed] px-4 py-3 text-sm font-semibold text-[#a74636]" role="alert">{reportExportError}</p>}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {annualReportRows.length ? annualReportRows.map(([year, count]) => (
                    <button className={`rounded-2xl border p-5 text-left shadow-[0_10px_22px_rgba(36,51,45,0.04)] transition hover:-translate-y-0.5 ${reportYear === year ? 'border-[#9bb8d3] bg-[#eaf1f7]' : 'border-[#dde1e5] bg-white hover:bg-[#f9fbfc]'}`} key={year} onClick={() => setReportYear(year)} type="button">
                      <span className="text-sm font-bold text-[#4c6277]">{year}</span>
                      <strong className="mt-3 block text-3xl font-extrabold tracking-[-0.04em] text-[#222c35]">{count}</strong>
                      <span className="mt-1 block text-xs text-[#757c83]">peserta</span>
                    </button>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-[#c8d0d7] bg-white px-5 py-7 text-sm text-[#737a81] sm:col-span-2 xl:col-span-4">Belum ada data peserta magang.</div>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#dde1e5] bg-white shadow-[0_10px_22px_rgba(36,51,45,0.04)]">
                  <div className="flex flex-col gap-3 border-b border-[#eceef0] bg-[#f9fbfc] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#222c35]">Data Peserta</h2>
                      <p className="mt-1 text-xs text-[#757c83]">{reportedParticipants.length} peserta</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold text-[#4c6277]">
                      Tahun
                      <select className="rounded-lg border border-[#dde1e5] bg-white px-3 py-2 text-sm font-medium text-[#222c35]" onChange={(event) => setReportYear(event.target.value)} value={reportYear}>
                        <option>Semua Tahun</option>
                        {reportYears.map((year) => <option key={year}>{year}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left">
                      <thead className="bg-white text-xs font-bold uppercase tracking-[0.08em] text-[#75808a]">
                        <tr>
                          <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Institusi</th><th className="px-4 py-3">Jurusan / Divisi</th><th className="px-4 py-3">Periode Magang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eceef0]">
                        {reportedParticipants.length ? reportedParticipants.map((participant) => (
                          <tr className="text-sm text-[#556e86]" key={participant.id}>
                            <td className="px-4 py-3 font-bold text-[#303e4c]">{participant.name || '-'}</td>
                            <td className="px-4 py-3">{participant.participantCode || '-'}</td>
                            <td className="px-4 py-3">{participant.institution || '-'}</td>
                            <td className="px-4 py-3">{participant.major || '-'} / {participant.division || '-'}</td>
                            <td className="whitespace-nowrap px-4 py-3">{participant.startDate || '-'} – {participant.endDate || '-'}</td>
                          </tr>
                        )) : (
                          <tr><td className="px-4 py-10 text-center text-sm text-[#828991]" colSpan="5">Tidak ada peserta pada tahun ini.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Rekap Absensi ── */}
            {reportsTab === 'attendance' && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-[#1f2830]">Rekap Absensi Bulanan</h2>
                    <p className="mt-1 text-sm text-[#757c83]">Ringkasan status kehadiran seluruh peserta dalam satu bulan.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="rounded-lg border border-[#dde1e5] bg-white px-3 py-2 text-sm font-medium text-[#222c35]"
                      onChange={(e) => setRekapMonth(e.target.value)}
                      value={rekapMonth}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={String(i)}>
                          {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, i, 1))}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-[#dde1e5] bg-white px-3 py-2 text-sm font-medium text-[#222c35]"
                      onChange={(e) => setRekapYear(e.target.value)}
                      value={rekapYear}
                    >
                      {availableYears.map((y) => <option key={y}>{y}</option>)}
                    </select>
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-[#222c35] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#303e4c] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={monthlyAttendance.length === 0}
                      onClick={() => {
                        const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, Number(rekapMonth), 1))
                        const weekdays = monthlyAttendance[0]?.weekdays || []
                        const dowLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

                        // Sheet 1: Ringkasan
                        const summaryHeader = ['Nama Peserta', 'Bagian', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Tidak Hadir']
                        const summaryRows = monthlyAttendance.map(({ participant, hadir, terlambat, izin, sakit, absen }) => [
                          participant.name || '', participant.division || '', hadir, terlambat, izin, sakit, absen,
                        ])

                        // Sheet 2: Detail per tanggal
                        const statusCode = { hadir: 'H', terlambat: 'T', izin: 'I', sakit: 'S' }
                        const detailDateHeader = weekdays.map(({ day, dow }) => `${day}\n${dowLabels[dow]}`)
                        const detailHeader = ['Nama Peserta', 'Bagian', ...detailDateHeader, 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Tidak Hadir']
                        const detailRows = monthlyAttendance.map(({ participant, hadir, terlambat, izin, sakit, absen, dayMap }) => [
                          participant.name || '',
                          participant.division || '',
                          ...weekdays.map(({ key }) => statusCode[dayMap[key]] || '-'),
                          hadir, terlambat, izin, sakit, absen,
                        ])

                        const sheets = [
                          {
                            name: 'Ringkasan',
                            rows: [
                              [`Rekap Absensi — ${monthName} ${rekapYear}`],
                              [],
                              summaryHeader,
                              ...summaryRows,
                            ],
                            columnWidths: [28, 24, 10, 12, 10, 10, 14],
                          },
                          {
                            name: 'Detail per Tanggal',
                            rows: [
                              [`Detail Absensi Harian — ${monthName} ${rekapYear}`],
                              [`Keterangan: H=Hadir  T=Terlambat  I=Izin  S=Sakit  -=Tidak Hadir`],
                              [],
                              detailHeader,
                              ...detailRows,
                            ],
                            columnWidths: [28, 20, ...weekdays.map(() => 5), 8, 10, 8, 8, 12],
                          },
                        ]
                        try {
                          const workbook = createParticipantReportXlsx(sheets)
                          const blob = new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                          const url = URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          link.href = url
                          link.download = `rekap-absensi-${monthName.toLowerCase()}-${rekapYear}.xlsx`
                          document.body.append(link)
                          link.click()
                          link.remove()
                          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
                        } catch {
                          window.alert('Ekspor gagal. Periksa ruang penyimpanan browser.')
                        }
                      }}
                      type="button"
                    >
                      <Download size={16} /> Ekspor ke Excel
                    </button>
                  </div>
                </div>

                {/* Ringkasan per peserta */}
                <div className="overflow-hidden rounded-2xl border border-[#dde1e5] bg-white shadow-sm">
                  <div className="border-b border-[#eceef0] px-4 py-3">
                    <h3 className="font-extrabold text-[#222c35]">Ringkasan</h3>
                    <p className="mt-0.5 text-xs text-[#838a91]">Total hari per status dalam bulan ini</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead className="bg-[#f7f8f9] text-xs font-bold uppercase tracking-[0.08em] text-[#75808a]">
                        <tr>
                          <th className="px-4 py-3">Peserta</th>
                          <th className="px-4 py-3 text-center text-[#286344]">Hadir</th>
                          <th className="px-4 py-3 text-center text-[#a74636]">Terlambat</th>
                          <th className="px-4 py-3 text-center text-[#2d4f70]">Izin</th>
                          <th className="px-4 py-3 text-center text-[#8a4030]">Sakit</th>
                          <th className="px-4 py-3 text-center text-[#555]">Tidak Hadir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eceef0]">
                        {monthlyAttendance.length ? monthlyAttendance.map(({ participant, hadir, terlambat, izin, sakit, absen }) => (
                          <tr className="hover:bg-[#f9fbfc]" key={getParticipantIdentifier(participant)}>
                            <td className="px-4 py-3">
                              <button className="text-left font-bold text-[#2f5a84] underline decoration-[#9bb8d3] underline-offset-4 hover:text-[#1f4268]" onClick={() => openAttendanceDetail(participant)} type="button">
                                {participant.name || '-'}
                              </button>
                              <p className="text-xs text-[#838a91]">{participant.division || '-'}</p>
                            </td>
                            <td className="px-4 py-3 text-center font-extrabold text-[#286344]">{hadir}</td>
                            <td className="px-4 py-3 text-center font-extrabold text-[#a74636]">{terlambat}</td>
                            <td className="px-4 py-3 text-center font-extrabold text-[#2d4f70]">{izin}</td>
                            <td className="px-4 py-3 text-center font-extrabold text-[#8a4030]">{sakit}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-extrabold text-[#555]">{absen}</span>
                                <button aria-label={`Ekspor PDF absensi ${participant.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-[#d6dde3] text-[#2f5a84] transition hover:bg-[#eaf1f7]" onClick={() => openAttendanceDetailAndExport(participant)} title="Ekspor PDF absensi peserta" type="button">
                                  <Download size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td className="px-4 py-8 text-center text-[#828991]" colSpan="6">Belum ada peserta terdaftar.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detail per tanggal */}
                {monthlyAttendance.length > 0 && monthlyAttendance[0].weekdays.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-[#dde1e5] bg-white shadow-sm">
                    <div className="border-b border-[#eceef0] px-4 py-3">
                      <h3 className="font-extrabold text-[#222c35]">Detail per Tanggal</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#838a91]">
                        {[
                          { label: 'H', desc: 'Hadir', cls: 'bg-[#e7f3ed] text-[#286344]' },
                          { label: 'T', desc: 'Terlambat', cls: 'bg-[#fff1ed] text-[#a74636]' },
                          { label: 'I', desc: 'Izin', cls: 'bg-[#dbe7f3] text-[#2d4f70]' },
                          { label: 'S', desc: 'Sakit', cls: 'bg-[#fce8e3] text-[#8a4030]' },
                          { label: '—', desc: 'Tidak Hadir', cls: 'bg-[#f1f3f4] text-[#555]' },
                        ].map(({ label, desc, cls }) => (
                          <span className="flex items-center gap-1" key={label}>
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold ${cls}`}>{label}</span>
                            {desc}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="border-collapse text-xs">
                        <thead className="bg-[#f7f8f9]">
                          <tr>
                            <th className="sticky left-0 z-10 min-w-[160px] border-r border-[#eceef0] bg-[#f7f8f9] px-4 py-3 text-left font-bold text-[#75808a]">
                              Peserta
                            </th>
                            {monthlyAttendance[0].weekdays.map(({ day, key, dow }) => {
                              const dowLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dow]
                              return (
                                <th className="min-w-[36px] border-r border-[#eceef0] px-1 py-2 text-center font-bold text-[#75808a]" key={key}>
                                  <span className="block">{day}</span>
                                  <span className="block text-[9px] font-normal text-[#aab0b6]">{dowLabel}</span>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eceef0]">
                          {monthlyAttendance.map(({ participant, dayMap, weekdays: wds }) => (
                            <tr className="hover:bg-[#f9fbfc]" key={getParticipantIdentifier(participant)}>
                              <td className="sticky left-0 z-10 border-r border-[#eceef0] bg-white px-4 py-2.5 hover:bg-[#f9fbfc]">
                                <button className="text-left font-bold text-[#2f5a84] underline decoration-[#9bb8d3] underline-offset-4 hover:text-[#1f4268]" onClick={() => openAttendanceDetail(participant)} type="button">
                                  {participant.name || '-'}
                                </button>
                                <p className="text-[10px] text-[#838a91]">{participant.division || '-'}</p>
                              </td>
                              {wds.map(({ key }) => {
                                const status = dayMap[key]
                                const cellConfig = {
                                  hadir: { label: 'H', cls: 'bg-[#e7f3ed] text-[#286344]' },
                                  terlambat: { label: 'T', cls: 'bg-[#fff1ed] text-[#a74636]' },
                                  izin: { label: 'I', cls: 'bg-[#dbe7f3] text-[#2d4f70]' },
                                  sakit: { label: 'S', cls: 'bg-[#fce8e3] text-[#8a4030]' },
                                }
                                const cell = cellConfig[status]
                                return (
                                  <td className="border-r border-[#eceef0] px-1 py-2.5 text-center" key={key}>
                                    {cell ? (
                                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-extrabold ${cell.cls}`}>
                                        {cell.label}
                                      </span>
                                    ) : (
                                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#f1f3f4] text-[10px] font-bold text-[#aab0b6]">—</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#838a91]">
                  Hanya hari kerja (Senin–Jumat) yang ditampilkan. Data berdasarkan penyimpanan lokal browser ini.
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'certificates' && (
          selectedCertificate ? (
            <CertificatePage autoPrint={printCertificateOnOpen} onBack={() => { setSelectedCertificate(null); setPrintCertificateOnOpen(false) }} participant={selectedCertificate} />
          ) : (
            <CertificateDirectory
              isAdmin
              onPreview={(participant) => { setSelectedCertificate(participant); setPrintCertificateOnOpen(false) }}
              onPrint={(participant) => { setSelectedCertificate(participant); setPrintCertificateOnOpen(true) }}
              participants={participants}
            />
          )
        )}

        {activeSection !== 'dashboard' && activeSection !== 'id-card' && activeSection !== 'certificates' && activeSection !== 'attendance' && !(activeSection === 'participants' || activeSection === 'reports') && (
          <div className="rounded-2xl border border-dashed border-[#c9d0d6] bg-white/70 px-6 py-20 text-center">
            <ActiveIcon className="mx-auto text-[#aaafb3]" size={32} />
            <h2 className="mt-4 text-lg font-extrabold text-[#384858]">Belum ada data {activeMenu.label.toLowerCase()}</h2>
            <p className="mt-2 text-sm text-[#838a91]">Data akan muncul di sini setelah tersedia.</p>
          </div>
        )}

        {activeSection === 'id-card' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f2830]">ID Card Peserta Magang</h1>
                <p className="mt-2 text-base text-[#757c83]">Kelola dan unduh ID Card peserta magang yang sudah melakukan pendataan.</p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#dde1e5] bg-[#e2e9f0] px-4 py-3 text-[#28343f] shadow-[0_10px_20px_rgba(36,51,45,0.04)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#2f5a84] shadow-sm"><IdCard size={20} /></div>
                <div>
                  <div className="text-sm font-extrabold text-[#222c35]">ID Card</div>
                  <div className="text-xs text-[#59728a]">Identitas resmi peserta magang PELINDO</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_320px]">
              <div className="overflow-hidden rounded-2xl border border-[#dde1e5] bg-white shadow-[0_10px_20px_rgba(36,51,45,0.04)]">
                <div className="flex flex-col gap-3 border-b border-[#eceef0] bg-[#f9fbfc] p-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#989ea4]" size={16} />
                    <input className="w-full rounded-xl border border-[#dde1e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#222c35] outline-none placeholder:text-[#939aa0] focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama peserta..." type="text" value={searchQuery} />
                  </div>

                  <select className="rounded-xl border border-[#dde1e5] bg-white px-3 py-2.5 text-sm text-[#222c35] outline-none focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20" onChange={(event) => setPeriodFilter(event.target.value)} value={periodFilter}>
                    {uniquePeriods.map((period) => <option key={period}>{period}</option>)}
                  </select>

                  <select className="rounded-xl border border-[#dde1e5] bg-white px-3 py-2.5 text-sm text-[#222c35] outline-none focus:border-[#4f7dab] focus:ring-4 focus:ring-[#659fd8]/20" onChange={(event) => setDivisionFilter(event.target.value)} value={divisionFilter}>
                    {uniqueDivisions.map((division) => <option key={division}>{division}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#f9fbfc] text-[11px] font-bold uppercase tracking-[0.12em] text-[#899096]">
                      <tr>
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Nama Peserta</th>
                        <th className="px-4 py-3">Institusi</th>
                        <th className="px-4 py-3">Divisi</th>
                        <th className="px-4 py-3">Periode</th>
                        <th className="px-4 py-3">ID Peserta</th>
                        <th className="px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td className="px-4 py-10 text-center text-sm text-[#828991]" colSpan={7}>Tidak ada peserta yang sesuai filter.</td>
                        </tr>
                      ) : (
                        filteredParticipants.map((participant, index) => (
                          <tr className={`border-t border-[#eceef0] transition ${selectedParticipant?.id === participant.id ? 'bg-[#ecf2f8]' : 'bg-white hover:bg-[#f9fbfc]'}`} key={participant.id} onClick={() => handleSelectCard(participant.id)}>
                            <td className="px-4 py-3 text-sm text-[#526a81]">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#cedff0] text-xs font-extrabold text-[#2c4e6f]">{(participant.name || 'P').charAt(0).toUpperCase()}</span>
                                <span className="text-sm font-bold text-[#222c35]">{participant.name || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#556e86]">{participant.institution || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[#556e86]">{participant.division || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[#556e86]">{participant.startDate || '-'} </td>
                            <td className="px-4 py-3 text-sm font-bold text-[#222c35]">{participant.participantCode || 'PINTAR-0000'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button aria-label={`Lihat ID Card ${participant.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dbdfe3] bg-white text-[#222c35] transition hover:border-[#4a7299] hover:bg-[#dbe7f3]" onClick={(event) => { event.stopPropagation(); openCardModal(participant) }} title="Lihat ID Card" type="button"><IdCard size={15} /></button>
                                <button aria-label={`Edit data ${participant.name}`} className="grid h-8 w-8 place-items-center rounded-lg border border-[#dbdfe3] bg-white text-[#222c35] transition hover:border-[#4a7299] hover:bg-[#dbe7f3]" onClick={(event) => { event.stopPropagation(); openEditModal(participant) }} title="Edit peserta" type="button"><Pencil size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="rounded-2xl border border-[#dde1e5] bg-[#f7f8f9] p-4 shadow-[0_10px_20px_rgba(36,51,45,0.04)]">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold tracking-[-0.04em] text-[#1f2830]">Preview ID Card</h2></div>
                {selectedParticipant && (
                  <div className="mx-auto w-[240px]">
                    <IdCardFrame participant={selectedParticipant} />
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {selectedAttendanceEntry && (
          <div className="attendance-detail-modal fixed inset-0 z-[70] flex items-center justify-center bg-[#1f2830]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="attendance-detail-title">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#dfe3e7] bg-white shadow-[0_24px_70px_rgba(31,40,48,0.28)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eceef0] bg-white px-5 py-4 print:static">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f879e]">Detail absensi peserta</p>
                  <h2 className="mt-1 text-xl font-extrabold text-[#222c35]" id="attendance-detail-title">{selectedAttendanceEntry.participant.name || '-'}</h2>
                </div>
                <button aria-label="Tutup detail absensi" className="grid h-9 w-9 place-items-center rounded-lg text-[#737a81] transition hover:bg-[#edf1f4] print:hidden" onClick={() => setSelectedAttendanceParticipantId(null)} type="button"><X size={19} /></button>
              </div>

              <div className="p-5">
                <div className="mb-5 grid gap-3 rounded-xl border border-[#e1e6ea] bg-[#f9fbfc] p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="text-xs font-bold text-[#879096]">PERIODE</p><p className="mt-1 font-extrabold text-[#303e4c]">{new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, Number(rekapMonth), 1))} {rekapYear}</p></div>
                  <div><p className="text-xs font-bold text-[#879096]">BAGIAN</p><p className="mt-1 font-extrabold text-[#303e4c]">{selectedAttendanceEntry.participant.division || '-'}</p></div>
                  <div><p className="text-xs font-bold text-[#879096]">INSTITUSI</p><p className="mt-1 font-extrabold text-[#303e4c]">{selectedAttendanceEntry.participant.institution || '-'}</p></div>
                  <div><p className="text-xs font-bold text-[#879096]">KODE PESERTA</p><p className="mt-1 font-mono font-extrabold text-[#2f5a84]">{selectedAttendanceEntry.participant.participantCode || '-'}</p></div>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    ['Hadir', selectedAttendanceEntry.hadir, 'bg-[#e7f3ed] text-[#286344]'],
                    ['Terlambat', selectedAttendanceEntry.terlambat, 'bg-[#fff1ed] text-[#a74636]'],
                    ['Izin', selectedAttendanceEntry.izin, 'bg-[#dbe7f3] text-[#2d4f70]'],
                    ['Sakit', selectedAttendanceEntry.sakit, 'bg-[#fce8e3] text-[#8a4030]'],
                    ['Tidak Hadir', selectedAttendanceEntry.absen, 'bg-[#f1f3f4] text-[#555]'],
                  ].map(([label, value, cls]) => (
                    <div className={`rounded-xl px-3 py-3 ${cls}`} key={label}>
                      <p className="text-xs font-bold">{label}</p>
                      <p className="mt-1 text-2xl font-extrabold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#e1e6ea]">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead className="bg-[#f7f8f9] text-xs font-bold uppercase tracking-[0.06em] text-[#75808a]">
                      <tr>
                        <th className="px-4 py-3 text-left">Tanggal</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Jam Masuk</th>
                        <th className="px-4 py-3 text-left">Jam Pulang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eceef0]">
                      {selectedAttendanceEntry.weekdays.map(({ key, day, dow }) => {
                        const status = selectedAttendanceEntry.dayMap[key]
                        const participantRecords = attendanceRecords.filter((record) => (
                          record.participantIdentifier === getParticipantIdentifier(selectedAttendanceEntry.participant)
                          && record.date === key
                        ))
                        const checkIn = participantRecords.find((record) => record.type === 'check-in')
                        const checkOut = participantRecords.find((record) => record.type === 'check-out')
                        const formatTime = (record) => {
                          if (!record?.scannedAt) return '-'
                          const date = new Date(record.scannedAt)
                          if (Number.isNaN(date.getTime())) return '-'
                          return new Intl.DateTimeFormat('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            hour: '2-digit',
                            minute: '2-digit',
                            hourCycle: 'h23',
                          }).format(date) + ' WIB'
                        }
                        const statusLabel = {
                          hadir: 'Hadir',
                          terlambat: 'Terlambat',
                          izin: 'Izin',
                          sakit: 'Sakit',
                        }[status] || (key <= formatLocalDate(new Date()) ? 'Tidak Hadir' : 'Belum Lewat')
                        const dowLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dow]
                        return (
                          <tr className="hover:bg-[#f9fbfc]" key={key}>
                            <td className="px-4 py-3 font-bold text-[#303e4c]">{day} {dowLabel}</td>
                            <td className="px-4 py-3 font-bold text-[#556e86]">{statusLabel}</td>
                            <td className="px-4 py-3 text-[#556e86]">{formatTime(checkIn)}</td>
                            <td className="px-4 py-3 text-[#556e86]">{formatTime(checkOut)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#eceef0] px-5 py-4 print:hidden">
                <button className="rounded-xl border border-[#dde1e5] px-4 py-3 text-sm font-bold text-[#384858] transition hover:bg-[#f4f6f7]" onClick={() => setSelectedAttendanceParticipantId(null)} type="button">Tutup</button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#222c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={exportAttendancePdf} type="button"><Download size={16} /> Ekspor ke PDF</button>
              </div>
            </div>
          </div>
        )}

        {cardModalParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2830]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="id-card-modal-title">
            <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#dfe3e7] bg-white p-5 shadow-[0_24px_70px_rgba(31,40,48,0.28)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#222c35]" id="id-card-modal-title">ID Card Peserta</h2>
                <button aria-label="Tutup ID Card" className="grid h-9 w-9 place-items-center rounded-lg text-[#737a81] transition hover:bg-[#edf1f4]" onClick={() => setCardModalParticipant(null)} type="button"><X size={19} /></button>
              </div>
              <div className="mx-auto w-full max-w-[320px]">
                <IdCardFrame participant={cardModalParticipant} />
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-xl border border-[#dde1e5] px-4 py-3 text-sm font-bold text-[#384858] transition hover:bg-[#f4f6f7]" onClick={() => setCardModalParticipant(null)} type="button">Tutup</button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#222c35] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={() => openEditModal(cardModalParticipant)} type="button"><Pencil size={15} /> Edit</button>
              </div>
            </div>
          </div>
        )}

        {editingParticipant && editData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2830]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
            <form className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#dfe3e7] bg-white shadow-[0_24px_70px_rgba(31,40,48,0.28)]" onSubmit={saveParticipantEdit}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eceef0] bg-white px-5 py-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f879e]">Edit peserta</p><h2 className="mt-1 text-xl font-extrabold text-[#222c35]" id="edit-modal-title">{editingParticipant.name}</h2></div>
                <button aria-label="Tutup edit" className="grid h-9 w-9 place-items-center rounded-lg text-[#737a81] transition hover:bg-[#edf1f4]" onClick={() => { setEditingParticipant(null); setEditData(null) }} type="button"><X size={19} /></button>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {[
                  ['name', 'Nama lengkap', 'text'], ['email', 'Email aktif', 'email'], ['phone', 'Nomor WhatsApp', 'tel'], ['institution', 'Kampus / sekolah', 'text'],
                  ['studentNumber', 'NIM / NISN', 'text'], ['major', 'Jurusan / program studi', 'text'], ['division', 'Divisi magang', 'text'],
                  ['startDate', 'Tanggal mulai', 'date'], ['endDate', 'Tanggal akhir', 'date'],
                ].map(([name, label, type]) => (
                  <label className="block" key={name}>
                    <span className="mb-2 block text-sm font-bold text-[#384858]">{label}</span>
                    <input className="w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] px-3 py-3 text-sm text-[#222c35] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20" name={name} onChange={updateEditField} required={name !== 'studentNumber'} type={type} value={editData[name] || ''} />
                  </label>
                ))}
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-[#384858]">Pas foto</span>
                  <input accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="block w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#222c35] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" onChange={updateEditPhoto} type="file" />
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#eceef0] px-5 py-4">
                <button className="rounded-xl border border-[#dde1e5] px-4 py-3 text-sm font-bold text-[#384858] transition hover:bg-[#f4f6f7]" onClick={() => { setEditingParticipant(null); setEditData(null) }} type="button">Batal</button>
                <button className="rounded-xl bg-[#222c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" type="submit">Simpan perubahan</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
