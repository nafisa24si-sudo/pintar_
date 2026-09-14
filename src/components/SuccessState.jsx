import { Check, RotateCcw } from 'lucide-react'

export function SuccessState({ onBack, onViewIdCard, participant }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-24 pt-20 text-center lg:pt-28">
      <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-[#c7ee4f] text-[#304324] shadow-[0_0_0_12px_#e7f6bb]"><Check size={38} strokeWidth={3} /></div>
      <span className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-[#78951e]">Pendataan berhasil!</span>
      <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.06em] text-[#1f3028]">Data kamu sudah berhasil tersimpan.</h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-[#75837b]">ID Card Peserta Magang kamu sudah siap.</p>
      <div className="mt-6 rounded-xl border border-[#dce5d9] bg-[#fbfcf9] px-5 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#78951e]">ID peserta</p>
        <p className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#1f3028]">{participant?.participantCode || 'MAGANG-2026-001'}</p>
      </div>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#24332d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#34483d]" onClick={onViewIdCard} type="button">Lihat ID Card</button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#dce5d9] bg-white px-5 py-3 text-sm font-bold text-[#405047] transition hover:border-[#abc94a] hover:bg-[#f7fbe9]" onClick={onBack} type="button"><RotateCcw size={16} /> Kembali ke Beranda</button>
      </div>
    </section>
  )
}
