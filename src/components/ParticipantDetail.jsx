import { ArrowLeft, Award, BriefcaseBusiness, Building2, CalendarDays, ExternalLink, GraduationCap, Hash, Mail, Phone, UserRound } from 'lucide-react'
import { isCertificateAvailable } from './certificateUtils'

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#e3e7ea] bg-[#f9fbfc] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#899096]"><Icon size={15} /> {label}</div>
      <p className="break-words text-sm font-bold text-[#303e4c]">{value || '-'}</p>
    </div>
  )
}

const whatsappUrl = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return '#'
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}`
}

export function ParticipantDetail({ participant, onBack, onViewCertificate }) {
  const completed = isCertificateAvailable(participant)

  return (
    <section className="page-shell max-w-3xl">
      <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#737a81] transition hover:text-[#222c35]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali ke peserta magang
      </button>
      <div className="overflow-hidden rounded-2xl border border-[#dfe3e7] bg-white shadow-[0_18px_50px_rgba(51,70,58,0.06)]">
        <div className="bg-[#accae8] px-6 py-8 sm:px-9">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-2xl font-extrabold text-[#305880] shadow-sm">{participant.name.charAt(0).toUpperCase()}</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#30587f]">Detail peserta magang</span>
              <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-[#222c35]">{participant.name}</h1>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
          <DetailItem icon={Mail} label="Email aktif" value={participant.email} />
          <div className="rounded-xl border border-[#e3e7ea] bg-[#f9fbfc] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#899096]"><Phone size={15} /> Nomor WhatsApp</div>
            {participant.phone ? <a className="inline-flex items-center gap-2 text-sm font-bold text-[#374d62] underline decoration-[#91afcd] underline-offset-4 transition hover:text-[#253443]" href={whatsappUrl(participant.phone)} rel="noreferrer" target="_blank">{participant.phone} <ExternalLink size={14} /></a> : <p className="text-sm font-bold text-[#303e4c]">-</p>}
          </div>
          <DetailItem icon={Building2} label="Kampus / sekolah" value={participant.institution} />
          <DetailItem icon={GraduationCap} label="Jenjang pendidikan" value={participant.education} />
                    <DetailItem icon={GraduationCap} label="Jenjang pendidikan" value={participant.education} />
                    <DetailItem icon={Hash} label="NIM / NISN" value={participant.studentNumber} />
          <DetailItem icon={BriefcaseBusiness} label="Jurusan / program studi" value={participant.major} />
          <DetailItem icon={BriefcaseBusiness} label="Divisi magang" value={participant.division} />
          <DetailItem icon={CalendarDays} label="Tanggal mulai magang" value={participant.startDate} />
          <DetailItem icon={CalendarDays} label="Tanggal akhir magang" value={participant.endDate} />
          <div className="sm:col-span-2"><DetailItem icon={UserRound} label="Status data" value={completed ? 'Magang selesai' : 'Data sudah dikirim'} /></div>
        </div>
        {completed && <div className="border-t border-[#eceef0] bg-[#ecf2f8] p-5 sm:px-8"><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4f70] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#24425f]" onClick={() => onViewCertificate(participant)} type="button"><Award size={17} /> Lihat sertifikat magang</button></div>}
      </div>
    </section>
  )
}