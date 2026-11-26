import { Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export function QrPanel() {
  const formUrl = `${window.location.origin}/?daftar=magang`

  return (
    <div className="relative">
      <div className="relative rounded-[1.45rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex rounded-full border border-white/70 bg-white/65 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#30587f]">Scan me</span>
            <h2 className="max-w-[230px] text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[#222c35]">Scan QR untuk pendataan</h2>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/70 bg-white/65 text-[#315e8b] shadow-sm">
            <Smartphone size={22} />
          </span>
        </div>
        <div className="mx-auto mt-7 flex w-fit rounded-2xl border border-white bg-white p-2.5 shadow-[0_12px_30px_rgba(34,44,53,0.12)]">
          <QRCodeSVG value={formUrl} size={190} bgColor="#ffffff" fgColor="#222c35" level="H" includeMargin />
        </div>
        <p className="mx-auto mt-5 max-w-xs text-center text-sm leading-6 text-[#46596b]">Arahkan kamera ponsel kamu ke QR code di atas untuk membuka form pendataan peserta.</p>
      </div>
    </div>
  )
}
