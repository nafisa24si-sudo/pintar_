import { useState } from 'react'
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, GraduationCap, ImagePlus, Mail, Phone, UserRound } from 'lucide-react'

const initialData = { name: '', email: '', phone: '', institution: '', education: 'Perguruan tinggi', major: '', division: '', startDate: '', endDate: '', photo: '', photoBackground: 'biru' }

function Field({ icon: Icon, label, name, value, onChange, placeholder, type = 'text', required = true }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#405047]">{label}{required && <b className="ml-1 text-[#9bbd2f]">*</b>}</span>
      <span className="flex items-center rounded-xl border border-[#dfe7db] bg-[#fbfcf9] transition focus-within:border-[#9fbd3d] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#c7ee4f]/20">
        <Icon className="ml-3.5 shrink-0 text-[#9aa69e]" size={18} />
        <input className="min-w-0 w-full bg-transparent px-3 py-3.5 text-sm text-[#24332d] outline-none placeholder:text-[#aab4ad]" name={name} onChange={onChange} placeholder={placeholder} required={required} type={type} value={value} />
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
    <form className="rounded-2xl border border-[#e1e9dd] bg-white p-5 shadow-[0_18px_50px_rgba(51,70,58,0.06)] sm:p-8" onSubmit={(event) => { event.preventDefault(); onSubmit(data) }}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field icon={UserRound} label="Nama lengkap" name="name" onChange={update} placeholder="Contoh: Naya Putri" value={data.name} />
        <Field icon={Mail} label="Email aktif" name="email" onChange={update} placeholder="nama@email.com" type="email" value={data.email} />
        <Field icon={Phone} label="Nomor WhatsApp" name="phone" onChange={update} placeholder="08xxxxxxxxxx" type="tel" value={data.phone} />
        <Field icon={Building2} label="Kampus / sekolah" name="institution" onChange={update} placeholder="Nama institusi" value={data.institution} />
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#405047]">Jenjang pendidikan<b className="ml-1 text-[#9bbd2f]">*</b></span>
          <span className="flex items-center rounded-xl border border-[#dfe7db] bg-[#fbfcf9] transition focus-within:border-[#9fbd3d] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#c7ee4f]/20">
            <GraduationCap className="ml-3.5 shrink-0 text-[#9aa69e]" size={18} />
            <select className="w-full bg-transparent px-3 py-3.5 text-sm text-[#24332d] outline-none" name="education" onChange={update} value={data.education}><option>Perguruan tinggi</option><option>SMA / SMK</option><option>Sederajat lainnya</option></select>
          </span>
        </label>
        <Field icon={BriefcaseBusiness} label="Jurusan / program studi" name="major" onChange={update} placeholder="Contoh: Desain Komunikasi Visual" value={data.major} />
        <Field icon={BriefcaseBusiness} label="Divisi magang" name="division" onChange={update} placeholder="Contoh: Digital Marketing" value={data.division} />
        <Field icon={CalendarDays} label="Tanggal mulai magang" name="startDate" onChange={update} placeholder="dd/mm/yyyy" type="date" value={data.startDate} />
        <Field icon={CalendarDays} label="Tanggal akhir magang" name="endDate" onChange={update} placeholder="dd/mm/yyyy" type="date" value={data.endDate} />

        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#405047]">Pas foto formal<b className="ml-1 text-[#9bbd2f]">*</b></span>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#dfe7db] bg-[#fbfcf9] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#f0f8d6] text-[#657d20]"><ImagePlus size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-[#304324]">Upload pas foto</p>
                  <p className="text-xs text-[#75837b]">JPG / JPEG / PNG • latar biru atau merah</p>
                </div>
              </div>
              <input accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="block w-full max-w-[220px] text-sm text-[#405047] file:mr-4 file:rounded-xl file:border-0 file:bg-[#24332d] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#34483d]" name="photo" onChange={handlePhotoChange} required type="file" />
            </div>
          </label>

          {data.photo && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#dfe7db] bg-[#f9fbf7] p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#78951e]">Preview foto</p>
              <img alt="Preview pas foto peserta" className="h-40 w-32 rounded-xl object-cover shadow-sm" src={data.photo} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#edf1eb] pt-6 sm:flex-row sm:items-center">
        <p className="max-w-sm text-xs leading-5 text-[#8a968e]">Dengan mengirimkan data, kamu menyetujui data digunakan untuk kebutuhan administrasi program magang.</p>
        <button className="group inline-flex w-full shrink-0 items-center justify-center gap-3 rounded-xl bg-[#24332d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#34483d] sm:w-auto" type="submit">Kirim data <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></button>
      </div>
    </form>
  )
}
