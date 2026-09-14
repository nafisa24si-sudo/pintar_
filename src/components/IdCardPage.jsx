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

function IdCardFrame({ participant }) {
  const photoSrc = participant.photo || '/placeholder-avatar.png'

  return (
    <div className="id-card-print-scope w-[min(360px,calc(100vw-32px))] aspect-[3/4]">
      <div className="h-full w-full overflow-hidden rounded-[26px] border border-[#dfe4d9] bg-[#f3f5f0] shadow-[0_12px_28px_rgba(36,51,45,0.08)] print:border-0 print:shadow-none">
        <div className="flex h-full flex-col bg-[#f7f7f4] px-5 pb-4 pt-4 text-[#24332d]">
          <header className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#dfead2] text-[11px] font-black uppercase tracking-[0.12em] text-[#24332d]">
              PT
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#24332d]">PT Pelindo Regional 1</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#24332d]">DUMAI</p>
            <div className="mt-3 inline-flex items-center rounded-full border border-[#d6e1c9] bg-[#e9f3d6] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#526b18]">Peserta Magang</div>
          </header>

          <div className="mt-5 flex justify-center">
            <div className="h-[118px] w-[102px] overflow-hidden rounded-[14px] bg-[#1f78d1] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]">
              {photoSrc === '/placeholder-avatar.png' ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a6dca] to-[#2c92fd]">
                  <div className="relative h-12 w-12 rounded-full bg-white/90">
                    <div className="absolute left-1/2 top-[10px] h-4 w-4 -translate-x-1/2 rounded-full bg-[#dfe5f1]" />
                    <div className="absolute bottom-[8px] left-1/2 h-7 w-8 -translate-x-1/2 rounded-t-[14px] bg-[#dfe5f1]" />
                  </div>
                </div>
              ) : (
                <img alt={participant.name || 'Pas foto peserta'} className="h-full w-full object-cover" src={photoSrc} />
              )}
            </div>
          </div>

          <div className="mt-5 space-y-2 text-left">
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-[0.18em] text-[#8a978d]">Nama</p>
              <p className="mt-1 text-[12px] font-extrabold leading-[1.3] text-[#24332d]">{participant.name || 'Nama Peserta'}</p>
            </div>
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-[0.18em] text-[#8a978d]">Institusi</p>
              <p className="mt-1 text-[10px] font-bold leading-[1.3] text-[#24332d]">{participant.institution || 'Institusi'}</p>
            </div>
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-[0.18em] text-[#8a978d]">Program Studi</p>
              <p className="mt-1 text-[10px] font-bold leading-[1.3] text-[#24332d]">{participant.major || 'Program Studi'}</p>
            </div>
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-[0.18em] text-[#8a978d]">Divisi</p>
              <p className="mt-1 text-[10px] font-bold leading-[1.3] text-[#24332d]">{participant.division || 'Divisi'}</p>
            </div>
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-[0.18em] text-[#8a978d]">Periode</p>
              <p className="mt-1 text-[10px] font-bold leading-[1.3] text-[#24332d]">{formatPeriod(participant.startDate, participant.endDate)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[12px] border border-[#dfe7db] bg-[#edf3e0] px-3 py-2 text-center">
            <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-[#8a978d]">ID Peserta</p>
            <p className="mt-1 text-[11px] font-black tracking-[0.08em] text-[#24332d]">{participant.participantCode || 'MAGANG-2026-001'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function IdCardPage({ participant, onBack, onFinish }) {
  const printIdCard = () => {
    window.print()
  }

  const downloadIdCard = () => {
    const card = document.querySelector('.id-card-print-scope')
    if (!card) {
      printIdCard()
      return
    }

    const serializer = new XMLSerializer()
    const svg = serializer.serializeToString(card)
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const image = new Image()

    canvas.width = 720
    canvas.height = 960

    image.onload = () => {
      context.fillStyle = '#f7f7f4'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 20, 20, 680, 920)
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${(participant?.participantCode || 'id-card').replace(/\s+/g, '-')}.png`
      link.click()
      URL.revokeObjectURL(url)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      printIdCard()
    }

    image.src = url
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <button className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#738178] transition hover:text-[#24332d] print:hidden" onClick={onBack} type="button">
        Kembali
      </button>

      <div className="mb-6 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#728b5f]">ID Card Peserta</p>
        <h1 className="mt-3 text-[clamp(2.3rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.06em] text-[#1f3028]">Kartu identitas peserta magang</h1>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <IdCardFrame participant={participant} />

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row print:hidden">
          <button className="flex-1 rounded-xl border border-[#dfe7db] bg-white px-4 py-3 text-sm font-bold text-[#24332d] transition hover:bg-[#f0f8d6]" onClick={downloadIdCard} type="button">
            Unduh ID Card
          </button>
          <button className="flex-1 rounded-xl bg-[#24332d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#34483d]" onClick={onFinish} type="button">
            Selesai
          </button>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24332d] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#34483d] print:hidden" onClick={printIdCard} type="button">
          Cetak ID Card
        </button>
      </div>
    </section>
  )
}

export const idCardPrintStyles = `
  @media print {
    @page { margin: 8mm; size: portrait; }
    body { background: white !important; }
    body * { visibility: hidden; }
    .id-card-print-scope, .id-card-print-scope * { visibility: visible; }
    .id-card-print-scope {
      position: absolute;
      left: 50%;
      top: 8mm;
      transform: translateX(-50%);
      width: min(360px, calc(100vw - 16mm));
      height: auto;
      margin: 0;
    }
    header, footer, nav, button, .print\:hidden, #kontak { display: none !important; }
    main { background: white !important; }
    section { padding: 0 !important; margin: 0 !important; }
  }
`
