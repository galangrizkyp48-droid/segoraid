import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Supabase Environment Variables are missing! Check your .env.local or Vercel Settings.')
}

export const createClient = () =>
    createBrowserClient(
        supabaseUrl!,
        supabaseKey!
    )

// Singleton instance for client-side usage
export const supabase = createClient()
