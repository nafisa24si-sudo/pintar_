import { useState } from 'react'
import { KeyRound, LogIn } from 'lucide-react'
import { activateParticipantAccount, authenticateParticipant } from './participantAuth'
import { LoginVisual } from './LoginVisual'

const fieldClass = 'mt-2 w-full rounded-xl border border-[#d8e0e7] bg-[#f9fbfc] px-4 py-3 text-sm text-[#20354a] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20'

export function ParticipantLogin({ participants, onLogin, onBack }) {
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
        setNotice('Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi kamu.')
      } else {
        onLogin(participant)
      }
      setPassword('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Proses akun gagal. Coba kembali.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <LoginVisual
      accentFrom="#123c63"
      accentTo="#2f6d9d"
      description={mode === 'login'
        ? 'Masuk menggunakan akun peserta yang terdaftar.'
        : 'Gunakan email yang terdaftar dan buat kata sandi baru.'}
      eyebrow="Portal peserta magang"
      mode="participant"
      onBack={onBack}
      title={mode === 'login' ? 'Selamat datang kembali' : 'Daftar akun peserta'}
    >
      <form className="login-form" onSubmit={submit}>
        <div className="login-fields">
          <label className="block text-sm font-bold text-[#344a5f]">
            Email peserta
            <input
              autoComplete="email"
              className={fieldClass}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-bold text-[#344a5f]">
            {mode === 'activate' ? 'Buat kata sandi' : 'Kata sandi'}
            <input
              autoComplete={mode === 'activate' ? 'new-password' : 'current-password'}
              className={fieldClass}
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              type="password"
              value={password}
            />
          </label>
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}
        {notice && <p className="login-notice" role="status">{notice}</p>}

        <button className="login-submit" disabled={busy} type="submit">
          {mode === 'login' ? <LogIn size={17} /> : <KeyRound size={17} />}
          {busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat akun'}
        </button>

        <button
          className="login-secondary"
          onClick={() => { setError(''); setNotice(''); setPassword(''); setMode(mode === 'login' ? 'activate' : 'login') }}
          type="button"
        >
          {mode === 'login' ? 'Daftar akun peserta' : 'Sudah punya akun? Masuk'}
        </button>
      </form>
    </LoginVisual>
  )
}
