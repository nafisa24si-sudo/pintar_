import { useMemo, useState } from 'react'
import { ArrowLeft, Filter, IdCard, Pencil, Plus, Search, UserRound, Users, X } from 'lucide-react'
import { isCertificateAvailable, parseLocalDate } from './certificateUtils'

export function ParticipantsPage({ participants, onBack, onAdd, onSelect, onViewIdCard, onEdit }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('Semua divisi')
  const [statusFilter, setStatusFilter] = useState('Semua status')
  const [editingParticipant, setEditingParticipant] = useState(null)
  const [editData, setEditData] = useState(null)

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

  const filteredParticipants = useMemo(() => participants.filter((participant) => {
    const query = searchQuery.trim().toLowerCase()
    const searchableText = [participant.name, participant.institution, participant.major, participant.division].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = !query || searchableText.includes(query)
    const matchesDivision = divisionFilter === 'Semua divisi' || participant.division === divisionFilter
    const matchesStatus = statusFilter === 'Semua status' || getStatus(participant) === statusFilter
    return matchesSearch && matchesDivision && matchesStatus
  }), [participants, searchQuery, divisionFilter, statusFilter])

  const openEdit = (participant) => {
    setEditingParticipant(participant)
    setEditData({ ...participant })
  }

  const closeEdit = () => {
    setEditingParticipant(null)
    setEditData(null)
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

  const saveEdit = (event) => {
    event.preventDefault()
    if (!editData) return
    onEdit(editData)
    closeEdit()
  }

  return (
    <div className="admin-participants-page">
      <section className="admin-participants-glass page-shell max-w-5xl">
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

      <div className="admin-participants-filter mb-5 flex flex-col gap-3 rounded-2xl border border-[#dde1e5] bg-white p-3 shadow-[0_10px_24px_rgba(36,51,45,0.04)] sm:flex-row">
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

      <div className="admin-participants-count mb-6 flex items-center gap-3 rounded-xl border border-[#c7d5e3] bg-[#dbe7f3] px-4 py-3 text-sm font-bold text-[#2d4f70]">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#659fd8] text-[#28343f]">{filteredParticipants.length}</span>
        {filteredParticipants.length === participants.length ? 'Total peserta terdata' : 'Peserta sesuai filter'}
      </div>

      {participants.length === 0 ? (
        <div className="admin-participants-empty rounded-2xl border border-dashed border-[#c9d0d6] bg-white/60 px-6 py-16 text-center">
          <UserRound className="mx-auto text-[#aaafb3]" size={36} />
          <h2 className="mt-4 text-lg font-extrabold text-[#384858]">Belum ada peserta</h2>
          <p className="mt-2 text-sm text-[#838a91]">Data yang dikirim melalui form akan muncul di sini.</p>
        </div>
      ) : (
        <div className="admin-participants-table overflow-hidden rounded-2xl border border-[#dfe3e7] bg-white shadow-[0_18px_50px_rgba(51,70,58,0.06)]">
          <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_1fr_1fr_90px] gap-4 border-b border-[#eceef0] bg-[#f9fbfc] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#899096] sm:grid">
            <span>Nama peserta</span><span>Institusi</span><span>Divisi</span><span>Periode magang</span><span>ID peserta</span><span>Aksi</span>
          </div>
          {filteredParticipants.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Search className="mx-auto text-[#aaafb3]" size={30} />
              <h2 className="mt-4 text-lg font-extrabold text-[#384858]">Peserta tidak ditemukan</h2>
              <p className="mt-2 text-sm text-[#838a91]">Coba ubah kata kunci atau filter yang digunakan.</p>
            </div>
          ) : filteredParticipants.map((participant) => (
            <div className="grid gap-3 border-b border-[#eceef0] px-5 py-5 last:border-b-0 sm:grid-cols-[1.1fr_1fr_0.8fr_1fr_1fr_90px] sm:items-center sm:gap-4" key={participant.id}>
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#cedff0] font-extrabold text-[#305880]">{participant.name.charAt(0).toUpperCase()}</span><div><button className="block text-left text-sm font-extrabold text-[#2b3844] underline decoration-[#659fd8] decoration-2 underline-offset-4 transition hover:text-[#315e8b]" onClick={() => onSelect(participant)} type="button">{participant.name}</button><span className="text-xs text-[#899097]">{participant.education}</span></div></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Institusi</span><span className="text-sm text-[#556e86]">{participant.institution}</span><span className="block text-xs text-[#9aa0a6]">{participant.major}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Divisi</span><span className="text-sm text-[#556e86]">{participant.division}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Periode magang</span><span className="block text-sm text-[#556e86]">{participant.startDate}</span><span className="text-xs text-[#9aa0a6]">sampai {participant.endDate}</span></div>
              <div><span className="mb-1 block text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">ID peserta</span><span className="font-mono text-xs font-bold text-[#305880]">{participant.participantCode || '-'}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#a0a5ab] sm:hidden">Aksi</span>
                <button aria-label={`Lihat ID Card ${participant.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6dde3] bg-white text-[#305880] transition hover:border-[#659fd8] hover:bg-[#dbe7f3]" onClick={() => onViewIdCard(participant)} title="Lihat ID Card" type="button"><IdCard size={16} /></button>
                <button aria-label={`Edit ${participant.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6dde3] bg-white text-[#305880] transition hover:border-[#659fd8] hover:bg-[#dbe7f3]" onClick={() => openEdit(participant)} title="Edit peserta" type="button"><Pencil size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingParticipant && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2830]/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-participant-title">
          <form className="admin-participants-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#dfe3e7] bg-white shadow-[0_24px_70px_rgba(31,40,48,0.24)]" onSubmit={saveEdit}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eceef0] bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f879e]">Edit data peserta</p>
                <h2 className="mt-1 text-xl font-extrabold text-[#222c35]" id="edit-participant-title">{editingParticipant.name}</h2>
              </div>
              <button aria-label="Tutup edit" className="grid h-9 w-9 place-items-center rounded-lg text-[#737a81] transition hover:bg-[#edf1f4] hover:text-[#222c35]" onClick={closeEdit} type="button"><X size={19} /></button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ['name', 'Nama lengkap', 'text'],
                ['email', 'Email aktif', 'email'],
                ['phone', 'Nomor WhatsApp', 'tel'],
                ['institution', 'Kampus / sekolah', 'text'],
                ['studentNumber', 'NIM / NISN', 'text'],
                ['major', 'Jurusan / program studi', 'text'],
                ['division', 'Divisi magang', 'text'],
                ['startDate', 'Tanggal mulai', 'date'],
                ['endDate', 'Tanggal akhir', 'date'],
              ].map(([name, label, type]) => (
                <label className="block" key={name}>
                  <span className="mb-2 block text-sm font-bold text-[#384858]">{label}</span>
                  <input className="w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] px-3 py-3 text-sm text-[#222c35] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20" name={name} onChange={updateEditField} required type={type} value={editData[name] || ''} />
                </label>
              ))}
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-[#384858]">Jenjang pendidikan</span>
                <select className="w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] px-3 py-3 text-sm text-[#222c35] outline-none" name="education" onChange={updateEditField} value={editData.education || 'Perguruan tinggi'}>
                  <option>Perguruan tinggi</option><option>SMA / SMK</option><option>Sederajat lainnya</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-[#384858]">Pas foto</span>
                <input accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="block w-full rounded-xl border border-[#dde1e5] bg-[#f9fbfc] p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#222c35] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" onChange={updateEditPhoto} type="file" />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#eceef0] px-5 py-4">
              <button className="rounded-xl border border-[#dde1e5] px-4 py-3 text-sm font-bold text-[#384858] transition hover:bg-[#f4f6f7]" onClick={closeEdit} type="button">Batal</button>
              <button className="rounded-xl bg-[#222c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" type="submit">Simpan perubahan</button>
            </div>
          </form>
        </div>
      )}
      </section>
    </div>
  )
}