/**
 * Client Supabase pour les Client Components uniquement (browser).
 *
 * Singleton : une seule instance partagée côté browser.
 * Pour les Server Components / Server Actions → utiliser src/lib/supabase-server.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
