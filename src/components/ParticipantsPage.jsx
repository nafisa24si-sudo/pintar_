import { useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, Filter, Plus, Search, UserRound, Users } from 'lucide-react'
import { isCertificateAvailable, parseLocalDate } from './certificateUtils'

export function ParticipantsPage({ participants, onBack, onAdd, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('Semua divisi')
  const [statusFilter, setStatusFilter] = useState('Semua status')

  const divisions = useMemo(() => ['Semua divisi', ...new Set(participants.map((participant) => participant.division).filter(Boolean))], [participants])

  const getStatus = (participant) => {
    const startDate = parseLocalDate(participant.startDate)
    const endDate = parseLocalDate(participant.endDate)
    if (!startDate || !endDate) return 'Belum dimulai'
    if (isCertificateAvailable(participant)) return 'Selesai'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (today < startDate) return 'Belum dimulai'
    return 'Aktif'
  }

  const whatsappUrl = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '')
    if (!digits) return '#'
    return `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}`
  }

  const filteredParticipants = useMemo(() => participants.filter((participant) => {
    const query = searchQuery.trim().toLowerCase()
    const searchableText = [participant.name, participant.institution, participant.major, participant.division].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = !query || searchableText.includes(query)
    const matchesDivision = divisionFilter === 'Semua divisi' || participant.division === divisionFilter
    const matchesStatus = statusFilter === 'Semua status' || getStatus(participant) === statusFilter
    return matchesSearch && matchesDivision && matchesStatus
  }), [participants, searchQuery, divisionFilter, statusFilter])

  return (
    <section className="page-shell max-w-5xl">
      <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#737a81] transition hover:text-[#222c35]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali ke beranda
      </button>
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]"><Users size={15} /> Data internal</div>
          <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f2830] sm:text-5xl">Peserta magang</h1>
          <p className="mt-3 text-base text-[#757c83]">Daftar peserta yang sudah mengisi pendataan.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#222c35] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={onAdd} type="button"><Plus size={17} /> Tambah peserta</button>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#dde1e5] bg-white p-3 shadow-[0_10px_24px_rgba(36,51,45,0.04)] sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Cari peserta</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#989ea4]" size={17} />
          <input className="w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] py-3 pl-10 pr-3 text-sm text-[#222c35] outline-none placeholder:text-[#939aa0] transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama, institusi, jurusan, atau divisi..." type="search" value={searchQuery} />
        </label>
        <label className="relative sm:w-48">
          <span className="sr-only">Filter divisi</span>
          <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#989ea4]" size={16} />
          <select className="w-full appearance-none rounded-xl border border-[#dde1e5] bg-[#f9fbfc] py-3 pl-9 pr-3 text-sm text-[#222c35] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20" onChange={(event) => setDivisionFilter(event.target.value)} value={divisionFilter}>
            {divisions.map((division) => <option key={division}>{division}</option>)}
          </select>
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Filter status</span>
          <select className="w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] px-3 py-3 text-sm text-[#222c35] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option>Semua status</option>
            <option>Aktif</option>
            <option>Belum dimulai</option>
            <option>Selesai</option>
          </select>
        </label>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#c7d5e3] bg-[#dbe7f3] px-4 py-3 text-sm font-bold text-[#2d4f70]">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#659fd8] text-[#28343f]">{filteredParticipants.length}</span>
        {filteredParticipants.length === participants.length ? 'Total peserta terdata' : 'Peserta sesuai filter'}
      </div>

      {participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9d0d6] bg-white/60 px-6 py-16 text-center">
          <UserRound className="mx-auto text-[#aaafb3]" size={36} />
          <h2 className="mt-4 text-lg font-extrabold text-[#384858]">Belum ada peserta</h2>
          <p className="mt-2 text-sm text-[#838a91]">Data yang dikirim melalui form akan muncul di sini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#dfe3e7] bg-white shadow-[0_18px_50px_rgba(51,70,58,0.06)]">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#eceef0] bg-[#f9fbfc] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#899096] sm:grid">
            <span>Nama peserta</span><span>Institusi</span><span>Divisi</span><span>Kontak</span><span>Periode magang</span>
          </div>
          {filteredParticipants.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Search className="mx-auto text-[#aaafb3]" size={30} />
              <h2 className="mt-4 text-lg font-extrabold text-[#384858]">Peserta tidak ditemukan</h2>
              <p className="mt-2 text-sm text-[#838a91]">Coba ubah kata kunci atau filter yang digunakan.</p>
            </div>
          ) : filteredParticipants.map((participant) => (
            <div className="grid gap-3 border-b border-[#eceef0] px-5 py-5 last:border-b-0 sm:grid-cols-[1.1fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-4" key={participant.id}>
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#cedff0] font-extrabold text-[#305880]">{participant.name.charAt(0).toUpperCase()}</span><div><button className="block text-left text-sm font-extrabold text-[#2b3844] underline decoration-[#659fd8] decoration-2 underline-offset-4 transition hover:text-[#315e8b]" onClick={() => onSelect(participant)} type="button">{participant.name}</button><span className="text-xs text-[#899097]">{participant.education}</span></div></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Institusi</span><span className="text-sm text-[#556e86]">{participant.institution}</span><span className="block text-xs text-[#9aa0a6]">{participant.major}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Divisi</span><span className="text-sm text-[#556e86]">{participant.division}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Kontak</span><a className="inline-flex items-center gap-1 text-sm font-bold text-[#374d62] underline decoration-[#91afcd] underline-offset-4 transition hover:text-[#253443]" href={whatsappUrl(participant.phone)} onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">{participant.phone || '-'} {participant.phone && <ExternalLink size={12} />}</a><span className="block text-xs text-[#9aa0a6]">{participant.email}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Periode magang</span><span className="block text-sm text-[#556e86]">{participant.startDate}</span><span className="text-xs text-[#9aa0a6]">sampai {participant.endDate}</span></div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}