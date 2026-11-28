import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

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
    <section className="page-shell flex max-w-md flex-col">
      <button
        className="mb-8 inline-flex items-center gap-2 self-start text-sm font-bold text-[#66798b] transition hover:text-[#20354a]"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      <div className="overflow-hidden rounded-[28px] border border-[#dce4eb] bg-white shadow-[0_22px_60px_rgba(27,56,82,0.10)]">
        {/* Header — konsisten dengan ParticipantLogin */}
        <div
          className="px-6 py-7 text-white sm:px-8"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        >
          <div className="mb-5 flex items-center justify-between">
            <img alt="Logo Pelindo" className="h-9 w-auto rounded-lg bg-white px-3 py-1.5 object-contain" src="/pelindo-logo.png" />
            <span className="rounded-full border border-white/25 px-3 py-1 text-[11px] font-bold tracking-[0.12em]">PINTAR</span>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">
              <ShieldCheck size={16} />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{eyebrow}</p>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-white/80">{description}</p>
        </div>

        {/* Form */}
        <form className="space-y-4 p-6 sm:p-8" onSubmit={handleSubmit}>
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

          {error && (
            <p className="rounded-xl bg-[#fff1ed] px-3 py-2.5 text-sm font-semibold text-[#a74636]" role="alert">
              {error}
            </p>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f64] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#24567f]"
            type="submit"
          >
            <LogIn size={17} /> {submitLabel}
          </button>
        </form>
      </div>
    </section>
  )
}
