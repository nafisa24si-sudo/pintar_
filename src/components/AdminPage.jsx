import { useMemo, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarClock, CalendarDays, Clock3, FileText, IdCard, LayoutDashboard, LogOut, Search, Sparkles, TrendingUp, Users, X } from 'lucide-react'

export function AdminPage({ participants, onBack, onOpenParticipants, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [selectedCardId, setSelectedCardId] = useState(participants[0]?.id ?? null)
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState('Semua Periode')
  const [divisionFilter, setDivisionFilter] = useState('Semua Divisi')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'participants', label: 'Data Peserta', icon: Users },
    { id: 'institutions', label: 'Institusi & Program Studi', icon: Building2 },
    { id: 'id-card', label: 'Kelola ID Card', icon: IdCard },
    { id: 'reports', label: 'Laporan', icon: FileText },
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
    return startDate <= today && today <= endDate
  }

  const isCompletedParticipant = (participant) => {
    const endDate = parseDate(participant.endDate)
    if (!endDate) return false
    const today = new Date()
    return today > endDate
  }

  const totalParticipants = participants.length
  const activeParticipants = participants.filter(isActiveParticipant)
  const completedParticipants = participants.filter(isCompletedParticipant)
  const idCardAvailable = participants.filter((participant) => participant.participantCode || participant.photo).length
  const idCardUnavailable = Math.max(totalParticipants - idCardAvailable, 0)

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

  const handleSelectCard = (participantId) => setSelectedCardId(participantId)
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
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-20 pt-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-10 lg:pb-24">
      <aside className="h-fit rounded-2xl border border-[#dce5d9] bg-white p-3 shadow-[0_12px_30px_rgba(36,51,45,0.05)]">
        <div className="mb-4 flex items-center justify-between px-3 pt-2 lg:block">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#78951e]">PINTAR</p>
            <p className="mt-1 text-sm font-extrabold text-[#24332d]">Menu admin</p>
          </div>
          <button aria-label="Keluar dari admin" className="rounded-lg p-2 text-[#849088] transition hover:bg-[#fff1ed] hover:text-[#b34d3b] lg:hidden" onClick={onLogout} type="button"><X size={17} /></button>
        </div>

        <nav className="grid gap-1" aria-label="Navigasi admin">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeSection === id ? 'bg-[#f0f8d6] text-[#657d20]' : 'text-[#65746b] hover:bg-[#fbfcf9] hover:text-[#24332d]'}`}
              key={id}
              onClick={() => selectSection(id)}
              type="button"
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <button className="mt-5 hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-[#65746b] transition hover:bg-[#fff1ed] hover:text-[#b34d3b] lg:flex" onClick={onLogout} type="button">
          <LogOut size={17} />
          Keluar
        </button>
      </aside>

      <div className="min-w-0">
        <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#738178] transition hover:text-[#24332d]" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Kembali ke beranda
        </button>

        {activeSection === 'dashboard' && (
          <>
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]"><Sparkles size={14} /> Dashboard</div>
                <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f3028] sm:text-5xl">Dashboard</h1>
                <p className="mt-3 max-w-2xl text-base text-[#75837b]">Pantau data dan aktivitas peserta magang secara ringkas.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dbe4d5] bg-white px-3 py-2 text-xs font-bold text-[#65746b] shadow-[0_8px_18px_rgba(36,51,45,0.04)]"><span className="h-2 w-2 rounded-full bg-[#c7ee4f] shadow-[0_0_0_4px_#e5f6b7]" /> Admin aktif</span>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total Peserta', value: totalParticipants, detail: 'Seluruh peserta terdata', tone: 'border-[#dfe8c6] bg-[#f4f9e8]', icon: Users, accent: 'text-[#657d20]', valueColor: 'text-[#263d29]' },
                { label: 'Peserta Aktif', value: activeParticipants.length, detail: 'Sedang menjalani magang', tone: 'border-[#dfe7db] bg-[#ffffff]', icon: Activity, accent: 'text-[#2e5c66]', valueColor: 'text-[#24332d]' },
                { label: 'Peserta Selesai', value: completedParticipants.length, detail: 'Masa magang berakhir', tone: 'border-[#e8eadb] bg-[#fffdf8]', icon: BadgeCheck, accent: 'text-[#7a8f2d]', valueColor: 'text-[#24332d]' },
                { label: 'ID Card', value: idCardAvailable, detail: `${idCardUnavailable} belum siap`, tone: 'border-[#dfe7db] bg-[#edf6ea]', icon: IdCard, accent: 'text-[#3c6e52]', valueColor: 'text-[#1d3427]' },
              ].map(({ label, value, detail, tone, icon: Icon, accent, valueColor }, index) => (
                <div className={`dashboard-card group rounded-2xl border p-5 shadow-[0_10px_22px_rgba(36,51,45,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(36,51,45,0.08)] ${tone}`} key={label} style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#586b63]">{label}</span>
                    <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white/80 ${accent}`}><Icon size={18} /></span>
                  </div>
                  <strong className={`block text-4xl font-extrabold tracking-[-0.05em] ${valueColor}`}>{value}</strong>
                  <span className="mt-2 block text-sm text-[#697c72]">{detail}</span>
                </div>
              ))}
            </div>

            <div className="mb-8 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-[#dfe7db] bg-[#fffdf8] p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]">Periode aktif</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f3028]">Periode Magang Aktif</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf6e0] text-[#78951e]"><CalendarDays size={18} /></span>
                </div>

                {activePeriods.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d2dac5] bg-white/70 px-4 py-6 text-sm text-[#72827d]">Belum ada periode magang yang sedang berjalan.</div>
                ) : (
                  <div className="space-y-4">
                    {activePeriods.map((period) => (
                      <div className="rounded-2xl border border-[#e0e7da] bg-white p-4 shadow-[0_8px_18px_rgba(36,51,45,0.03)]" key={`${period.startDate}-${period.endDate}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]">Periode magang</p>
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#edf6e0] px-2.5 py-1 text-xs font-bold text-[#587225]">{period.count} peserta aktif</span>
                        </div>
                        <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#1f3028]">{new Date(`${period.startDate}T12:00:00`).toLocaleDateString('id-ID', { month: 'long' })} — {new Date(`${period.endDate}T12:00:00`).toLocaleDateString('id-ID', { month: 'long' })} {new Date(`${period.endDate}T12:00:00`).getFullYear()}</h3>
                        <p className="mt-3 flex items-center gap-2 text-sm text-[#607268]"><CalendarClock size={15} /> {new Date(`${period.startDate}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} — {new Date(`${period.endDate}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#dfe7db] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]">Ringkasan</p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-[#1f3028]">Status ID Card</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef7e6] text-[#587225]"><IdCard size={18} /></span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#24332d]">ID Card tersedia</span>
                    <span className="font-extrabold text-[#24332d]">{idCardAvailable}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#687b6c]">Belum tersedia</span>
                    <span className="font-extrabold text-[#687b6c]">{idCardUnavailable}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#edf1eb]">
                    <div className="h-full rounded-full bg-[#9ecb3a] transition-[width] duration-700" style={{ width: `${idCardProgress}%` }} />
                  </div>
                  <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#24332d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#34483d]" onClick={() => setActiveSection('id-card')} type="button">Kelola ID Card <ArrowRight size={16} /></button>
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-[#dfe7db] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]">Distribusi</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f3028]">Peserta Berdasarkan Divisi</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf7d4] text-[#78951e]"><TrendingUp size={18} /></span>
                </div>

                <div className="space-y-4">
                  {divisionStats.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d2dac5] bg-[#fbfcf9] px-4 py-6 text-sm text-[#72827d]">Belum ada data peserta untuk divisi.</div>
                  ) : (
                    divisionStats.map(([division, count]) => (
                      <div key={division}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-[#24332d]">
                          <span>{division}</span>
                          <span className="text-[#586b63]">{count}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#edf1eb]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#c8ea6c] via-[#abc94a] to-[#8aa728] transition-[width] duration-700" style={{ width: `${(count / maxDivisionCount) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dfe7db] bg-[#fffdf8] p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]">Prioritas</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f3028]">Masa Magang Akan Selesai</h2>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3f8e1] text-[#78951e]"><Clock3 size={18} /></span>
                </div>

                {upcomingEndings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d2dac5] bg-white/70 px-4 py-6 text-sm text-[#72827d]">Tidak ada peserta yang akan segera selesai.</div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEndings.map((participant) => (
                      <button className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[#e5eadf] bg-white p-3 text-left transition hover:border-[#b8d54d] hover:bg-[#f7fbe8]" key={participant.id} onClick={() => onOpenParticipants()} type="button">
                        <div>
                          <p className="text-sm font-extrabold text-[#24332d]">{participant.name || '-'}</p>
                          <p className="mt-1 text-xs text-[#687b6c]">{participant.major || '-'} • {participant.division || '-'}</p>
                          <p className="mt-2 text-xs font-bold text-[#697c72]">Selesai: {new Date(`${participant.endDate}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex rounded-full bg-[#edf6e0] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#587225]">{participant.daysLeft} hari lagi</span>
                        </div>
                      </button>
                    ))}
                    <button className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#657d20] transition hover:text-[#24332d]" onClick={onOpenParticipants} type="button">Lihat semua <ArrowRight size={15} /></button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dfe7db] bg-white p-5 shadow-[0_12px_24px_rgba(36,51,45,0.04)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78951e]">Aktivitas terbaru</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#1f3028]">Data Peserta Terbaru</h2>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl border border-[#dfe7db] bg-[#fbfcf9] px-3 py-2 text-sm font-bold text-[#24332d] transition hover:bg-[#f0f8d6]" onClick={onOpenParticipants} type="button">Lihat semua <ArrowRight size={15} /></button>
              </div>

              <div className="space-y-3">
                {recentParticipants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d2dac5] bg-[#fbfcf9] px-4 py-6 text-sm text-[#72827d]">Belum ada data peserta.</div>
                ) : (
                  recentParticipants.map((participant) => {
                    const status = isActiveParticipant(participant) ? 'Aktif' : isCompletedParticipant(participant) ? 'Selesai' : 'Belum dimulai'
                    return (
                      <div className="flex flex-col gap-3 rounded-2xl border border-[#edf1eb] bg-[#fbfcf9] p-3 sm:flex-row sm:items-center" key={participant.id}>
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#edf5db] text-sm font-extrabold text-[#49632c]">
                          {participant.photo ? <img alt={participant.name || 'Foto peserta'} className="h-full w-full object-cover" src={participant.photo} /> : (participant.name || 'P').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[15px] font-extrabold text-[#24332d]">{participant.name || '-'}</p>
                              <p className="mt-1 text-xs text-[#687b6c]">{participant.institution || '-'} • {participant.major || '-'}</p>
                            </div>
                            <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${status === 'Selesai' ? 'bg-[#f3f0e7] text-[#867659]' : status === 'Belum dimulai' ? 'bg-[#f2f4f1] text-[#6c7a71]' : 'bg-[#edf6e0] text-[#587225]'}`}>{status}</span>
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-xs text-[#687b6c] sm:flex-row sm:items-center sm:justify-between">
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

        {activeSection !== 'dashboard' && activeSection !== 'id-card' && !(activeSection === 'participants' || activeSection === 'institutions' || activeSection === 'reports') && (
          <div className="rounded-2xl border border-dashed border-[#cbd8c7] bg-white/70 px-6 py-20 text-center">
            <ActiveIcon className="mx-auto text-[#a8b5ac]" size={32} />
            <h2 className="mt-4 text-lg font-extrabold text-[#405047]">Belum ada data {activeMenu.label.toLowerCase()}</h2>
            <p className="mt-2 text-sm text-[#849088]">Data akan muncul di sini setelah tersedia.</p>
          </div>
        )}

        {activeSection === 'id-card' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f3028]">ID Card Peserta Magang</h1>
                <p className="mt-2 text-base text-[#75837b]">Kelola dan unduh ID Card peserta magang yang sudah melakukan pendataan.</p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe7db] bg-[#e9f3df] px-4 py-3 text-[#304324] shadow-[0_10px_20px_rgba(36,51,45,0.04)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#78951e] shadow-sm"><IdCard size={20} /></div>
                <div>
                  <div className="text-sm font-extrabold text-[#24332d]">ID Card</div>
                  <div className="text-xs text-[#687b6c]">Identitas resmi peserta magang PINTAR</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_320px]">
              <div className="overflow-hidden rounded-2xl border border-[#dfe7db] bg-white shadow-[0_10px_20px_rgba(36,51,45,0.04)]">
                <div className="flex flex-col gap-3 border-b border-[#edf1eb] bg-[#fbfcf9] p-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#97a59d]" size={16} />
                    <input className="w-full rounded-xl border border-[#dfe7db] bg-white py-2.5 pl-9 pr-3 text-sm text-[#24332d] outline-none placeholder:text-[#93a099] focus:border-[#9fbd3d] focus:ring-4 focus:ring-[#c7ee4f]/20" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama peserta..." type="text" value={searchQuery} />
                  </div>

                  <select className="rounded-xl border border-[#dfe7db] bg-white px-3 py-2.5 text-sm text-[#24332d] outline-none focus:border-[#9fbd3d] focus:ring-4 focus:ring-[#c7ee4f]/20" onChange={(event) => setPeriodFilter(event.target.value)} value={periodFilter}>
                    {uniquePeriods.map((period) => <option key={period}>{period}</option>)}
                  </select>

                  <select className="rounded-xl border border-[#dfe7db] bg-white px-3 py-2.5 text-sm text-[#24332d] outline-none focus:border-[#9fbd3d] focus:ring-4 focus:ring-[#c7ee4f]/20" onChange={(event) => setDivisionFilter(event.target.value)} value={divisionFilter}>
                    {uniqueDivisions.map((division) => <option key={division}>{division}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#fbfcf9] text-[11px] font-bold uppercase tracking-[0.12em] text-[#89968e]">
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
                          <td className="px-4 py-10 text-center text-sm text-[#839087]" colSpan={7}>Tidak ada peserta yang sesuai filter.</td>
                        </tr>
                      ) : (
                        filteredParticipants.map((participant, index) => (
                          <tr className={`border-t border-[#edf1eb] transition ${selectedParticipant?.id === participant.id ? 'bg-[#f7fbe9]' : 'bg-white hover:bg-[#fbfcf9]'}`} key={participant.id} onClick={() => handleSelectCard(participant.id)}>
                            <td className="px-4 py-3 text-sm text-[#62716a]">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eaf6c8] text-xs font-extrabold text-[#5f7c1f]">{(participant.name || 'P').charAt(0).toUpperCase()}</span>
                                <span className="text-sm font-bold text-[#24332d]">{participant.name || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#66756c]">{participant.institution || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[#66756c]">{participant.division || '-'}</td>
                            <td className="px-4 py-3 text-sm text-[#66756c]">{participant.startDate || '-'} </td>
                            <td className="px-4 py-3 text-sm font-bold text-[#24332d]">{participant.participantCode || 'PINTAR-0000'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button aria-label="Lihat ID Card" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce5d9] bg-white text-[#24332d] transition hover:border-[#8da93a] hover:bg-[#f0f8d6]" onClick={(event) => { event.stopPropagation(); handleSelectCard(participant.id) }} type="button"><IdCard size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="rounded-2xl border border-[#dfe7db] bg-[#f8faf6] p-4 shadow-[0_10px_20px_rgba(36,51,45,0.04)]">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold tracking-[-0.04em] text-[#1f3028]">Preview ID Card</h2></div>

                <div className="mx-auto w-full max-w-[260px] rounded-[22px] border border-[#dfe7db] bg-[#edf3e6] p-3 shadow-inner shadow-white/60">
                  <div className="rounded-[18px] border border-[#dfe7db] bg-[#f9fdf6] p-3 shadow-[0_8px_18px_rgba(36,51,45,0.08)]">
                    <div className="flex items-center justify-between border-b border-[#edf1eb] pb-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-[#dfeec3] text-[9px] font-black text-[#24332d]">P</div>
                        <span className="text-sm font-extrabold text-[#24332d]">PELINDO</span>
                      </div>
                      <div className="text-[9px] font-extrabold text-[#24332d]">pintar</div>
                    </div>

                    <div className="mt-3 text-center">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#24332d]">Peserta Magang</div>
                    </div>

                    <div className="mt-3 flex justify-center">
                      <div className="h-[88px] w-[74px] overflow-hidden rounded-xl border border-[#dfe7db] bg-[#edf3ee]">
                        <img alt={selectedParticipant?.name || 'Foto peserta'} className="h-full w-full object-cover" src={selectedParticipant?.photo || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'} />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-left text-[10px] text-[#24332d]">
                      <div><div className="font-bold uppercase tracking-[0.12em] text-[#8a978d]">Nama</div><div className="mt-0.5 font-bold">{selectedParticipant?.name || 'Nama Peserta'}</div></div>
                      <div><div className="font-bold uppercase tracking-[0.12em] text-[#8a978d]">Institusi</div><div className="mt-0.5 font-bold">{selectedParticipant?.institution || 'Institusi'}</div></div>
                      <div><div className="font-bold uppercase tracking-[0.12em] text-[#8a978d]">Program Studi</div><div className="mt-0.5 font-bold">{selectedParticipant?.major || 'Program Studi'}</div></div>
                      <div><div className="font-bold uppercase tracking-[0.12em] text-[#8a978d]">Divisi</div><div className="mt-0.5 font-bold">{selectedParticipant?.division || 'Divisi'}</div></div>
                      <div><div className="font-bold uppercase tracking-[0.12em] text-[#8a978d]">Periode</div><div className="mt-0.5 font-bold">{selectedParticipant?.startDate || '01 Januari 2026'} - {selectedParticipant?.endDate || '31 Desember 2026'}</div></div>
                      <div><div className="font-bold uppercase tracking-[0.12em] text-[#8a978d]">ID Peserta</div><div className="mt-0.5 font-bold">{selectedParticipant?.participantCode || 'PINTAR-2026-001'}</div></div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
