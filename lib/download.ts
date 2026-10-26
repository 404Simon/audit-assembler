export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand("copy")
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function formatSavedAt(timestamp: number | null): string {
  if (!timestamp) return "not saved yet"
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 5) return "saved just now"
  if (seconds < 60) return `saved ${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `saved ${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `saved ${hours}h ago`
  return `saved ${new Date(timestamp).toLocaleDateString()}`
}
