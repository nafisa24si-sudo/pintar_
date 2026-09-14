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
    <section className="mx-auto flex w-full max-w-md flex-col px-6 pb-20 pt-6 lg:pb-24">
      <button className="mb-10 inline-flex items-center gap-2 self-start text-sm font-bold text-[#738178] transition hover:text-[#24332d]" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Kembali ke beranda
      </button>
      <div className="rounded-2xl border border-[#dce5d9] bg-white p-6 shadow-[0_18px_50px_rgba(51,70,58,0.08)] sm:p-8">
        <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#eef8cf] text-[#78951e]"><LockKeyhole size={22} /></div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#78951e]">Area internal</p>
        <h1 className="text-3xl font-extrabold tracking-[-0.05em] text-[#1f3028]">Masuk sebagai admin</h1>
        <p className="mt-3 text-sm leading-6 text-[#75837b]">Gunakan akun admin untuk melihat data peserta magang.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-[#405047]">
            Username
            <input className="mt-2 w-full rounded-xl border border-[#dce5d9] bg-[#fbfcf9] px-4 py-3 text-sm font-medium text-[#24332d] outline-none transition placeholder:text-[#a0aba4] focus:border-[#abc94a] focus:ring-4 focus:ring-[#eef8cf]" onChange={(event) => setUsername(event.target.value)} placeholder="Masukkan username" required type="text" value={username} />
          </label>
          <label className="block text-sm font-bold text-[#405047]">
            Password
            <input className="mt-2 w-full rounded-xl border border-[#dce5d9] bg-[#fbfcf9] px-4 py-3 text-sm font-medium text-[#24332d] outline-none transition placeholder:text-[#a0aba4] focus:border-[#abc94a] focus:ring-4 focus:ring-[#eef8cf]" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required type="password" value={password} />
          </label>
          {error && <p className="rounded-lg bg-[#fff1ed] px-3 py-2 text-sm font-semibold text-[#b34d3b]">{error}</p>}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#24332d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#34483d]" type="submit">
            Masuk ke dashboard <LogIn size={17} />
          </button>
        </form>
      </div>
    </section>
  )
}
