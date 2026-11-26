import { useState } from 'react'
import { ArrowLeft, KeyRound, LogIn, UserRound } from 'lucide-react'
import { activateParticipantAccount, authenticateParticipant } from './participantAuth'

const fieldClass = 'mt-2 w-full rounded-xl border border-[#d8e0e7] bg-[#f9fbfc] px-4 py-3 text-sm text-[#20354a] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20'

export function ParticipantLogin({ participants, onLogin, onBack, onAdminLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    setBusy(true)
    try {
      const participant = mode === 'activate'
        ? await activateParticipantAccount(participants, { email, password })
        : await authenticateParticipant(participants, { email, password })
      if (mode === 'activate') {
        setMode('login')
        setNotice('Akun berhasil diaktifkan. Silakan masuk dengan email dan kata sandi baru.')
      } else onLogin(participant)
      setPassword('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Proses akun gagal. Coba kembali.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-shell flex max-w-md flex-col">
      <button className="mb-8 inline-flex items-center gap-2 self-start text-sm font-bold text-[#66798b] transition hover:text-[#20354a]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali
      </button>
      <div className="overflow-hidden rounded-[28px] border border-[#dce4eb] bg-white shadow-[0_22px_60px_rgba(27,56,82,0.10)]">
        <div className="bg-gradient-to-br from-[#123c63] to-[#2f6d9d] px-6 py-7 text-white sm:px-8">
          <div className="mb-5 flex items-center justify-between">
            <img alt="Logo Pelindo" className="h-9 w-auto rounded-lg bg-white px-3 py-1.5 object-contain" src="/pelindo-logo.png" />
            <span className="rounded-full border border-white/25 px-3 py-1 text-[11px] font-bold tracking-[0.12em]">PINTAR</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Portal peserta magang</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{mode === 'login' ? 'Selamat datang' : 'Aktifkan akun'}</h1>
          <p className="mt-2 text-sm leading-6 text-white/80">
            {mode === 'login' ? 'Masuk menggunakan akun peserta yang terdaftar.' : 'Gunakan email yang terdaftar dan buat kata sandi.'}
          </p>
        </div>

        <form className="space-y-4 p-6 sm:p-8" onSubmit={submit}>
          <label className="block text-sm font-bold text-[#344a5f]">
            Email peserta
            <input autoComplete="email" className={fieldClass} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required type="email" value={email} />
          </label>
          <label className="block text-sm font-bold text-[#344a5f]">
            {mode === 'activate' ? 'Buat kata sandi' : 'Kata sandi'}
            <input autoComplete={mode === 'activate' ? 'new-password' : 'current-password'} className={fieldClass} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" required type="password" value={password} />
          </label>
          {error && <p className="rounded-xl bg-[#fff1ed] px-3 py-2.5 text-sm font-semibold text-[#a74636]" role="alert">{error}</p>}
          {notice && <p className="rounded-xl bg-[#edf5fa] px-3 py-2.5 text-sm font-semibold text-[#2c5e85]" role="status">{notice}</p>}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f64] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#24567f] disabled:cursor-wait disabled:opacity-60" disabled={busy} type="submit">
            {mode === 'login' ? <LogIn size={17} /> : <KeyRound size={17} />}
            {busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat akun'}
          </button>
          <button className="w-full rounded-xl border border-[#dce4eb] px-4 py-3 text-sm font-bold text-[#37536c] transition hover:bg-[#f4f8fb]" onClick={() => { setError(''); setNotice(''); setMode(mode === 'login' ? 'activate' : 'login') }} type="button">
            {mode === 'login' ? 'Belum punya kata sandi? Aktifkan akun' : 'Sudah punya akun? Masuk'}
          </button>
          <div className="border-t border-[#edf0f2] pt-4 text-center">
            <button className="inline-flex items-center gap-2 text-xs font-bold text-[#738496] hover:text-[#244e73]" onClick={onAdminLogin} type="button"><UserRound size={14} /> Masuk sebagai Admin</button>
          </div>
        </form>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-[#7b8791]">Prototipe lokal: aktivasi hanya mencocokkan email peserta. Ini bukan verifikasi identitas yang aman untuk situs publik.</p>
    </section>
  )
}
