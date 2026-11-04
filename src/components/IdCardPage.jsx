import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'
import { createAttendanceQrValue } from './attendanceUtils'

const formatPeriod = (startDate, endDate) => {
  if (!startDate && !endDate) return '-'
  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null

  const formatDate = (date) => {
    if (!date || Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  }

  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
  return start ? formatDate(start) : formatDate(end)
}

function CardField({ label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <p className="text-[7px] font-black uppercase tracking-[0.16em] text-[#72879a]">{label}</p>
      <p className="mt-1 break-words text-[9px] font-bold leading-[1.25] text-[#1f3448]">{value || '-'}</p>
    </div>
  )
}

function IdCardFrame({ participant }) {
  const photoSrc = participant.photo || '/placeholder-avatar.png'

  return (
    <div className="id-card-face id-card-front aspect-[3/4] w-full max-w-[320px]">
      <div className="h-full w-full overflow-hidden rounded-[24px] border border-[#d6e0e8] bg-white shadow-[0_16px_34px_rgba(30,60,86,0.14)] print:rounded-none print:border-0 print:shadow-none">
        <div className="flex h-full flex-col text-[#1f3448]">
          <header className="flex h-[106px] shrink-0 flex-col items-center bg-[#174f7a] px-4 pt-3 text-center text-white">
            <span className="rounded-md bg-white px-2 py-0.5">
              <img alt="Pelindo" className="h-5 w-auto object-contain" src="/pelindo-logo.png" />
            </span>
            <p className="mt-2 text-[8px] font-extrabold uppercase tracking-[0.16em]">PT Pelindo Regional 1</p>
            <p className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.2em] text-[#d9e8f4]">Dumai</p>
          </header>

          <div className="-mt-8 flex justify-center">
            <div className="h-[120px] w-[96px] overflow-hidden rounded-[16px] border-[4px] border-white bg-[#e4eff7] shadow-[0_7px_18px_rgba(23,79,122,0.18)]">
              {photoSrc === '/placeholder-avatar.png' ? (
                <div className="flex h-full w-full items-center justify-center bg-[#dceaf5]">
                  <div className="relative h-12 w-12 rounded-full bg-white">
                    <div className="absolute left-1/2 top-[10px] h-4 w-4 -translate-x-1/2 rounded-full bg-[#a7c3da]" />
                    <div className="absolute bottom-[8px] left-1/2 h-7 w-8 -translate-x-1/2 rounded-t-[14px] bg-[#a7c3da]" />
                  </div>
                </div>
              ) : (
                <img alt={participant.name || 'Pas foto peserta'} className="h-full w-full object-cover" src={photoSrc} />
              )}
            </div>
          </div>

          <div className="px-4 pt-2 text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#39739d]">Peserta Magang</p>
            <h2 className="mt-1 break-words text-[14px] font-extrabold leading-tight text-[#183b59]">{participant.name || 'Nama Peserta'}</h2>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 px-4 text-left">
            <CardField label="Institusi" value={participant.institution} wide />
            <CardField label="Program Studi" value={participant.major} wide />
            <CardField label="Divisi" value={participant.division} />
            <CardField label="Periode" value={formatPeriod(participant.startDate, participant.endDate)} />
          </div>

          <div className="mx-4 mb-3 mt-auto flex items-center justify-between gap-2 rounded-xl bg-[#eaf2f8] px-3 py-2">
            <span className="text-[7px] font-black uppercase tracking-[0.16em] text-[#55728b]">ID Peserta</span>
            <span className="min-w-0 break-all text-right font-mono text-[9px] font-bold text-[#174f7a]">{participant.participantCode || 'MAGANG-2026-001'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function IdCardBack({ participant }) {
  const qrValue = createAttendanceQrValue(participant)

  return (
    <div className="id-card-face id-card-back aspect-[3/4] w-full max-w-[320px]">
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#d6e0e8] bg-white text-center text-[#1f3448] shadow-[0_16px_34px_rgba(30,60,86,0.14)] print:rounded-none print:border-0 print:shadow-none">
        <header className="flex h-[100px] shrink-0 flex-col items-center bg-[#174f7a] px-4 pt-4 text-white">
          <span className="rounded-md bg-white px-2 py-0.5">
            <img alt="Pelindo" className="h-5 w-auto object-contain" src="/pelindo-logo.png" />
          </span>
          <p className="mt-2 text-[8px] font-extrabold uppercase tracking-[0.16em]">PT Pelindo Regional 1 Dumai</p>
        </header>
        <div className="-mt-6 flex justify-center">
          <div className="rounded-[18px] border border-[#d6e0e8] bg-white p-3 shadow-[0_8px_20px_rgba(23,79,122,0.12)]">
            {qrValue ? <QRCodeSVG aria-label={`QR absensi ${participant.name || 'peserta'}`} bgColor="#ffffff" fgColor="#183b59" level="M" size={160} value={qrValue} /> : <p className="grid h-40 w-40 place-items-center text-xs text-[#757c83]">Kode peserta tidak tersedia</p>}
          </div>
        </div>
        <p className="mt-3 text-[8px] font-black uppercase tracking-[0.2em] text-[#39739d]">QR Absensi Peserta</p>
        <div className="mx-5 mt-3 rounded-xl bg-[#eaf2f8] px-3 py-2 font-mono text-[9px] font-bold text-[#174f7a]">
          {participant.participantCode || participant.id || 'Kode peserta'}
        </div>
        <p className="mx-auto mt-auto max-w-[220px] px-5 pb-5 pt-3 text-[9px] leading-[1.45] text-[#647b8d]">QR berisi kode peserta saja. Pemindaian membantu pencarian data, bukan verifikasi identitas pemegang kartu.</p>
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
