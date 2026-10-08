const requiredEnvironment = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

const env = import.meta.env

export const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const missingEnvironment = requiredEnvironment.filter((key) => !env[key])

export const isDevelopmentPreview = import.meta.env.DEV && !isSupabaseConfigured
