/**
 * Server-side Supabase client factory.
 *
 * À appeler à l'intérieur de chaque Server Component / Server Action.
 * Crée une instance fraîche par requête, sans persistance de session
 * (pas de localStorage, pas de cookies) — adapté à l'usage solo sans auth.
 *
 * Ne PAS utiliser dans les Client Components → utiliser src/lib/supabase.ts
 */
import { createClient } from '@supabase/supabase-js'

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.'
    )
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,      // ← pas de localStorage en Node.js
      autoRefreshToken: false,    // ← pas de refresh token côté serveur
      detectSessionInUrl: false,  // ← pas d'URL parsing serveur
    },
  })
}
