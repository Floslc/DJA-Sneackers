export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'

export default async function DashboardPage() {
  const { data: pairs = [], error } = await supabase
    .from('pairs')
    .select('*')

  if (error) {
    console.error('DASHBOARD ERROR:', error)
  }

  console.log('DASHBOARD DATA:', pairs)

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(pairs, null, 2)}</pre>
    </div>
  )
}