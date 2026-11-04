import { useEffect } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatCertificateDate, isCertificateAvailable } from './certificateUtils'

export function CertificatePage({ participant, onBack, autoPrint = false, institutionLogo, pelindoLogo, signerName, signerTitle }) {
  const available = isCertificateAvailable(participant)
  const campusLogo = institutionLogo || participant?.institutionLogo || participant?.institution_logo

  useEffect(() => {
    if (autoPrint && available) window.requestAnimationFrame(() => window.print())
  }, [autoPrint, available])

  return (
    <section className="page-shell max-w-6xl">
      <style>{certificatePrintStyles}</style>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <button className="inline-flex items-center gap-2 text-sm font-bold text-[#556d84] hover:text-[#222c35]" onClick={onBack} type="button"><ArrowLeft size={16} /> Kembali</button>
        {available && <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#222c35] px-4 py-3 text-sm font-bold text-white hover:bg-[#303e4c]" onClick={() => window.print()} type="button"><Printer size={17} /> Cetak / Unduh PDF</button>}
      </div>

      {!available ? (
        <div className="rounded-xl border border-[#dde1e5] bg-white p-8 text-center">
          <h1 className="text-xl font-extrabold text-[#222c35]">Sertifikat belum tersedia</h1>
          <p className="mt-2 text-sm text-[#757c83]">Sertifikat belum tersedia karena periode magang masih berlangsung.</p>
        </div>
      ) : (
        <>
          <p className="mb-4 rounded-lg border border-[#e6e6d6] bg-[#fffdf4] px-4 py-3 text-sm leading-6 text-[#6b6857] print:hidden">
            Template menggunakan data peserta tersimpan. Logo resmi, nomor sertifikat, atau data penandatangan yang belum tersedia tidak dibuat atau digantikan dengan identitas rekaan.
          </p>
          <div className="overflow-x-auto pb-2">
            <article className="certificate-print-scope relative mx-auto aspect-[1.414/1] w-full min-w-[760px] max-w-[1120px] overflow-hidden bg-white font-serif text-[#102b55] shadow-[0_12px_32px_rgba(16,43,85,0.12)] print:min-w-0 print:shadow-none">
              <div className="pointer-events-none absolute inset-[10px] border-[3px] border-[#102b55]" />
              <div className="pointer-events-none absolute inset-[15px] border border-[#c38b27]" />
              <div className="pointer-events-none absolute left-0 top-0 h-[52%] w-[2.4%] bg-[#1479a9]" />
              <div className="pointer-events-none absolute left-[2.4%] top-0 h-[3.2%] w-[39%] bg-[#1479a9]" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-[24%] w-[15%] bg-[#1479a9]" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
              <div className="pointer-events-none absolute right-0 top-0 h-[22%] w-[15%] bg-[#102b55]" style={{ clipPath: 'polygon(40% 0, 100% 0, 100% 100%)' }} />
              <div className="pointer-events-none absolute bottom-0 right-0 h-[24%] w-[38%] bg-[#1479a9]" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
              <div className="pointer-events-none absolute bottom-[2.4%] left-[16%] right-[10%] h-[5px] bg-[#55b7d5]" />
              <span className="certificate-corner certificate-corner-tl" />
              <span className="certificate-corner certificate-corner-tr" />
              <span className="certificate-corner certificate-corner-bl" />
              <span className="certificate-corner certificate-corner-br" />

              <header className="absolute inset-x-[7%] top-[6%] z-[1] grid grid-cols-[1fr_1.8fr_1fr] items-start gap-5 bg-transparent text-center">
                <div className="flex h-24 items-start justify-start pt-1">
                  {campusLogo ? <img alt={`Logo ${participant.institution || 'institusi peserta'}`} className="max-h-24 max-w-28 object-contain" src={campusLogo} /> : <span className="max-w-28 text-left text-xs text-[#757c83]">Logo institusi belum tersedia</span>}
                </div>
                <div className="pt-1">
                  <h1 className="text-[54px] font-bold uppercase leading-none tracking-[0.04em] text-[#0b2c5b]">SERTIFIKAT</h1>
                  <p className="mt-3 text-[12px] uppercase tracking-[0.24em] text-[#102b55]">Nomor: {participant.certificateNumber || participant.certificate_number || 'Nomor sertifikat belum tersedia'}</p>
                </div>
                <div className="flex h-24 items-start justify-end pt-2">
                  {pelindoLogo ? <img alt="Logo resmi PT Pelindo Regional 1 Dumai" className="max-h-20 max-w-48 object-contain" src={pelindoLogo} /> : <span className="max-w-40 text-right text-xs text-[#757c83]">Logo resmi Pelindo belum tersedia</span>}
                </div>
              </header>

              <div className="absolute inset-x-[9%] top-[29%] z-[1] text-center">
                <p className="text-[17px] uppercase tracking-[0.06em]">Diberikan kepada:</p>
                <h2 className="mt-8 text-[42px] font-bold uppercase leading-tight tracking-[0.025em] text-[#0b2c5b]">{participant.name || '-'}</h2>
                <div className="mx-auto mt-1 flex max-w-[720px] items-center gap-2 text-[#c28b2b]">
                  <span className="h-[2px] flex-1 bg-[#c28b2b]" /><span className="h-2 w-2 rotate-45 bg-[#c28b2b]" /><span className="h-[2px] flex-1 bg-[#c28b2b]" />
                </div>
                <p className="mx-auto mt-7 max-w-[850px] text-[17px] leading-[1.55] text-[#142b4d]">
                  Sebagai bentuk apresiasi atas keberhasilan dalam melaksanakan Kerja Praktik, dari tanggal {formatCertificateDate(participant.startDate)} sampai dengan {formatCertificateDate(participant.endDate)}, di bagian {participant.division || '-'} PT. Pelabuhan Indonesia (Persero) Regional 1 Dumai, dengan sangat baik.
                </p>
                <p className="mt-3 text-[14px] leading-6 text-[#142b4d]">{participant.institution || '-'}{participant.major ? ` - ${participant.major}` : ''}</p>
              </div>

              <footer className="absolute bottom-[8%] left-1/2 z-[1] w-[340px] -translate-x-1/2 bg-transparent text-center text-[#142b4d]">
                <div className="mx-auto mb-4 flex w-[250px] items-center justify-center gap-2 text-[#c28b2b]">
                  <span className="h-[2px] w-16 bg-[#c28b2b]" /><span className="h-2 w-2 rotate-45 border border-[#c28b2b]" /><span className="h-[2px] w-16 bg-[#c28b2b]" />
                </div>
                <p className="text-[14px] font-bold uppercase leading-[1.3]">PT. Pelabuhan Indonesia (Persero)<br />Regional 1 Dumai</p>
                <div className="mt-12 border-t border-transparent pt-1">
                  {signerName && signerTitle ? <><p className="text-[14px] font-bold underline underline-offset-2">{signerName}</p><p className="text-[13px] font-bold uppercase">{signerTitle}</p></> : <p className="text-xs text-[#757c83]">Data nama dan jabatan penandatangan belum tersedia</p>}
                </div>
              </footer>
            </article>
          </div>
        </>
      )}
    </section>
  )
}

export const certificatePrintStyles = `
  .certificate-corner { position: absolute; z-index: 1; width: 48px; height: 48px; color: #c28b2b; }
  .certificate-corner::before, .certificate-corner::after { position: absolute; content: ''; border: 2px solid currentColor; border-radius: 50%; }
  .certificate-corner::before { width: 29px; height: 29px; }
  .certificate-corner::after { width: 13px; height: 13px; }
  .certificate-corner-tl { top: 6px; left: 6px; border-top: 3px solid currentColor; border-left: 3px solid currentColor; }
  .certificate-corner-tl::before { top: 4px; left: 4px; }
  .certificate-corner-tl::after { top: 12px; left: 12px; }
  .certificate-corner-tr { top: 6px; right: 6px; border-top: 3px solid currentColor; border-right: 3px solid currentColor; }
  .certificate-corner-tr::before { top: 4px; right: 4px; }
  .certificate-corner-tr::after { top: 12px; right: 12px; }
  .certificate-corner-bl { bottom: 6px; left: 6px; border-bottom: 3px solid currentColor; border-left: 3px solid currentColor; }
  .certificate-corner-bl::before { bottom: 4px; left: 4px; }
  .certificate-corner-bl::after { bottom: 12px; left: 12px; }
  .certificate-corner-br { right: 6px; bottom: 6px; border-right: 3px solid currentColor; border-bottom: 3px solid currentColor; }
  .certificate-corner-br::before { right: 4px; bottom: 4px; }
  .certificate-corner-br::after { right: 12px; bottom: 12px; }

  @media print {
    @page { margin: 0; size: A4 landscape; }
    body { background: white !important; }
    body:has(.certificate-print-scope) * { visibility: hidden; }
    body:has(.certificate-print-scope) .certificate-print-scope,
    body:has(.certificate-print-scope) .certificate-print-scope * { visibility: visible; }
    body:has(.certificate-print-scope) .certificate-print-scope { position: absolute; inset: 0; width: 100%; max-width: none; min-height: 0; margin: 0; aspect-ratio: 1.414 / 1; }
    body:has(.certificate-print-scope) header,
    body:has(.certificate-print-scope) button,
    body:has(.certificate-print-scope) .print\\:hidden { display: none !important; }
    body:has(.certificate-print-scope) .certificate-print-scope > header { display: grid !important; }
    body:has(.certificate-print-scope) .certificate-print-scope > footer { display: block !important; }
    main { background: white !important; }
  }
`
