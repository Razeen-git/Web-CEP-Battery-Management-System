/** App URLs — override in .env (see .env.example) */
export const HF_SPACE_URL =
  import.meta.env.VITE_HF_SPACE_URL ||
  'https://huggingface.co/spaces/abdulmoeez380/battery-classifier'

/** Direct Space URL — most reliable for iframe embed */
export const HF_SPACE_APP_URL =
  import.meta.env.VITE_HF_SPACE_APP_URL ||
  'https://abdulmoeez380-battery-classifier.hf.space'

export const HF_EMBED_URL =
  import.meta.env.VITE_HF_EMBED_URL || HF_SPACE_APP_URL

export function mainDashboardUrl() {
  const fromEnv = import.meta.env.VITE_MAIN_DASHBOARD_URL
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/dashboard`
  }
  return 'http://localhost:5174/dashboard'
}
