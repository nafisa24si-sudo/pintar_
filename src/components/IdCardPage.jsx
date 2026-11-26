import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'
import { createAttendanceQrValue } from './attendanceUtils'

export function IdCardFrame({ participant }) {
  const photoSrc = participant.photo || '/placeholder-avatar.png'
  const internshipYear = participant.startDate
    ? String(participant.startDate).slice(0, 4)
    : '2026'

  return (
    <div className="id-card-face id-card-front aspect-[3/4] w-full max-w-[320px]">
      <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-[#91aeca]/60 bg-[#08284d] text-white shadow-[0_18px_38px_rgba(20,53,87,0.28)] print:rounded-none print:border-0 print:shadow-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(91,157,214,.42),transparent_24%),linear-gradient(145deg,#1a568b_0%,#0b3563_42%,#061d3a_100%)]" />
        <div className="absolute -right-16 top-16 h-52 w-52 rounded-full border-[22px] border-white/[0.07]" />
        <div className="absolute -left-20 bottom-16 h-56 w-56 rounded-full border-[26px] border-[#72afe1]/[0.09]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(30deg,transparent_40%,rgba(255,255,255,.28)_41%,rgba(255,255,255,.28)_42%,transparent_43%),linear-gradient(150deg,transparent_40%,rgba(255,255,255,.20)_41%,rgba(255,255,255,.20)_42%,transparent_43%)] [background-size:72px_72px]" />

        <header className="absolute left-5 right-5 top-5 z-20 flex h-[48px] items-center justify-center rounded-[15px] bg-white px-3.5 shadow-[0_8px_24px_rgba(4,31,62,0.20)]">
          <div className="flex items-center gap-2">
            <img alt="Danantara" className="h-6 w-[84px] object-contain" src="/danantara-logo.png" />
            <img alt="Pelindo" className="h-6 w-[84px] object-contain" src="/pelindo-logo.png" />
          </div>
        </header>

        <div className="absolute inset-x-7 bottom-[105px] top-[92px] z-10 overflow-hidden rounded-[28px] border border-white/35 bg-[#a9bdd1]/25 shadow-[inset_0_0_26px_rgba(255,255,255,.10),0_8px_24px_rgba(3,24,50,.16)]">
          {photoSrc === '/placeholder-avatar.png' ? (
            <div className="flex h-full items-end justify-center bg-gradient-to-b from-[#82aad1]/45 to-[#315f8a]/70">
              <div className="relative mb-12 h-32 w-32 rounded-full bg-white/20">
                <div className="absolute left-1/2 top-6 h-14 w-14 -translate-x-1/2 rounded-full bg-white/35" />
                <div className="absolute bottom-0 left-1/2 h-[72px] w-28 -translate-x-1/2 rounded-t-[52px] bg-white/35" />
              </div>
            </div>
          ) : (
            <img alt={participant.name || 'Pas foto peserta'} className="h-full w-full object-cover object-center" src={photoSrc} />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_48%,rgba(3,24,50,.10)_65%,rgba(3,18,39,.88)_100%)]" />
          <div className="absolute bottom-5 left-4 right-4 text-center">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.22em] text-[#dcecff]/85">{participant.division || 'Peserta Magang'}</p>
            <h2 className="mt-1.5 break-words text-[17px] font-extrabold uppercase leading-tight tracking-[0.04em] text-white drop-shadow-lg">{participant.name || 'Nama Peserta'}</h2>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 flex h-[90px] items-end justify-between px-5 pb-5">
          <div className="min-w-0 pr-3">
            <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-[#9eb3c8]">PT Pelindo Regional 1 Dumai</p>
            <p className="mt-1 max-w-[190px] truncate text-[9px] font-bold text-white/95">{participant.institution || 'Institusi'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[7px] font-bold uppercase tracking-[0.16em] text-[#9eb3c8]">Intern</p>
            <p className="mt-1 text-[12px] font-extrabold tracking-[0.08em] text-white">{internshipYear}</p>
          </div>
        </div>

        <div className="absolute right-3 top-[64px] z-10 flex flex-col gap-1.5 opacity-30">
          {[0, 1, 2].map((ring) => <span className="grid h-7 w-7 place-items-center rounded-full border border-white/30" key={ring}><span className="h-2.5 w-2.5 rounded-full border border-white/30" /></span>)}
        </div>
      </div>
    </div>
  )
}

function IdCardBack({ participant }) {
  const qrValue = createAttendanceQrValue(participant)

  return (
    <div className="id-card-face id-card-back aspect-[3/4] w-full max-w-[320px]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#91aeca]/60 bg-[#08284d] text-center text-white shadow-[0_18px_38px_rgba(20,53,87,0.28)] print:rounded-none print:border-0 print:shadow-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(91,157,214,.35),transparent_28%),linear-gradient(145deg,#164e7f_0%,#082b53_48%,#06172f_100%)]" />
        <header className="relative z-10 px-5 pt-5">
          <div className="flex h-[48px] items-center justify-center rounded-[15px] bg-white px-3.5 shadow-[0_8px_24px_rgba(4,31,62,0.20)]">
            <div className="flex items-center gap-2">
              <img alt="Danantara" className="h-6 w-[84px] object-contain" src="/danantara-logo.png" />
              <img alt="Pelindo" className="h-6 w-[84px] object-contain" src="/pelindo-logo.png" />
            </div>
          </div>
        </header>
        <div className="relative z-10 mt-8 flex flex-1 flex-col items-center px-5">
          <div className="rounded-[22px] border border-white/35 bg-white p-3 shadow-[0_12px_28px_rgba(3,20,42,0.28)]">
            {qrValue ? <QRCodeSVG aria-label={`QR absensi ${participant.name || 'peserta'}`} bgColor="#ffffff" fgColor="#183b59" level="M" size={150} value={qrValue} /> : <p className="grid h-[150px] w-[150px] place-items-center text-xs text-[#757c83]">Kode peserta tidak tersedia</p>}
          </div>
          <p className="mt-4 text-[8px] font-extrabold uppercase tracking-[0.24em] text-[#dcecff]">QR Absensi Peserta</p>
          <div className="mt-3 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 font-mono text-[9px] font-bold text-white backdrop-blur-sm">
            {participant.participantCode || participant.id || 'Kode peserta'}
          </div>
          <p className="mx-auto mt-auto max-w-[230px] px-2 pb-5 pt-4 text-[8px] leading-[1.55] text-[#b8c8d8]">QR berisi kode peserta. Pemindaian membantu pencarian data absensi peserta.</p>
        </div>
      </div>
    </div>
  )
}

export function IdCardPage({ participant, onBack, onFinish }) {
  const printIdCard = () => {
    window.print()
  }

  const downloadIdCard = printIdCard

  return (
    <section className="page-shell max-w-4xl">
      <button className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#737a81] transition hover:text-[#222c35] print:hidden" onClick={onBack} type="button">
        Kembali
      </button>

      <div className="mb-6 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#657585]">ID Card Peserta</p>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1] tracking-[-0.06em] text-[#1f2830]">Kartu identitas peserta magang</h1>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <style>{idCardPrintStyles}</style>
        <div className="id-card-print-scope grid w-full grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 sm:items-center sm:gap-6">
          <IdCardFrame participant={participant} />
          <IdCardBack participant={participant} />
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row print:hidden">
          <button className="flex-1 rounded-xl bg-[#222c35] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={downloadIdCard} type="button"><Printer className="mr-2 inline" size={16} />Cetak / simpan PDF</button>
          <button className="flex-1 rounded-xl border border-[#dde1e5] bg-white px-4 py-3 text-sm font-bold text-[#222c35] transition hover:bg-[#dbe7f3]" onClick={onFinish} type="button">Selesai</button>
        </div>
      </div>
    </section>
  )
}

export const idCardPrintStyles = `
  @media print {
    @page { margin: 8mm; size: landscape; }
    body { background: white !important; }
    body * { visibility: hidden; }
    .id-card-print-scope, .id-card-print-scope * { visibility: visible; }
    .id-card-print-scope {
      position: absolute;
      left: 50%;
      top: 8mm;
      transform: translateX(-50%);
      display: grid !important;
      grid-template-columns: repeat(2, 90mm);
      gap: 10mm;
      width: max-content;
      margin: 0;
    }
    .id-card-face { width: 90mm !important; max-width: none !important; height: 120mm !important; }
    body:has(.id-card-print-scope) #root > main > header,
    body:has(.id-card-print-scope) #root > main > footer,
    body:has(.id-card-print-scope) button { display: none !important; }
    main { background: white !important; }
    section { padding: 0 !important; margin: 0 !important; }
  }
`
