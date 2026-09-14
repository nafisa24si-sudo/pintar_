import { ArrowLeft, BriefcaseBusiness, Building2, CalendarDays, GraduationCap, Mail, Phone, UserRound } from 'lucide-react'

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#e5ece1] bg-[#fbfcf9] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#89968e]"><Icon size={15} /> {label}</div>
      <p className="break-words text-sm font-bold text-[#34483d]">{value || '-'}</p>
    </div>
  )
}

export function ParticipantDetail({ participant, onBack }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-20 pt-6 lg:pb-24">
      <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#738178] transition hover:text-[#24332d]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali ke peserta magang
      </button>
      <div className="overflow-hidden rounded-2xl border border-[#e1e9dd] bg-white shadow-[0_18px_50px_rgba(51,70,58,0.06)]">
        <div className="bg-[#dff3a1] px-6 py-8 sm:px-9">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-2xl font-extrabold text-[#6f9020] shadow-sm">{participant.name.charAt(0).toUpperCase()}</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#718e21]">Detail peserta magang</span>
              <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-[#24332d]">{participant.name}</h1>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
          <DetailItem icon={Mail} label="Email aktif" value={participant.email} />
          <DetailItem icon={Phone} label="Nomor WhatsApp" value={participant.phone} />
          <DetailItem icon={Building2} label="Kampus / sekolah" value={participant.institution} />
          <DetailItem icon={GraduationCap} label="Jenjang pendidikan" value={participant.education} />
          <DetailItem icon={BriefcaseBusiness} label="Jurusan / program studi" value={participant.major} />
          <DetailItem icon={BriefcaseBusiness} label="Divisi magang" value={participant.division} />
          <DetailItem icon={CalendarDays} label="Tanggal mulai magang" value={participant.startDate} />
          <DetailItem icon={CalendarDays} label="Tanggal akhir magang" value={participant.endDate} />
          <div className="sm:col-span-2"><DetailItem icon={UserRound} label="Status data" value="Data sudah dikirim" /></div>
        </div>
      </div>
    </section>
  )
}