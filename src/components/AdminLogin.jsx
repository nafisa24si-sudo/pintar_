import { ArrowLeft, LockKeyhole, LogIn } from 'lucide-react'
import { useState } from 'react'

export function AdminLogin({ onBack, onLogin }) {
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

    setError('Username atau password belum sesuai.')
  }

  return (
    <section className="page-shell flex max-w-md flex-col">
      <button className="mb-10 inline-flex items-center gap-2 self-start text-sm font-bold text-[#737a81] transition hover:text-[#222c35]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali ke beranda
      </button>
      <div className="rounded-2xl border border-[#dbdfe3] bg-white p-6 shadow-[0_18px_50px_rgba(51,70,58,0.08)] sm:p-8">
        <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#d5e3f2] text-[#2f5a84]"><LockKeyhole size={22} /></div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5a84]">Area internal</p>
        <h1 className="text-3xl font-extrabold tracking-[-0.05em] text-[#1f2830]">Masuk sebagai admin</h1>
        <p className="mt-3 text-sm leading-6 text-[#757c83]">Gunakan akun admin untuk melihat data peserta magang.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-[#384858]">
            Username
            <input className="mt-2 w-full rounded-xl border border-[#dbdfe3] bg-[#f9fbfc] px-4 py-3 text-sm font-medium text-[#222c35] outline-none transition placeholder:text-[#a0a5ab] focus:border-[#5c8ab7] focus:ring-4 focus:ring-[#d5e3f2]" onChange={(event) => setUsername(event.target.value)} placeholder="Masukkan username" required type="text" value={username} />
          </label>
          <label className="block text-sm font-bold text-[#384858]">
            Password
            <input className="mt-2 w-full rounded-xl border border-[#dbdfe3] bg-[#f9fbfc] px-4 py-3 text-sm font-medium text-[#222c35] outline-none transition placeholder:text-[#a0a5ab] focus:border-[#5c8ab7] focus:ring-4 focus:ring-[#d5e3f2]" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required type="password" value={password} />
          </label>
          {error && <p className="rounded-lg bg-[#fff1ed] px-3 py-2 text-sm font-semibold text-[#b34d3b]">{error}</p>}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#222c35] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#303e4c]" type="submit">
            Masuk ke dashboard <LogIn size={17} />
          </button>
        </form>
      </div>
    </section>
  )
}
