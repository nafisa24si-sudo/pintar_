import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { LoginVisual } from './LoginVisual'

/**
 * Login form dipakai di area Admin dan area Absensi.
 *
 * Props:
 *   onBack        – tombol kembali
 *   onLogin       – dipanggil saat login berhasil
 *   title         – judul halaman (default: 'Masuk sebagai Admin')
 *   description   – subjudul (default: '...')
 *   eyebrow       – label kecil di atas judul (default: 'Area Admin')
 *   submitLabel   – teks tombol submit (default: 'Masuk')
 *   accentFrom    – warna gradient dari (default: '#123c63')
 *   accentTo      – warna gradient ke (default: '#1e5c8a')
 */
export function AdminLogin({
  onBack,
  onLogin,
  title = 'Masuk sebagai Admin',
  description = 'Gunakan akun admin untuk mengakses dashboard.',
  eyebrow = 'Area Admin',
  submitLabel = 'Masuk',
  accentFrom = '#123c63',
  accentTo = '#1e5c8a',
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (username === 'admin' && password === 'pintar123') {
      setError('')
      onLogin()
      return
    }
    setError('Username atau password tidak sesuai.')
  }

  return (
    <LoginVisual
      accentFrom={accentFrom}
      accentTo={accentTo}
      description={description}
      eyebrow={eyebrow}
      mode={eyebrow === 'Area Absensi' ? 'attendance' : 'admin'}
      onBack={onBack}
      title={title}
    >
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-fields">
          <label className="block text-sm font-bold text-[#344a5f]">
            Username
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-[#d8e0e7] bg-[#f9fbfc] px-4 py-3 text-sm text-[#20354a] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              type="text"
              value={username}
            />
          </label>
          <label className="block text-sm font-bold text-[#344a5f]">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-[#d8e0e7] bg-[#f9fbfc] px-4 py-3 text-sm text-[#20354a] outline-none transition focus:border-[#4f7dab] focus:bg-white focus:ring-4 focus:ring-[#659fd8]/20"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              type="password"
              value={password}
            />
          </label>
        </div>

        {error && (
          <p className="login-error" role="alert">{error}</p>
        )}

        <button className="login-submit" type="submit">
          <LogIn size={17} /> {submitLabel}
        </button>
      </form>
    </LoginVisual>
  )
}
