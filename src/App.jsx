import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ClipboardCheck, ClipboardList, LogOut, Menu, Users, X } from 'lucide-react'
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
import { isCertificateAvailable } from './components/certificateUtils'
import { ParticipantLogin } from './components/ParticipantLogin'
import { ParticipantPage } from './components/ParticipantPage'
import { getParticipantForSession, participantSessionStorageKey } from './components/participantAuth'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const homeSections = [
  { label: 'Peserta Terdata', id: 'peserta-terdata' },
  { label: 'Statistik', id: 'statistik' },
  { label: 'Informasi', id: 'informasi' },
  { label: 'Kontak', id: 'kontak' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateParticipantCode = (existingParticipants = []) => {
  const currentYear = new Date().getFullYear()
  const usedNumbers = existingParticipants
    .map((p) => Number(String(p.participantCode || '').split('-').pop()))
    .filter((v) => Number.isFinite(v))
  const nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1
  return `MAGANG-${currentYear}-${String(nextNumber).padStart(3, '0')}`
}

function readParticipantSession() {
  try {
    const saved = window.sessionStorage.getItem(participantSessionStorageKey)
    const session = saved ? JSON.parse(saved) : null
    return session?.role === 'participant' && typeof session.participantId === 'string' ? session : null
  } catch {
    return null
  }
}

/**
 * Determine which "area" the current URL belongs to and what page to show.
 * Returns { area: 'participant'|'admin'|'attendance', page: string }
 *
 * area  – controls which header / shell is rendered
 * page  – controls which content component is rendered
 */
function resolveInitialState(participants, participantSession) {
  const path = window.location.pathname
  const search = window.location.search

  // ── Attendance area (/absensi) ──────────────────────────────────────────
  if (path === '/absensi' || path.startsWith('/absensi/')) {
    // /absensi/scan without auth → redirect to /absensi
    if (path === '/absensi/scan') {
      window.history.replaceState({}, '', '/absensi')
    }
    return { area: 'attendance', page: 'attendance-login' }
  }

  // ── Admin area (/admin) ─────────────────────────────────────────────────
  if (path === '/admin' || path.startsWith('/admin/')) {
    // /admin/dashboard without auth → redirect to /admin
    if (path !== '/admin') {
      window.history.replaceState({}, '', '/admin')
    }
    return { area: 'admin', page: 'admin-login' }
  }

  // ── Participant area (everything else) ──────────────────────────────────
  const cardRouteMatch = path.match(/^\/id-card\/(.+)$/)

  if (cardRouteMatch) {
    const code = decodeURIComponent(path.slice('/id-card/'.length))
    const cardParticipant = participants.find((p) => p.participantCode === code)
    // If logged-in participant tries to view someone else's card → back to portal
    if (participantSession && cardParticipant?.id !== participantSession.participantId) {
      window.history.replaceState({}, '', '/peserta')
      return { area: 'participant', page: 'participant' }
    }
    return {
      area: 'participant',
      page: cardParticipant ? 'id-card' : 'id-card-not-found',
    }
  }

  if (path === '/login') {
    if (participantSession) {
      window.history.replaceState({}, '', '/peserta')
      return { area: 'participant', page: 'participant' }
    }
    return { area: 'participant', page: 'participant-login' }
  }

  if (path === '/peserta' || path.startsWith('/peserta/')) {
    if (participantSession) {
      window.history.replaceState({}, '', '/peserta')
      return { area: 'participant', page: 'participant' }
    }
    window.history.replaceState({}, '', '/login')
    return { area: 'participant', page: 'participant-login' }
  }

  // Root /
  if (participantSession) {
    window.history.replaceState({}, '', '/peserta')
    return { area: 'participant', page: 'participant' }
  }

  const params = new URLSearchParams(search)
  const pageFromQuery = params.get('daftar') === 'magang' ? 'form' : 'welcome'
  return { area: 'participant', page: pageFromQuery }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  // ── Shared state ──────────────────────────────────────────────────────────
  const [participants, setParticipants] = useState(() => {
    try {
      const saved = window.localStorage.getItem('pintar-participants')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [participantSession, setParticipantSession] = useState(readParticipantSession)

  // area and page are always set together
  const [{ area, page }, setRoute] = useState(() => {
    const session = readParticipantSession()
    // We need participants already loaded for the resolver
    let loadedParticipants = []
    try {
      const saved = window.localStorage.getItem('pintar-participants')
      loadedParticipants = saved ? JSON.parse(saved) : []
    } catch { /* empty */ }
    return resolveInitialState(loadedParticipants, session)
  })

  const setPage = (nextPage) => setRoute((prev) => ({ ...prev, page: nextPage }))
  const setAreaAndPage = (nextArea, nextPage) => setRoute({ area: nextArea, page: nextPage })

  // ── Auth state (independent per area) ────────────────────────────────────
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [attendanceAuthenticated, setAttendanceAuthenticated] = useState(false)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedParticipant, setSelectedParticipant] = useState(() => {
    const match = window.location.pathname.match(/^\/id-card\/(.+)$/)
    if (!match) return null
    const code = decodeURIComponent(match[1])
    let loadedParticipants = []
    try {
      const saved = window.localStorage.getItem('pintar-participants')
      loadedParticipants = saved ? JSON.parse(saved) : []
    } catch { /* empty */ }
    return loadedParticipants.find((p) => p.participantCode === code) || { participantCode: code, notFound: true }
  })
  const [certificateReturnPage, setCertificateReturnPage] = useState('detail')
  const [certificateAutoPrint, setCertificateAutoPrint] = useState(false)
  const [participantsOpenedFromAdmin, setParticipantsOpenedFromAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false)
  const homeMenuRef = useRef(null)

  // ── Persist participants ──────────────────────────────────────────────────
  useEffect(() => {
    window.localStorage.setItem('pintar-participants', JSON.stringify(participants))
  }, [participants])

  // ── Browser back/forward ──────────────────────────────────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const { pathname, search } = window.location

      // Attendance area
      if (pathname === '/absensi' || pathname.startsWith('/absensi/')) {
        if (pathname === '/absensi/scan' && !attendanceAuthenticated) {
          window.history.replaceState({}, '', '/absensi')
          setAreaAndPage('attendance', 'attendance-login')
          return
        }
        if (pathname === '/absensi/scan' && attendanceAuthenticated) {
          setAreaAndPage('attendance', 'attendance-scan')
          return
        }
        setAreaAndPage('attendance', 'attendance-login')
        return
      }

      // Admin area
      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        if (!adminAuthenticated) {
          window.history.replaceState({}, '', '/admin')
          setAreaAndPage('admin', 'admin-login')
          return
        }
        setAreaAndPage('admin', 'admin-dashboard')
        return
      }

      // Participant area
      const cardMatch = pathname.match(/^\/id-card\/(.+)$/)
      if (cardMatch) {
        const code = decodeURIComponent(cardMatch[1])
        const found = participants.find((p) => p.participantCode === code)
        const session = readParticipantSession()
        if (session && found?.id !== session.participantId) {
          window.history.replaceState({}, '', '/peserta')
          setAreaAndPage('participant', 'participant')
          return
        }
        setSelectedParticipant(found || { participantCode: code, notFound: true })
        setAreaAndPage('participant', found ? 'id-card' : 'id-card-not-found')
        return
      }

      if (pathname === '/login') {
        if (readParticipantSession()) {
          window.history.replaceState({}, '', '/peserta')
          setAreaAndPage('participant', 'participant')
        } else {
          setAreaAndPage('participant', 'participant-login')
        }
        return
      }

      if (pathname === '/peserta' || pathname.startsWith('/peserta/')) {
        if (readParticipantSession()) {
          window.history.replaceState({}, '', '/peserta')
          setAreaAndPage('participant', 'participant')
        } else {
          window.history.replaceState({}, '', '/login')
          setAreaAndPage('participant', 'participant-login')
        }
        return
      }

      // Root /
      if (readParticipantSession()) {
        window.history.replaceState({}, '', '/peserta')
        setAreaAndPage('participant', 'participant')
        return
      }
      const params = new URLSearchParams(search)
      setAreaAndPage('participant', params.get('daftar') === 'magang' ? 'form' : 'welcome')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [participants, adminAuthenticated, attendanceAuthenticated])

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Home dropdown outside-click / escape ──────────────────────────────────
  useEffect(() => {
    if (!homeDropdownOpen) return undefined
    const closeClick = (e) => { if (!homeMenuRef.current?.contains(e.target)) setHomeDropdownOpen(false) }
    const closeEsc = (e) => { if (e.key === 'Escape') setHomeDropdownOpen(false) }
    document.addEventListener('mousedown', closeClick)
    document.addEventListener('keydown', closeEsc)
    return () => {
      document.removeEventListener('mousedown', closeClick)
      document.removeEventListener('keydown', closeEsc)
    }
  }, [homeDropdownOpen])

  // ── Participant actions ───────────────────────────────────────────────────
  const handleSubmit = (participant) => {
    const generatedCode = generateParticipantCode(participants)
    const saved = {
      ...participant,
      id: crypto.randomUUID(),
      participantCode: generatedCode,
      photoBackground: participant.photoBackground || 'biru',
    }
    setParticipants((cur) => [...cur, saved])
    setSelectedParticipant(saved)
    setPage('success')
  }

  const openIdCard = (participant) => {
    window.history.pushState({}, '', `/id-card/${encodeURIComponent(participant.participantCode)}`)
    setSelectedParticipant(participant)
    setAreaAndPage('participant', 'id-card')
  }

  const updateParticipant = (updated) => {
    setParticipants((cur) => cur.map((p) => (p.id === updated.id ? updated : p)))
    setSelectedParticipant(updated)
  }

  const openCertificate = (participant, returnPage, autoPrint = false) => {
    if (!isCertificateAvailable(participant)) return
    setSelectedParticipant(participant)
    setCertificateReturnPage(returnPage)
    setCertificateAutoPrint(autoPrint)
    setPage('certificate')
  }

  const startParticipantSession = (participant) => {
    const nextSession = { role: 'participant', participantId: participant.id }
    try {
      window.sessionStorage.setItem(participantSessionStorageKey, JSON.stringify(nextSession))
    } catch (err) {
      throw new Error(`Sesi gagal disimpan di browser: ${err instanceof Error ? err.message : String(err)}`)
    }
    setParticipantSession(nextSession)
    window.history.pushState({}, '', '/peserta')
    setAreaAndPage('participant', 'participant')
  }

  const logoutParticipant = () => {
    let storageError = null
    try {
      window.sessionStorage.removeItem(participantSessionStorageKey)
    } catch (err) {
      storageError = err
    }
    setParticipantSession(null)
    window.history.pushState({}, '', '/login')
    setAreaAndPage('participant', 'participant-login')
    if (storageError) window.alert('Sesi tidak dapat dihapus dari penyimpanan browser. Tutup tab ini dan bersihkan data situs sebelum menggunakan perangkat bersama.')
  }

  // ── Participant-area navigation ───────────────────────────────────────────
  const navigateToHome = () => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setAreaAndPage('participant', 'participant')
      return
    }
    window.history.pushState({}, '', '/')
    setSelectedParticipant(null)
    setHomeDropdownOpen(false)
    setMobileMenuOpen(false)
    if (page !== 'welcome') {
      setAreaAndPage('participant', 'welcome')
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80)
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToHomeSection = (sectionId) => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setAreaAndPage('participant', 'participant')
      return
    }
    setHomeDropdownOpen(false)
    setMobileMenuOpen(false)
    if (page !== 'welcome') {
      setAreaAndPage('participant', 'welcome')
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      return
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openParticipantLogin = () => {
    if (participantSession) {
      window.history.pushState({}, '', '/peserta')
      setAreaAndPage('participant', 'participant')
      return
    }
    window.history.pushState({}, '', '/login')
    setAreaAndPage('participant', 'participant-login')
  }

  // ── Admin actions ─────────────────────────────────────────────────────────
  const loginAdmin = () => {
    setAdminAuthenticated(true)
    window.history.pushState({}, '', '/admin/dashboard')
    setAreaAndPage('admin', 'admin-dashboard')
  }

  const logoutAdmin = () => {
    setAdminAuthenticated(false)
    window.history.pushState({}, '', '/admin')
    setAreaAndPage('admin', 'admin-login')
  }

  // ── Attendance actions ────────────────────────────────────────────────────
  const loginAttendance = () => {
    setAttendanceAuthenticated(true)
    window.history.pushState({}, '', '/absensi/scan')
    setAreaAndPage('attendance', 'attendance-scan')
  }

  const logoutAttendance = () => {
    setAttendanceAuthenticated(false)
    window.history.pushState({}, '', '/absensi')
    setAreaAndPage('attendance', 'attendance-login')
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeParticipant = getParticipantForSession(participants, participantSession)

  // ── Render helpers ────────────────────────────────────────────────────────
  const headerBase = `sticky top-4 z-20 mx-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-full border px-4 py-3 transition-all duration-300 sm:top-5 sm:mx-6 sm:w-[calc(100%-3rem)] sm:px-6 lg:mx-10 lg:w-[calc(100%-5rem)] lg:px-8`
  const headerScroll = isScrolled
    ? 'border-[#d2d8de] bg-white/95 shadow-[0_12px_30px_rgba(36,51,45,0.1)] backdrop-blur-md'
    : 'border-[#dfe3e6] bg-white/90 shadow-[0_8px_24px_rgba(36,51,45,0.06)] backdrop-blur-md'

  // ---------------------------------------------------------------------------
  // ── ATTENDANCE AREA ─────────────────────────────────────────────────────────
  // ---------------------------------------------------------------------------
  if (area === 'attendance') {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f3f4f6] text-[#222c35]">
        {(page !== 'attendance-login' && attendanceAuthenticated) && (
          <header className={`${headerBase} ${headerScroll}`}>
            <BrandMark />
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#c8d8e4] bg-[#e8f1f8] px-3 py-1.5 text-xs font-bold text-[#2f5a84] sm:inline-flex">
                <ClipboardCheck size={13} /> Absensi
              </span>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce4eb] bg-white px-3 py-2 text-xs font-bold text-[#556d84] transition hover:border-[#f8c4bb] hover:bg-[#fff5f3] hover:text-[#b34d3b]"
                onClick={logoutAttendance}
                type="button"
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </header>
        )}

        {(page === 'attendance-login' || !attendanceAuthenticated) && (
          <AdminLogin
            accentFrom="#0f3d5c"
            accentTo="#1a6b5a"
            eyebrow="Area Absensi"
            title="Login Absensi"
            description="Masuk untuk memindai QR dan mencatat kehadiran peserta."
            submitLabel="Masuk ke Absensi"
            onBack={() => {
              window.history.pushState({}, '', '/')
              setAreaAndPage('participant', 'welcome')
            }}
            onLogin={loginAttendance}
          />
        )}

        {page === 'attendance-scan' && attendanceAuthenticated && (
          <section className="page-shell max-w-7xl">
            <AttendancePage participants={participants} />
          </section>
        )}

        {page !== 'attendance-login' && attendanceAuthenticated && <footer className="mx-auto flex w-full max-w-7xl justify-between border-t border-[#dbdfe3] px-6 py-5 text-xs text-[#838a91] lg:px-10">
          <span>© 2024 Pelindo Internship</span>
          <span>Data kamu kami jaga.</span>
        </footer>}
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // ── ADMIN AREA ──────────────────────────────────────────────────────────────
  // ---------------------------------------------------------------------------
  if (area === 'admin') {
    return (
      <main className={`min-h-screen overflow-hidden text-[#222c35] ${adminAuthenticated ? 'admin-area-shell' : 'bg-[#f3f4f6]'}`}>
        {(page !== 'admin-login' && adminAuthenticated) && (
          <header className={`${headerBase} admin-area-header`}>
            <BrandMark />
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#c8d8e4] bg-[#e8f1f8] px-3 py-1.5 text-xs font-bold text-[#2f5a84] sm:inline-flex">
                <Users size={13} /> Admin
              </span>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce4eb] bg-white px-3 py-2 text-xs font-bold text-[#556d84] transition hover:border-[#f8c4bb] hover:bg-[#fff5f3] hover:text-[#b34d3b]"
                onClick={logoutAdmin}
                type="button"
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </header>
        )}

        {(page === 'admin-login' || !adminAuthenticated) && (
          <AdminLogin
            onBack={() => {
              window.history.pushState({}, '', '/')
              setAreaAndPage('participant', 'welcome')
            }}
            onLogin={loginAdmin}
          />
        )}

        {page === 'admin-dashboard' && adminAuthenticated && (
          <AdminPage
            participants={participants}
            onBack={logoutAdmin}
            onOpenParticipants={() => { setParticipantsOpenedFromAdmin(true); setPage('participants') }}
            onUpdateParticipant={updateParticipant}
            onAdd={() => {
              // Navigating to form is a participant-area action
              window.history.pushState({}, '', '/')
              setAreaAndPage('participant', 'form')
            }}
            onLogout={logoutAdmin}
          />
        )}

        {page === 'participants' && adminAuthenticated && (
          <ParticipantsPage
            participants={participants}
            onBack={() => setPage(participantsOpenedFromAdmin ? 'admin-dashboard' : 'admin-dashboard')}
            onAdd={() => {
              window.history.pushState({}, '', '/')
              setAreaAndPage('participant', 'form')
            }}
            onEdit={updateParticipant}
            onSelect={(p) => { setSelectedParticipant(p); setPage('detail') }}
            onViewIdCard={openIdCard}
          />
        )}

        {page === 'detail' && selectedParticipant && adminAuthenticated && (
          <ParticipantDetail
            onBack={() => setPage('participants')}
            onViewCertificate={(p) => openCertificate(p, 'detail')}
            participant={selectedParticipant}
          />
        )}

        {page === 'certificate' && selectedParticipant && adminAuthenticated && (
          <CertificatePage
            autoPrint={certificateAutoPrint}
            participant={selectedParticipant}
            onBack={() => setPage(certificateReturnPage)}
          />
        )}

        {page !== 'admin-login' && adminAuthenticated && <footer className="mx-auto flex w-full max-w-7xl justify-between border-t border-[#dbdfe3] px-6 py-5 text-xs text-[#838a91] lg:px-10">
          <span>© 2024 Pelindo Internship</span>
          <span>Data kamu kami jaga.</span>
        </footer>}
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // ── PARTICIPANT AREA (default) ───────────────────────────────────────────────
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f4f6] text-[#222c35]">
      {page !== 'participant-login' && (
      <header className={`${headerBase} ${headerScroll}`}>
        <BrandMark />
        <button
          aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          className="grid h-10 w-10 place-items-center rounded-xl text-[#556d84] transition hover:bg-white hover:text-[#222c35] sm:hidden"
          onClick={() => setMobileMenuOpen((o) => !o)}
          type="button"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`${mobileMenuOpen ? 'absolute left-4 right-4 top-[calc(100%-4px)] flex' : 'hidden'} flex-col gap-1 rounded-2xl border border-[#dbdfe3] bg-white p-2 shadow-[0_18px_35px_rgba(36,51,45,0.1)] sm:static sm:flex sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}>

          {/* Beranda with section dropdown */}
          <div className="relative" ref={homeMenuRef}>
            <div className="flex items-center">
              <button
                aria-label="Kembali ke beranda"
                className="flex flex-1 items-center rounded-l-lg px-3 py-2 text-left text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35] sm:text-center"
                onClick={navigateToHome}
                type="button"
              >
                Beranda
              </button>
              <button
                aria-expanded={homeDropdownOpen}
                aria-haspopup="menu"
                aria-label="Buka menu bagian beranda"
                className="flex items-center rounded-r-lg px-2 py-2 text-xs font-bold text-[#556d84] transition hover:bg-[#dbe7f3] hover:text-[#222c35]"
                onClick={() => setHomeDropdownOpen((o) => !o)}
                type="button"
              >
                <ChevronDown className={`transition-transform duration-200 ${homeDropdownOpen ? 'rotate-180' : ''}`} size={15} />
              </button>
            </div>
            <AnimatePresence>
              {homeDropdownOpen && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  aria-label="Navigasi beranda"
                  className="absolute left-0 top-[calc(100%+10px)] z-30 w-[min(350px,calc(100vw-2rem))] rounded-[24px] border border-[#dbdfe3] bg-white/95 p-2 shadow-[0_22px_55px_rgba(36,51,45,0.14)] backdrop-blur-md sm:left-1/2 sm:-translate-x-1/2"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {homeSections.map((section) => (
                    <button
                      className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold text-[#303e4c] transition hover:bg-[#dbe7f3] hover:text-[#222c35]"
                      key={section.id}
                      onClick={() => scrollToHomeSection(section.id)}
                      role="menuitem"
                      type="button"
                    >
                      <span className="transition-transform duration-200 group-hover:translate-x-1">{section.label}</span>
                      <ArrowRight className="text-[#5c8ab7] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" size={16} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Peserta login/portal */}
          <button
            aria-label="Masuk sebagai peserta"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dce4eb] bg-white px-4 py-2 text-xs font-bold text-[#2f5a84] shadow-sm transition hover:border-[#b8ccdd] hover:bg-[#eaf2f8] sm:text-center"
            onClick={() => { setMobileMenuOpen(false); setHomeDropdownOpen(false); openParticipantLogin() }}
            type="button"
          >
            <Users size={15} /> Masuk
          </button>
        </div>
      </header>
      )}

      {/* ── Page content ── */}
      {page === 'welcome' && <LandingHome onStart={() => setPage('form')} participants={participants} />}

      {page === 'participant-login' && (
        <ParticipantLogin
          onAdminLogin={() => {
            window.history.pushState({}, '', '/admin')
            setAreaAndPage('admin', 'admin-login')
          }}
          onBack={navigateToHome}
          onLogin={startParticipantSession}
          participants={participants}
        />
      )}

      {page === 'participant' && (
        activeParticipant
          ? <ParticipantPage onLogout={logoutParticipant} participant={activeParticipant} participantId={participantSession.participantId} />
          : (
            <ParticipantLogin
              onAdminLogin={() => {
                window.history.pushState({}, '', '/admin')
                setAreaAndPage('admin', 'admin-login')
              }}
              onBack={navigateToHome}
              onLogin={startParticipantSession}
              participants={participants}
            />
          )
      )}

      {page === 'form' && (
        <section className="page-shell max-w-3xl">
          <button
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#737a81] transition hover:text-[#222c35]"
            onClick={() => { window.history.pushState({}, '', '/'); setPage('welcome') }}
            type="button"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]">
                <ClipboardList size={15} /> Form peserta
              </div>
              <p className="mt-3 text-base text-[#757c83]">Data ini membantu pembimbing mengenal dan mendampingi kamu.</p>
            </div>
            <div className="hidden items-center gap-2 text-right text-xs font-bold text-[#2f5a84] sm:flex">
              <CheckCircle2 size={17} /> 1 dari 1 langkah
            </div>
          </div>
          <InternshipForm onSubmit={handleSubmit} />
        </section>
      )}

      {page === 'success' && (
        <SuccessState
          onBack={() => { window.history.pushState({}, '', '/'); setPage('welcome') }}
          onViewIdCard={() => openIdCard(selectedParticipant)}
          participant={selectedParticipant}
        />
      )}

      {page === 'id-card' && selectedParticipant && (
        <IdCardPage
          onBack={() => { window.history.pushState({}, '', '/'); setSelectedParticipant(null); setPage('welcome') }}
          onFinish={() => { window.history.pushState({}, '', '/'); setSelectedParticipant(null); setPage('welcome') }}
          participant={selectedParticipant}
        />
      )}

      {page === 'id-card-not-found' && selectedParticipant && (
        <section className="page-shell max-w-xl pt-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#1f2830]">ID Card tidak ditemukan.</h1>
          <p className="mt-4 text-base text-[#757c83]">Kode yang diminta tidak terdaftar dalam data peserta saat ini.</p>
          <button
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#222c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303e4c]"
            onClick={() => { window.history.pushState({}, '', '/'); setPage('welcome') }}
            type="button"
          >
            Kembali ke beranda
          </button>
        </section>
      )}

      {page === 'certificate' && selectedParticipant && (
        <CertificatePage
          autoPrint={certificateAutoPrint}
          participant={selectedParticipant}
          onBack={() => setPage(certificateReturnPage)}
        />
      )}

      {page === 'certificates' && (
        <CertificateDirectory
          participants={participants}
          onPreview={(p) => openCertificate(p, 'certificates')}
          onPrint={(p) => openCertificate(p, 'certificates', true)}
        />
      )}

      {page !== 'participant-login' && <footer className="mx-auto flex w-full max-w-7xl justify-between border-t border-[#dbdfe3] px-6 py-5 text-xs text-[#838a91] lg:px-10" id="kontak">
        <span>© 2024 Pelindo Internship</span>
        <span>Data kamu kami jaga.</span>
      </footer>}
    </main>
  )
}

export default App
