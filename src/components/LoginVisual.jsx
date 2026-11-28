import { ArrowLeft, ClipboardCheck, MonitorUp, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

export function LoginVisual({
  eyebrow,
  title,
  description,
  accentFrom = '#123c63',
  accentTo = '#2f6d9d',
  onBack,
  children,
  mode = 'login',
}) {
  const VisualIcon = mode === 'attendance'
    ? ClipboardCheck
    : mode === 'admin'
      ? ShieldCheck
      : UserRound

  return (
    <section className="login-screen">
      <div className="login-card">
        <aside
          className="login-visual"
          style={{ '--login-accent-from': accentFrom, '--login-accent-to': accentTo }}
        >
          <button className="login-back" onClick={onBack} type="button">
            <ArrowLeft size={16} /> Kembali
          </button>

          <div className="login-visual-copy">
            <span className="login-visual-eyebrow"><Sparkles size={14} /> PINTAR Pelindo</span>
            <h2>Pendataan peserta magang lebih mudah dan terhubung.</h2>
            <p>{description}</p>
          </div>

          <div className="login-illustration" aria-hidden="true">
            <div className="login-orbit login-orbit-one" />
            <div className="login-orbit login-orbit-two" />
            <div className="login-monitor">
              <div className="login-monitor-bar">
                <span />
                <span />
                <span />
              </div>
              <MonitorUp size={55} strokeWidth={1.35} />
            </div>
            <div className="login-person login-person-main">
              <span className="login-person-head" />
              <span className="login-person-body">
                <VisualIcon size={21} />
              </span>
            </div>
            <div className="login-person login-person-side">
              <span className="login-person-head" />
              <span className="login-person-body" />
            </div>
            <div className="login-card-floating login-card-floating-one"><ClipboardCheck size={16} /></div>
            <div className="login-card-floating login-card-floating-two"><ShieldCheck size={16} /></div>
          </div>
        </aside>

        <div className="login-form-panel">
          <div className="login-form-brand">
            <img alt="Logo Pelindo" src="/pelindo-logo.png" />
            <span>PINTAR</span>
          </div>
          <div className="login-form-heading">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>Masuk dengan akun yang sudah terdaftar.</span>
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
