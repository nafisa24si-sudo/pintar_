import { Check, RotateCcw } from 'lucide-react'

export function SuccessState({ onBack, onViewIdCard, participant }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-24 pt-20 text-center lg:pt-28">
      <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-[#659fd8] text-[#28343f] shadow-[0_0_0_12px_#c3d9ee]"><Check size={38} strokeWidth={3} /></div>
      <span className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-[#2f5a84]">Pendataan berhasil!</span>
      <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.06em] text-[#1f2830]">Data kamu sudah berhasil tersimpan.</h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-[#757c83]">ID Card Peserta Magang kamu sudah siap.</p>
      <div className="mt-6 rounded-xl border border-[#dbdfe3] bg-[#f9fbfc] px-5 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2f5a84]">ID peserta</p>
        <p className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#1f2830]">{participant?.participantCode || 'MAGANG-2026-001'}</p>
      </div>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#222c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={onViewIdCard} type="button">Lihat ID Card</button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#dbdfe3] bg-white px-5 py-3 text-sm font-bold text-[#384858] transition hover:border-[#5c8ab7] hover:bg-[#ecf2f8]" onClick={onBack} type="button"><RotateCcw size={16} /> Kembali ke Beranda</button>
      </div>
    </section>
  )
}
