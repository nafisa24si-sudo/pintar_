import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Award, CalendarCheck2, CheckCircle2, ChevronDown, ClipboardCheck, ClipboardList, Menu, Users, X } from 'lucide-react'
import { BrandMark } from './components/BrandMark'
import { AdminPage } from './components/AdminPage'
import { AdminLogin } from './components/AdminLogin'
import { InternshipForm } from './components/InternshipForm'
import { LandingHome } from './components/LandingHome'
import { ParticipantsPage } from './components/ParticipantsPage'
import { ParticipantDetail } from './components/ParticipantDetail'
import { SuccessState } from './components/SuccessState'
import { IdCardPage } from './components/IdCardPage'
import { CertificatePage } from './components/CertificatePage'
import { CertificateDirectory } from './components/CertificateDirectory'
import { AttendancePage } from './components/AttendancePage'
import { AttendanceReminder } from './components/AttendanceReminder'
import { isCertificateAvailable } from './components/certificateUtils'
import { ParticipantLogin } from './components/ParticipantLogin'
import { ParticipantPage } from './components/ParticipantPage'
import { getParticipantForSession, participantSessionStorageKey } from './components/participantAuth'

const homeSections = [
  { label: 'Peserta Terdata', id: 'peserta-terdata' },
  { label: 'Statistik', id: 'statistik' },
  { label: 'Informasi', id: 'informasi' },
  { label: 'Kontak', id: 'kontak' },
]

const generateParticipantCode = (existingParticipants = []) => {
  const currentYear = new Date().getFullYear()
  const usedNumbers = existingParticipants
    .map((participant) => Number(String(participant.participantCode || '').split('-').pop()))
    .filter((value) => Number.isFinite(value))

  const nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1
  return `MAGANG-${currentYear}-${String(nextNumber).padStart(3, '0')}`
}

function readParticipantSession() {
  try {
    const savedSession = window.sessionStorage.getItem(participantSessionStorageKey)
    const session = savedSession ? JSON.parse(savedSession) : null
    return session?.role === 'participant' && typeof session.participantId === 'string' ? session : null
  } catch {
    return null
  }
}

function App() {
  const [participants, setParticipants] = useState(() => {
    try {
      const savedParticipants = window.localStorage.getItem('pintar-participants')
      return savedParticipants ? JSON.parse(savedParticipants) : []
    } catch {
      return []
    }
  })
  const [participantSession, setParticipantSession] = useState(readParticipantSession)
  const [page, setPage] = useState(() => {
    const path = window.location.pathname
    const cardRouteMatch = path.match(/^\/id-card\/(.+)$/)
    if ((path === '/peserta' || path.startsWith('/peserta/')) && !participantSession) {
      window.history.replaceState({}, '', '/login')
      return 'participant-login'
    }
    if (participantSession && !cardRouteMatch) {
      window.history.replaceState({}, '', '/peserta')
      return 'participant'
    }
    if (path === '/login') return 'participant-login'
    if (path === '/peserta') {
      if (participantSession) return 'participant'
      window.history.replaceState({}, '', '/login')
      return 'participant-login'
    }
    if (path === '/admin') {
      return 'admin'
    }
    if (cardRouteMatch) {
      const code = decodeURIComponent(path.slice('/id-card/'.length))
      const cardParticipant = participants.find((participant) => participant.participantCode === code)
      if (participantSession && cardParticipant?.id !== participantSession.participantId) {
        window.history.replaceState({}, '', '/peserta')
        return 'participant'
      }
      return cardParticipant ? 'id-card' : 'id-card-not-found'
    }
    return new URLSearchParams(window.location.search).get('daftar') === 'magang'
      ? 'form'
      : new URLSearchParams(window.location.search).get('admin') === 'true' ? 'admin-login' : 'welcome'
  })
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState(() => {
    const routeMatch = window.location.pathname.match(/^\/id-card\/(.+)$/)
    if (!routeMatch) return null
    const code = decodeURIComponent(routeMatch[1])
    return participants.find((participant) => participant.participantCode === code) || { participantCode: code, notFound: true }
  })
  const [certificateReturnPage, setCertificateReturnPage] = useState('detail')
  const [certificateAutoPrint, setCertificateAutoPrint] = useState(false)
  const [participantsOpenedFromAdmin, setParticipantsOpenedFromAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false)
  const homeMenuRef = useRef(null)

  useEffect(() => {
    window.localStorage.setItem('pintar-participants', JSON.stringify(participants))
  }, [participants])

  useEffect(() => {
    const handlePopState = () => {
      const { pathname, search } = window.location
      if (pathname === '/login') {
        if (readParticipantSession()) {
          window.history.replaceState({}, '', '/peserta')
          setPage('participant')
        } else {
          setPage('participant-login')
        }
      } else if (pathname === '/peserta' || pathname.startsWith('/peserta/')) {
        if (readParticipantSession()) {
          window.history.replaceState({}, '', '/peserta')
          setPage('participant')
        } else {
          window.history.replaceState({}, '', '/login')
          setPage('participant-login')
        }
      } else if (pathname === '/admin') {
        if (readParticipantSession()) {
          window.history.replaceState({}, '', '/peserta')
          setPage('participant')
        } else {
          setPage('admin')
        }
      } else if (pathname === '/') {
        if (readParticipantSession()) {
          window.history.replaceState({}, '', '/peserta')
          setPage('participant')
        } else {
          const params = new URLSearchParams(search)
          setPage(params.get('daftar') === 'magang' ? 'form' : params.get('admin') === 'true' ? 'admin-login' : 'welcome')
        }
      } else {
        const routeMatch = pathname.match(/^\/id-card\/(.+)$/)
        if (!routeMatch) return
        const code = decodeURIComponent(routeMatch[1])
        const matchParticipant = participants.find((participant) => participant.participantCode === code)
        const session = readParticipantSession()
        if (session && matchParticipant?.id !== session.participantId) {
          window.history.replaceState({}, '', '/peserta')
          setPage('participant')
          return
        }
        setSelectedParticipant(matchParticipant || { participantCode: code, notFound: true })
        setPage(matchParticipant ? 'id-card' : 'id-card-not-found')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [participants])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!homeDropdownOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!homeMenuRef.current?.contains(event.target)) setHomeDropdownOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setHomeDropdownOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [homeDropdownOpen])

  const handleSubmit = (participant) => {
    const generatedCode = generateParticipantCode(participants)
    const savedParticipant = {
      ...participant,
      id: crypto.randomUUID(),
      participantCode: generatedCode,
      photoBackground: participant.photoBackground || 'biru',
    }

    setParticipants((current) => [...current, savedParticipant])
    setSelectedParticipant(savedParticipant)
    setPage('success')
  }

  const openIdCard = (participant) => {
    const code = participant.participantCode
    const nextPath = `/id-card/${encodeURIComponent(code)}`
    window.history.pushState({}, '', nextPath)
    setSelectedParticipant(participant)
    setPage('id-card')
  }

  const updateParticipant = (updatedParticipant) => {
    setParticipants((current) => current.map((participant) => (
      participant.id === updatedParticipant.id ? updatedParticipant : participant
    )))
    setSelectedParticipant(updatedParticipant)
  }

  const openCertificate = (participant, returnPage, autoPrint = false) => {
    if (!isCertificateAvailable(participant)) return
    setSelectedParticipant(participant)
    setCertificateReturnPage(returnPage)
    setCertificateAutoPrint(autoPrint)
    setPage('certificate')
  }

  const scrollToHomeSection = (sectionId) => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setPage('participant')
      return
    }
    setAdminAuthenticated(false)
    setHomeDropdownOpen(false)
    setMobileMenuOpen(false)
    if (page !== 'welcome') {
      setPage('welcome')
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      return
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const navigateToHome = () => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setPage('participant')
      return
    }
    window.history.pushState({}, '', '/')
    setAdminAuthenticated(false)
    setSelectedParticipant(null)
    setHomeDropdownOpen(false)
    setMobileMenuOpen(false)
    if (page !== 'welcome') {
      setPage('welcome')
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80)
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openParticipantLogin = () => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setPage('participant')
      return
    }
    setAdminAuthenticated(false)
    window.history.pushState({}, '', '/login')
    setPage('participant-login')
  }

  const openAdmin = () => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setPage('participant')
      return
    }
    window.history.pushState({}, '', '/admin')
    setPage(adminAuthenticated ? 'admin' : 'admin-login')
  }

  const startParticipantSession = (participant) => {
    const nextSession = { role: 'participant', participantId: participant.id }
    try {
      window.sessionStorage.setItem(participantSessionStorageKey, JSON.stringify(nextSession))
    } catch (error) {
      throw new Error(`Sesi gagal disimpan di browser: ${error instanceof Error ? error.message : String(error)}`)
    }
    setAdminAuthenticated(false)
    setParticipantSession(nextSession)
    window.history.pushState({}, '', '/peserta')
    setPage('participant')
  }

  const logoutParticipant = () => {
    let storageError = null
    try {
      window.sessionStorage.removeItem(participantSessionStorageKey)
    } catch (error) {
      storageError = error
    }
    setParticipantSession(null)
    setAdminAuthenticated(false)
    window.history.pushState({}, '', '/login')
    setPage('participant-login')
    if (storageError) window.alert('Sesi tidak dapat dihapus dari penyimpanan browser. Tutup tab ini dan bersihkan data situs sebelum menggunakan perangkat bersama.')
  }

  const activeParticipant = getParticipantForSession(participants, participantSession)

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f4f6] text-[#222c35]">
      <header className={`sticky top-4 z-20 mx-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-full border px-4 py-3 transition-all duration-300 sm:top-5 sm:mx-6 sm:w-[calc(100%-3rem)] sm:px-6 lg:mx-10 lg:w-[calc(100%-5rem)] lg:px-8 ${isScrolled ? 'border-[#d2d8de] bg-white/95 shadow-[0_12px_30px_rgba(36,51,45,0.1)] backdrop-blur-md' : 'border-[#dfe3e6] bg-white/90 shadow-[0_8px_24px_rgba(36,51,45,0.06)] backdrop-blur-md'}`}>
        <BrandMark />
        <button aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'} className="grid h-10 w-10 place-items-center rounded-xl text-[#556d84] transition hover:bg-white hover:text-[#222c35] sm:hidden" onClick={() => setMobileMenuOpen((open) => !open)} type="button">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className={`${mobileMenuOpen ? 'absolute left-4 right-4 top-[calc(100%-4px)] flex' : 'hidden'} flex-col gap-1 rounded-2xl border border-[#dbdfe3] bg-white p-2 shadow-[0_18px_35px_rgba(36,51,45,0.1)] sm:static sm:flex sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}>
          <div className="relative" ref={homeMenuRef}>
            <div className="flex items-center">
              <button aria-label="Kembali ke beranda" className="flex flex-1 items-center rounded-l-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center" onClick={navigateToHome} type="button">
                Beranda
              </button>
              <button aria-expanded={homeDropdownOpen} aria-haspopup="menu" aria-label="Buka menu bagian beranda" className="flex items-center rounded-r-lg px-2 py-2 text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35]" onClick={() => setHomeDropdownOpen((open) => !open)} type="button">
                <ChevronDown className={`transition-transform duration-200 ${homeDropdownOpen ? 'rotate-180' : ''}`} size={15} />
              </button>
            </div>
            <AnimatePresence>
              {homeDropdownOpen && (
                <motion.div animate={{ opacity: 1, y: 0 }} aria-label="Navigasi beranda" className="absolute left-0 top-[calc(100%+10px)] z-30 w-[min(350px,calc(100vw-2rem))] rounded-[24px] border border-[#dbdfe3] bg-white/95 p-2 shadow-[0_22px_55px_rgba(36,51,45,0.14)] backdrop-blur-md sm:left-1/2 sm:-translate-x-1/2" exit={{ opacity: 0, y: -8 }} initial={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
                  {homeSections.map((section) => (
                    <button className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold text-[#303e4c] transition hover:bg-[#dbe7f3] hover:text-[#222c35]" key={section.id} onClick={() => scrollToHomeSection(section.id)} role="menuitem" type="button">
                      <span className="transition-transform duration-200 group-hover:translate-x-1">{section.label}</span><ArrowRight className="text-[#5c8ab7] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" size={16} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button aria-label="Buka halaman absensi" className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center" onClick={() => { setMobileMenuOpen(false); setHomeDropdownOpen(false); if (participantSession) { setPage('participant'); window.history.pushState({}, '', '/peserta') } else setPage(adminAuthenticated ? 'attendance' : 'attendance-login') }} type="button">
            <ClipboardCheck size={16} /> Absensi
          </button>
          <button aria-label="Buka portal peserta" className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center" onClick={() => { setMobileMenuOpen(false); setHomeDropdownOpen(false); openParticipantLogin() }} type="button">
            <CalendarCheck2 size={16} /> Portal peserta
          </button>
          <button aria-label="Buka halaman admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center" onClick={() => { setMobileMenuOpen(false); setHomeDropdownOpen(false); openAdmin() }} type="button">
            <Users size={16} /> Admin
          </button>
          <button aria-label="Masuk sebagai peserta" className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center" onClick={() => { setMobileMenuOpen(false); setHomeDropdownOpen(false); openParticipantLogin() }} type="button">
            <Users size={16} /> Peserta
          </button>
          {!participantSession && (
            <button aria-label="Buka halaman sertifikat" className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center" onClick={() => { setMobileMenuOpen(false); setHomeDropdownOpen(false); setPage('certificates') }} type="button">
              <Award size={16} /> Sertifikat
            </button>
          )}
          <AttendanceReminder />
        </div>
      </header>

      {page === 'welcome' && <LandingHome onStart={() => setPage('form')} participants={participants} />}

      {page === 'attendance' && <section className="page-shell max-w-7xl"><AttendancePage participants={participants} /></section>}

      {page === 'participant-login' && <ParticipantLogin onAdminLogin={openAdmin} onBack={navigateToHome} onLogin={startParticipantSession} participants={participants} />}

      {page === 'participant' && (
        activeParticipant
          ? <ParticipantPage onLogout={logoutParticipant} participant={activeParticipant} participantId={participantSession.participantId} />
          : <ParticipantLogin onAdminLogin={openAdmin} onBack={navigateToHome} onLogin={startParticipantSession} participants={participants} />
      )}

      {page === 'attendance-login' && <AdminLogin onBack={navigateToHome} onLogin={() => { setAdminAuthenticated(true); setPage('attendance') }} />}

      {page === 'admin' && (
        participantSession
          ? activeParticipant
            ? <ParticipantPage onLogout={logoutParticipant} participant={activeParticipant} participantId={participantSession.participantId} />
            : <ParticipantLogin onAdminLogin={openAdmin} onBack={navigateToHome} onLogin={startParticipantSession} participants={participants} />
          : adminAuthenticated
          ? <AdminPage participants={participants} onBack={() => { setAdminAuthenticated(false); navigateToHome() }} onOpenParticipants={() => { setParticipantsOpenedFromAdmin(true); setPage('participants') }} onUpdateParticipant={updateParticipant} onAdd={() => { setAdminAuthenticated(false); navigateToHome(); setPage('form') }} onLogout={() => { setAdminAuthenticated(false); navigateToHome() }} />
          : <AdminLogin onBack={navigateToHome} onLogin={() => { setAdminAuthenticated(true); window.history.pushState({}, '', '/admin'); setPage('admin') }} />
      )}

      {page === 'admin-login' && <AdminLogin onBack={navigateToHome} onLogin={() => { setAdminAuthenticated(true); window.history.pushState({}, '', '/admin'); setPage('admin') }} />}

      {page === 'form' && (
        <section className="page-shell max-w-3xl">
          <button className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#737a81] transition hover:text-[#222c35]" onClick={() => setPage('welcome')} type="button">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]"><ClipboardList size={15} /> Form peserta</div>
              <p className="mt-3 text-base text-[#757c83]">Data ini membantu pembimbing mengenal dan mendampingi kamu.</p>
            </div>
            <div className="hidden items-center gap-2 text-right text-xs font-bold text-[#2f5a84] sm:flex"><CheckCircle2 size={17} /> 1 dari 1 langkah</div>
          </div>
          <InternshipForm onSubmit={handleSubmit} />
        </section>
      )}

      {page === 'participants' && (
        <ParticipantsPage
          participants={participants}
          onBack={() => { setPage(participantsOpenedFromAdmin ? 'admin' : 'welcome') }}
          onAdd={() => { setAdminAuthenticated(false); setPage('form') }}
          onEdit={updateParticipant}
          onSelect={(participant) => { setSelectedParticipant(participant); setPage('detail') }}
          onViewIdCard={openIdCard}
        />
      )}

      {page === 'detail' && selectedParticipant && <ParticipantDetail onBack={() => setPage('participants')} onViewCertificate={(participant) => openCertificate(participant, 'detail')} participant={selectedParticipant} />}

      {page === 'certificates' && <CertificateDirectory participants={participants} onPreview={(participant) => openCertificate(participant, 'certificates')} onPrint={(participant) => openCertificate(participant, 'certificates', true)} />}

      {page === 'certificate' && selectedParticipant && <CertificatePage autoPrint={certificateAutoPrint} participant={selectedParticipant} onBack={() => setPage(certificateReturnPage)} />}

      {page === 'success' && (
        <SuccessState
          onBack={() => {
            window.history.pushState({}, '', '/')
            setPage('welcome')
          }}
          onViewIdCard={() => openIdCard(selectedParticipant)}
          participant={selectedParticipant}
        />
      )}

      {page === 'id-card' && selectedParticipant && (
        <IdCardPage
          onBack={() => {
            window.history.pushState({}, '', '/')
            setSelectedParticipant(null)
            setPage('welcome')
          }}
          onFinish={() => {
            window.history.pushState({}, '', '/')
            setSelectedParticipant(null)
            setPage('welcome')
          }}
          participant={selectedParticipant}
        />
      )}

      {page === 'id-card-not-found' && selectedParticipant && (
        <section className="page-shell max-w-xl pt-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f2830]">ID Card tidak ditemukan.</h1>
          <p className="mt-4 text-base text-[#757c83]">Kode yang diminta tidak terdaftar dalam data peserta saat ini.</p>
          <button className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#222c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]" onClick={() => {
            window.history.pushState({}, '', '/')
            setPage('welcome')
          }} type="button">Kembali ke beranda</button>
        </section>
      )}

      <footer className="mx-auto flex w-full max-w-7xl justify-between border-t border-[#dbdfe3] px-6 py-5 text-xs text-[#838a91] lg:px-10" id="kontak">
        <span>© 2024 Pelindo Internship</span>
        <span>Data kamu kami jaga.</span>
      </footer>
    </main>
  )
}

export default App
