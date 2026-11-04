import { ArrowRight, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export function QrPanel({ onContinue }) {
  const formUrl = `${window.location.origin}/?daftar=magang`

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#accae8] p-5 shadow-[0_24px_60px_rgba(95,124,40,0.12)] transition-shadow duration-300 hover:shadow-[0_28px_70px_rgba(95,124,40,0.2)] sm:p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[26px] border-white/25" />
      <div className="relative rounded-[1.45rem] bg-white p-7 sm:p-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex rounded-full bg-[#dbe7f3] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#30587f]">Scan me</span>
            <h2 className="max-w-[230px] text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[#222c35]">Scan QR untuk pendataan</h2>
          </div>
          <Smartphone className="text-[#315e8b]" size={28} />
        </div>
        <div className="mx-auto mt-8 flex w-fit rounded-2xl bg-[#f7f9fb] p-4 shadow-[0_8px_20px_rgba(36,51,45,0.08)] ring-1 ring-[#e9edf1]">
          <QRCodeSVG value={formUrl} size={190} bgColor="#f7f9fb" fgColor="#222c35" level="H" includeMargin />
        </div>
        <p className="mx-auto mt-5 max-w-xs text-center text-sm leading-6 text-[#838a91]">Arahkan kamera ponsel kamu ke QR code di atas untuk membuka form pendataan peserta.</p>
        <button className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbdfe3] bg-white px-4 py-3 text-sm font-bold text-[#222c35] transition hover:border-[#5c8ab7] hover:bg-[#ecf2f8]" onClick={onContinue} type="button">
          Isi lewat perangkat ini <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
