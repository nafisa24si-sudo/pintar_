import { useMemo, useState } from 'react'
import { ArrowLeft, Filter, Plus, Search, UserRound, Users } from 'lucide-react'

export function ParticipantsPage({ participants, onBack, onAdd, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('Semua divisi')
  const [statusFilter, setStatusFilter] = useState('Semua status')

  const divisions = useMemo(() => ['Semua divisi', ...new Set(participants.map((participant) => participant.division).filter(Boolean))], [participants])

  const getStatus = (participant) => {
    if (!participant.startDate || !participant.endDate) return 'Belum dimulai'

    const today = new Date()
    const startDate = new Date(`${participant.startDate}T12:00:00`)
    const endDate = new Date(`${participant.endDate}T12:00:00`)

    if (today < startDate) return 'Belum dimulai'
    if (today > endDate) return 'Selesai'
    return 'Aktif'
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
    <section className="mx-auto w-full max-w-5xl px-6 pb-20 pt-6 lg:px-10 lg:pb-24">
      <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#738178] transition hover:text-[#24332d]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali ke beranda
      </button>
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#78951e]"><Users size={15} /> Data internal</div>
          <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f3028] sm:text-5xl">Peserta magang</h1>
          <p className="mt-3 text-base text-[#75837b]">Daftar peserta yang sudah mengisi pendataan.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24332d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#34483d]" onClick={onAdd} type="button"><Plus size={17} /> Tambah peserta</button>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#dfe7db] bg-white p-3 shadow-[0_10px_24px_rgba(36,51,45,0.04)] sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Cari peserta</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#97a59d]" size={17} />
          <input className="w-full rounded-xl border border-[#dfe7db] bg-[#fbfcf9] py-3 pl-10 pr-3 text-sm text-[#24332d] outline-none placeholder:text-[#93a099] transition focus:border-[#9fbd3d] focus:bg-white focus:ring-4 focus:ring-[#c7ee4f]/20" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama, institusi, jurusan, atau divisi..." type="search" value={searchQuery} />
        </label>
        <label className="relative sm:w-48">
          <span className="sr-only">Filter divisi</span>
          <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#97a59d]" size={16} />
          <select className="w-full appearance-none rounded-xl border border-[#dfe7db] bg-[#fbfcf9] py-3 pl-9 pr-3 text-sm text-[#24332d] outline-none transition focus:border-[#9fbd3d] focus:bg-white focus:ring-4 focus:ring-[#c7ee4f]/20" onChange={(event) => setDivisionFilter(event.target.value)} value={divisionFilter}>
            {divisions.map((division) => <option key={division}>{division}</option>)}
          </select>
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Filter status</span>
          <select className="w-full rounded-xl border border-[#dfe7db] bg-[#fbfcf9] px-3 py-3 text-sm text-[#24332d] outline-none transition focus:border-[#9fbd3d] focus:bg-white focus:ring-4 focus:ring-[#c7ee4f]/20" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option>Semua status</option>
            <option>Aktif</option>
            <option>Belum dimulai</option>
            <option>Selesai</option>
          </select>
        </label>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#dce8c2] bg-[#f0f8d6] px-4 py-3 text-sm font-bold text-[#657d20]">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c7ee4f] text-[#304324]">{filteredParticipants.length}</span>
        {filteredParticipants.length === participants.length ? 'Total peserta terdata' : 'Peserta sesuai filter'}
      </div>

      {participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd8c7] bg-white/60 px-6 py-16 text-center">
          <UserRound className="mx-auto text-[#a8b5ac]" size={36} />
          <h2 className="mt-4 text-lg font-extrabold text-[#405047]">Belum ada peserta</h2>
          <p className="mt-2 text-sm text-[#849088]">Data yang dikirim melalui form akan muncul di sini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e1e9dd] bg-white shadow-[0_18px_50px_rgba(51,70,58,0.06)]">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#edf1eb] bg-[#fbfcf9] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#89968e] sm:grid">
            <span>Nama peserta</span><span>Institusi</span><span>Divisi</span><span>Kontak</span><span>Periode magang</span>
          </div>
          {filteredParticipants.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Search className="mx-auto text-[#a8b5ac]" size={30} />
              <h2 className="mt-4 text-lg font-extrabold text-[#405047]">Peserta tidak ditemukan</h2>
              <p className="mt-2 text-sm text-[#849088]">Coba ubah kata kunci atau filter yang digunakan.</p>
            </div>
          ) : filteredParticipants.map((participant) => (
            <div className="grid gap-3 border-b border-[#edf1eb] px-5 py-5 last:border-b-0 sm:grid-cols-[1.1fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-4" key={participant.id}>
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf6c8] font-extrabold text-[#6f9020]">{participant.name.charAt(0).toUpperCase()}</span><div><button className="block text-left text-sm font-extrabold text-[#2f4037] underline decoration-[#c7ee4f] decoration-2 underline-offset-4 transition hover:text-[#779d1f]" onClick={() => onSelect(participant)} type="button">{participant.name}</button><span className="text-xs text-[#8a968e]">{participant.education}</span></div></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0aba4] sm:hidden">Institusi</span><span className="text-sm text-[#66756c]">{participant.institution}</span><span className="block text-xs text-[#9aa69e]">{participant.major}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0aba4] sm:hidden">Divisi</span><span className="text-sm text-[#66756c]">{participant.division}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0aba4] sm:hidden">Kontak</span><span className="block text-sm text-[#66756c]">{participant.phone}</span><span className="block text-xs text-[#9aa69e]">{participant.email}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0aba4] sm:hidden">Periode magang</span><span className="block text-sm text-[#66756c]">{participant.startDate}</span><span className="text-xs text-[#9aa69e]">sampai {participant.endDate}</span></div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}