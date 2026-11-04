import { useMemo, useState } from 'react'
import { Award, Printer, Search } from 'lucide-react'
import { formatCertificateDate, isCertificateAvailable } from './certificateUtils'

export function CertificateDirectory({ participants, onPreview, onPrint, isAdmin = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('Semua institusi')
  const [divisionFilter, setDivisionFilter] = useState('Semua bagian')
  const [yearFilter, setYearFilter] = useState('Semua tahun')

  const institutions = useMemo(() => ['Semua institusi', ...new Set(participants.map((participant) => participant.institution).filter(Boolean))], [participants])
  const divisions = useMemo(() => ['Semua bagian', ...new Set(participants.map((participant) => participant.division).filter(Boolean))], [participants])
  const years = useMemo(() => ['Semua tahun', ...new Set(participants.map((participant) => participant.endDate?.slice(0, 4)).filter((year) => /^\d{4}$/.test(year || '')))], [participants])

  const filteredParticipants = useMemo(() => participants.filter((participant) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesName = !query || participant.name?.toLowerCase().includes(query)
    const matchesInstitution = institutionFilter === 'Semua institusi' || participant.institution === institutionFilter
    const matchesDivision = divisionFilter === 'Semua bagian' || participant.division === divisionFilter
    const matchesYear = yearFilter === 'Semua tahun' || participant.endDate?.slice(0, 4) === yearFilter
    return matchesName && matchesInstitution && matchesDivision && matchesYear
  }), [participants, searchQuery, institutionFilter, divisionFilter, yearFilter])

  return (
    <section className="page-shell max-w-7xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2d4f70]"><Award size={15} /> Dokumen peserta</div>
        <h1 className="text-3xl font-extrabold text-[#222c35]">{isAdmin ? 'Kelola Sertifikat' : 'Sertifikat Magang'}</h1>
        <p className="mt-2 text-sm text-[#757c83]">Sertifikat hanya tersedia setelah tanggal akhir magang peserta.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-[#dde1e5] bg-white p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(160px,190px))]">
        <label className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Cari nama peserta</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#989ea4]" size={16} />
          <input className="w-full rounded-lg border border-[#dde1e5] bg-[#f9fbfc] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#4f7dab]" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama peserta..." value={searchQuery} />
        </label>
        <select aria-label="Filter institusi" className="w-full min-w-0 rounded-lg border border-[#dde1e5] bg-white px-3 py-2.5 text-sm" onChange={(event) => setInstitutionFilter(event.target.value)} value={institutionFilter}>{institutions.map((institution) => <option key={institution}>{institution}</option>)}</select>
        <select aria-label="Filter bagian" className="w-full min-w-0 rounded-lg border border-[#dde1e5] bg-white px-3 py-2.5 text-sm" onChange={(event) => setDivisionFilter(event.target.value)} value={divisionFilter}>{divisions.map((division) => <option key={division}>{division}</option>)}</select>
        <select aria-label="Filter tahun" className="w-full min-w-0 rounded-lg border border-[#dde1e5] bg-white px-3 py-2.5 text-sm" onChange={(event) => setYearFilter(event.target.value)} value={yearFilter}>{years.map((year) => <option key={year}>{year}</option>)}</select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#dde1e5] bg-white">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#f7f8f9] text-[11px] font-bold uppercase tracking-[0.1em] text-[#899096]">
            <tr><th className="px-4 py-3">Nama Peserta</th><th className="px-4 py-3">Institusi</th><th className="px-4 py-3">Program Studi</th><th className="px-4 py-3">Bagian</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr>
          </thead>
          <tbody>
            {filteredParticipants.length === 0 ? (
              <tr><td className="px-4 py-10 text-center text-sm text-[#828991]" colSpan={7}>Tidak ada peserta yang sesuai filter.</td></tr>
            ) : filteredParticipants.map((participant) => {
              const available = isCertificateAvailable(participant)
              return (
                <tr className="border-t border-[#eceef0]" key={participant.id || participant.participantCode}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-[#222c35]">{participant.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#556e86]">{participant.institution || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#556e86]">{participant.major || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#556e86]">{participant.division || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[#556e86]">{formatCertificateDate(participant.startDate)} – {formatCertificateDate(participant.endDate)}</td>
                  <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${available ? 'bg-[#e3ebf3] text-[#304c67]' : 'bg-[#f1f3f4] text-[#6c737a]'}`}>{available ? 'Selesai' : 'Aktif'}</span></td>
                  <td className="px-4 py-3">
                    {available ? (
                      <div className="flex items-center gap-2">
                        <button className="whitespace-nowrap rounded-lg border border-[#dde1e5] px-3 py-2 text-xs font-bold text-[#303e4c] hover:bg-[#ecf2f8]" onClick={() => onPreview(participant)} type="button">Preview</button>
                        <button aria-label={`Cetak atau unduh sertifikat ${participant.name || ''}`} className="grid h-9 w-9 place-items-center rounded-lg bg-[#222c35] text-white hover:bg-[#303e4c]" onClick={() => onPrint(participant)} title="Cetak / Unduh PDF" type="button"><Printer size={15} /></button>
                      </div>
                    ) : <span className="whitespace-nowrap text-xs font-semibold text-[#899096]">Belum tersedia</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}