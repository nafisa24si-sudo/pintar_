export function parseLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function isCertificateAvailable(participant) {
  const endDate = parseLocalDate(participant?.endDate)
  if (!endDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return endDate <= today
}

export function formatCertificateDate(value) {
  const date = parseLocalDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}