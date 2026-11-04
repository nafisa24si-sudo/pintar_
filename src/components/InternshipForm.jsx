import { useState } from 'react'
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, GraduationCap, ImagePlus, Mail, Phone, UserRound } from 'lucide-react'

const initialData = { name: '', email: '', phone: '', institution: '', education: 'Perguruan tinggi', studentNumber: '', major: '', division: '', startDate: '', endDate: '', photo: '', photoBackground: 'biru' }

function Field({ icon: Icon, label, name, value, onChange, placeholder, type = 'text', required = true }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#384858]">{label}{required && <b className="ml-1 text-[#4376a9]">*</b>}</span>
      <span className="flex items-center rounded-xl border border-[#dde1e5] bg-[#f9fbfc] transition focus-within:border-[#4f7dab] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#659fd8]/20">
        <Icon className="ml-3.5 shrink-0 text-[#9aa0a6]" size={18} />
        <input className="min-w-0 w-full bg-transparent px-3 py-3.5 text-sm text-[#222c35] outline-none placeholder:text-[#aaafb4]" name={name} onChange={onChange} placeholder={placeholder} required={required} type={type} value={value} />
      </span>
    </label>
  )
}

export function InternshipForm({ onSubmit }) {
  const [data, setData] = useState(initialData)
  const update = (event) => setData({ ...data, [event.target.name]: event.target.value })

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setData((current) => ({ ...current, photo: String(reader.result), photoBackground: 'biru' }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <form className="rounded-2xl border border-[#dfe3e7] bg-white p-5 shadow-[0_18px_50px_rgba(51,70,58,0.06)] sm:p-8" onSubmit={(event) => { event.preventDefault(); onSubmit(data) }}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field icon={UserRound} label="Nama lengkap" name="name" onChange={update} placeholder="Contoh: Naya Putri" value={data.name} />
        <Field icon={Mail} label="Email aktif" name="email" onChange={update} placeholder="nama@email.com" type="email" value={data.email} />
        <Field icon={Phone} label="Nomor WhatsApp" name="phone" onChange={update} placeholder="08xxxxxxxxxx" type="tel" value={data.phone} />
        <Field icon={Building2} label="Kampus / sekolah" name="institution" onChange={update} placeholder="Nama institusi" value={data.institution} />
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#384858]">Jenjang pendidikan<b className="ml-1 text-[#4376a9]">*</b></span>
          <span className="flex items-center rounded-xl border border-[#dde1e5] bg-[#f9fbfc] transition focus-within:border-[#4f7dab] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#659fd8]/20">
            <GraduationCap className="ml-3.5 shrink-0 text-[#9aa0a6]" size={18} />
            <select className="w-full bg-transparent px-3 py-3.5 text-sm text-[#222c35] outline-none" name="education" onChange={update} value={data.education}><option>Perguruan tinggi</option><option>SMA / SMK</option><option>Sederajat lainnya</option></select>
          </span>
        </label>
          <Field icon={GraduationCap} label="NIM / NISN" name="studentNumber" onChange={update} placeholder="Masukkan NIM atau NISN" value={data.studentNumber} />
          <Field icon={BriefcaseBusiness} label="Jurusan / program studi" name="major" onChange={update} placeholder="Contoh: Desain Komunikasi Visual" value={data.major} />
        <Field icon={BriefcaseBusiness} label="Divisi magang" name="division" onChange={update} placeholder="Contoh: Digital Marketing" value={data.division} />
        <Field icon={CalendarDays} label="Tanggal mulai magang" name="startDate" onChange={update} placeholder="dd/mm/yyyy" type="date" value={data.startDate} />
        <Field icon={CalendarDays} label="Tanggal akhir magang" name="endDate" onChange={update} placeholder="dd/mm/yyyy" type="date" value={data.endDate} />

        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#384858]">Pas foto formal<b className="ml-1 text-[#4376a9]">*</b></span>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#dde1e5] bg-[#f9fbfc] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#dbe7f3] text-[#2d4f70]"><ImagePlus size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-[#28343f]">Upload pas foto</p>
                  <p className="text-xs text-[#757c83]">JPG / JPEG / PNG • latar biru atau merah</p>
                </div>
              </div>
              <input accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="block w-full max-w-[220px] text-sm text-[#384858] file:mr-4 file:rounded-xl file:border-0 file:bg-[#222c35] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#303e4c]" name="photo" onChange={handlePhotoChange} required type="file" />
            </div>
          </label>

          {data.photo && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#dde1e5] bg-[#f8f9fa] p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2f5a84]">Preview foto</p>
              <img alt="Preview pas foto peserta" className="h-40 w-32 rounded-xl object-cover shadow-sm" src={data.photo} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#eceef0] pt-6 sm:flex-row sm:items-center">
        <p className="max-w-sm text-xs leading-5 text-[#899097]">Dengan mengirimkan data, kamu menyetujui data digunakan untuk kebutuhan administrasi program magang.</p>
        <button className="group inline-flex w-full shrink-0 items-center justify-center gap-3 rounded-xl bg-[#222c35] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#303e4c] sm:w-auto" type="submit">Kirim data <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></button>
      </div>
    </form>
  )
}
