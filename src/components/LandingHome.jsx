import { AnimatePresence, motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, ImageOff, Sparkles, Users } from 'lucide-react'
import { QrPanel } from './QrPanel'

const internshipRules = [
  { title: 'Kehadiran dan kedisiplinan', content: 'Peserta magang wajib hadir sesuai jadwal dan mengikuti ketentuan waktu kerja yang berlaku di lingkungan unit kerja.' },
  { title: 'Identitas peserta', content: 'Peserta wajib menggunakan ID Card selama berada di lingkungan kerja apabila diwajibkan oleh pihak perusahaan.' },
  { title: 'Sopan santun dan etika', content: 'Peserta wajib menjaga sikap, sopan santun, komunikasi, dan etika selama berada di lingkungan kerja.' },
  { title: 'Pakaian', content: 'Peserta wajib menggunakan pakaian yang rapi, sopan, dan sesuai dengan ketentuan yang berlaku di lingkungan kerja.' },
  { title: 'Menjaga fasilitas', content: 'Peserta wajib menjaga fasilitas, perangkat, dokumen, dan lingkungan kerja yang digunakan selama kegiatan magang.' },
  { title: 'Kerahasiaan informasi', content: 'Peserta wajib menjaga kerahasiaan informasi, dokumen, data perusahaan, dan informasi internal yang diperoleh selama kegiatan magang.' },
  { title: 'Penggunaan perangkat dan sistem', content: 'Peserta hanya menggunakan perangkat, akun, jaringan, dan sistem perusahaan sesuai dengan izin dan kebutuhan pekerjaan.' },
  { title: 'Komunikasi dengan pembimbing', content: 'Peserta wajib mengikuti arahan pembimbing atau penanggung jawab selama menjalankan kegiatan magang.' },
  { title: 'Dokumentasi dan publikasi', content: 'Peserta tidak diperbolehkan menyebarkan dokumen, informasi internal, foto area kerja, atau informasi perusahaan tanpa izin.' },
  { title: 'Selesai masa magang', content: 'Peserta wajib menyelesaikan kegiatan sesuai dengan periode magang yang telah ditentukan dan mengikuti prosedur penyelesaian yang berlaku.' },
]

const revealVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

function Reveal({ children, className = '', id }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.18 })

  return <motion.div animate={isInView ? 'visible' : 'hidden'} className={className} id={id} initial="hidden" ref={ref} variants={revealVariants}>{children}</motion.div>
}

function CountUp({ value }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.6 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return undefined
    const duration = 700
    const startTime = performance.now()
    let frameId
    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.round(value * progress))
      if (progress < 1) frameId = requestAnimationFrame(animate)
    }
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [isInView, value])

  return <span ref={ref}>{count}</span>
}

function DataEmptyState({ label }) {
  return <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-[#d2d8dd] bg-[#f9fbfc] px-5 text-center"><ImageOff className="text-[#aaafb3]" size={20} /><p className="mt-2 text-sm text-[#838a91]">Belum ada {label} tersimpan.</p></div>
}

function formatPeriod(startDate, endDate) {
  if (!startDate && !endDate) return 'Periode belum diisi'

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(`${value}T12:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

export function LandingHome({ participants, onStart }) {
  const [openRule, setOpenRule] = useState(0)
  const divisions = [...new Set(participants.map((participant) => participant.division).filter(Boolean))]
  const institutions = [...new Set(participants.map((participant) => participant.institution).filter(Boolean))]
  const periods = [...new Set(participants.filter((participant) => participant.startDate && participant.endDate).map((participant) => `${participant.startDate} - ${participant.endDate}`))]
  const stats = [
    { label: 'Peserta magang', value: participants.length, icon: Users },
    { label: 'Divisi', value: divisions.length, icon: BriefcaseBusiness },
    { label: 'Periode', value: periods.length, icon: CalendarDays },
    { label: 'Institusi', value: institutions.length, icon: Building2 },
  ]

  return (
    <>
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)] lg:items-center lg:px-10 lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
          <motion.div animate={{ opacity: 1, y: 0 }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d7dde2] bg-white/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#556d84] shadow-sm" initial={{ opacity: 0, y: 14 }} transition={{ duration: 0.55 }}><Sparkles size={15} strokeWidth={2.5} /> Langkah pertama kamu</motion.div>
          <motion.h1 animate={{ opacity: 1, y: 0 }} className="max-w-lg text-5xl font-extrabold leading-[0.98] tracking-[-0.06em] text-[#1f2830] sm:text-7xl" initial={{ opacity: 0, y: 22 }} transition={{ delay: 0.12, duration: 0.65 }}>Selamat datang di <span className="text-[#315e8b]">Pelindo.</span></motion.h1>
          <motion.p animate={{ opacity: 1, y: 0 }} className="mt-7 max-w-md text-lg leading-8 text-[#556e86]" initial={{ opacity: 0, y: 18 }} transition={{ delay: 0.24, duration: 0.6 }}>Lengkapi data diri kamu untuk memulai pengalaman magang yang lebih terarah dan terhubung.</motion.p>
          <motion.div animate={{ opacity: 1, y: 0 }} className="mt-10 flex flex-wrap items-center gap-5" initial={{ opacity: 0, y: 16 }} transition={{ delay: 0.36, duration: 0.6 }}>
            <button className="group inline-flex items-center gap-3 rounded-xl bg-[#222c35] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(36,51,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#303e4c] hover:shadow-[0_16px_28px_rgba(36,51,45,0.22)]" onClick={onStart} type="button">Mulai pendataan <ArrowRight className="transition-transform group-hover:translate-x-1" size={17} /></button>
            <span className="text-sm font-medium text-[#828991]">Hanya perlu 2 menit</span>
          </motion.div>
          <motion.div animate={{ opacity: 1 }} className="mt-14 grid max-w-md grid-cols-3 gap-4 border-t border-[#dbdfe3] pt-5 text-sm" initial={{ opacity: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
            <div><strong className="block text-xl text-[#222c35]">01</strong><span className="text-[#7a828a]">Scan QR</span></div><div><strong className="block text-xl text-[#222c35]">02</strong><span className="text-[#7a828a]">Isi data</span></div><div><strong className="block text-xl text-[#222c35]">03</strong><span className="text-[#7a828a]">Tersimpan</span></div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -5 }}><QrPanel onContinue={onStart} /></motion.div>
      </section>

      <Reveal className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10" id="alur">
        <div className="rounded-[2rem] bg-[#222c35] p-6 text-white shadow-[0_20px_45px_rgba(36,51,45,0.12)] sm:p-8"><div className="mb-8 flex items-start justify-between gap-5"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#659fd8]">Alur pendataan</p><h2 className="text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Sederhana dari awal sampai tersimpan.</h2></div><Sparkles className="shrink-0 text-[#659fd8]" size={24} /></div><div className="grid gap-3 sm:grid-cols-4">{['Scan QR', 'Isi data', 'Submit', 'Data tersimpan'].map((step, index) => <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={step}><span className="text-xs font-bold text-[#659fd8]">0{index + 1}</span><p className="mt-7 text-sm font-bold text-white">{step}</p></div>)}</div></div>
      </Reveal>

      <Reveal className="mx-auto w-full max-w-7xl px-6 pb-10 lg:px-10" id="peserta-terdata">
        <div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Peserta magang</p><h2 className="text-3xl font-extrabold tracking-[-0.05em] text-[#1f2830] sm:text-4xl">Peserta yang sudah terdata</h2></div>{participants.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{participants.slice(0, 6).map((participant) => <motion.div className="rounded-2xl border border-[#dbdfe3] bg-white p-5 shadow-[0_12px_30px_rgba(36,51,45,0.04)]" key={participant.id} whileHover={{ y: -4 }}><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#cedff0] font-extrabold text-[#305880]">{participant.name.charAt(0).toUpperCase()}</span><div><h3 className="font-extrabold text-[#303e4c]">{participant.name}</h3><p className="text-xs text-[#838a91]">{participant.institution || 'Institusi belum diisi'}</p></div></div><p className="mt-5 text-sm text-[#556e86]">{participant.major || 'Program studi belum diisi'}</p><p className="mt-1 text-xs font-bold text-[#2f5a84]">{participant.division || 'Divisi belum diisi'}</p><p className="mt-3 border-t border-[#eceef0] pt-3 text-xs font-semibold text-[#838a91]"><span className="font-bold uppercase tracking-[0.1em] text-[#9aa0a6]">Periode:</span> {formatPeriod(participant.startDate, participant.endDate)}</p></motion.div>)}</div> : <DataEmptyState label="peserta" />}
      </Reveal>

      <Reveal className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10" id="statistik">
        <div className="mb-7 flex items-end justify-between gap-5"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Data saat ini</p><h2 className="text-3xl font-extrabold tracking-[-0.05em] text-[#1f2830] sm:text-4xl">Ringkasan pendataan</h2></div><span className="text-xs font-semibold text-[#838a91]">Terhubung dengan data peserta</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <motion.div className="rounded-2xl border border-[#dbdfe3] bg-white p-5 shadow-[0_12px_30px_rgba(36,51,45,0.04)]" key={label} whileHover={{ y: -4, boxShadow: '0 18px 32px rgba(36,51,45,0.09)' }}><div className="mb-8 flex items-center justify-between"><span className="text-sm font-bold text-[#556d84]">{label}</span><Icon className="text-[#2f5a84]" size={20} /></div><strong className="block text-4xl font-extrabold tracking-[-0.05em] text-[#222c35]"><CountUp value={value} /></strong></motion.div>)}</div>
      </Reveal>

      <Reveal className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10" id="informasi">
        <section className="grid gap-8 rounded-[2rem] border border-[#dbdfe3] bg-[#f9fbfc] p-6 shadow-[0_18px_45px_rgba(36,51,45,0.06)] sm:p-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12 lg:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Informasi peserta</p>
              <h2 className="max-w-sm text-3xl font-extrabold leading-tight tracking-[-0.05em] text-[#1f2830] sm:text-4xl">Informasi &amp; Aturan Magang</h2>
              <p className="mt-4 max-w-sm text-base leading-7 text-[#556e86]">Perhatikan beberapa ketentuan berikut selama mengikuti kegiatan magang.</p>
            </div>
            <div className="mt-8 rounded-2xl border border-[#b0c7de] bg-[#dbe7f3] p-4 text-sm text-[#24425f] lg:mt-12">
              <p className="font-extrabold">Catatan</p>
              <p className="mt-2 leading-6">Ketentuan dapat disesuaikan dengan kebijakan dan arahan yang berlaku di lingkungan PT Pelindo Regional 1 Dumai.</p>
            </div>
          </div>

          <div className="divide-y divide-[#e2e5e9] overflow-hidden rounded-2xl border border-[#dde1e5] bg-white">
            {internshipRules.map((rule, index) => {
              const isOpen = openRule === index

              return (
                <div className="transition-colors hover:bg-[#f8fafc]" key={rule.title}>
                  <button aria-expanded={isOpen} className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5" onClick={() => setOpenRule(isOpen ? null : index)} type="button">
                    <span className="w-8 shrink-0 font-mono text-xs font-medium text-[#84919d]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-sm font-extrabold text-[#303e4c] sm:text-base">{rule.title}</span>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-lg font-medium leading-none transition-all duration-300 ${isOpen ? 'rotate-0 border-[#5c8ab7] bg-[#d6e4f2] text-[#2d4f70]' : 'border-[#dbdfe3] text-[#2f5a84]'}`}>{isOpen ? '−' : '+'}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                        <p className="px-4 pb-5 pl-16 text-sm leading-6 text-[#556e86] sm:px-5 sm:pl-[4.75rem]">{rule.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>
      </Reveal>

    </>
  )
}
