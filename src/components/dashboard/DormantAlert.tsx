import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { Pair } from '@/lib/types'
import { daysInStock } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DormantAlertProps {
  pairs: Pair[]
}

export function DormantAlert({ pairs }: DormantAlertProps) {
  if (pairs.length === 0) return null

  return (
    <Card className="border-yellow-900/50 bg-yellow-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-yellow-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {pairs.length} paire{pairs.length > 1 ? 's' : ''} dormante{pairs.length > 1 ? 's' : ''}{' '}
          (&gt;90 jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pairs.slice(0, 5).map((pair) => (
            <div key={pair.id} className="flex items-center justify-between text-sm">
              <Link
                href={`/stock/${pair.id}`}
                className="text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                {pair.brand} {pair.model} – {pair.size}
              </Link>
              <span className="text-yellow-500 font-medium">{daysInStock(pair)}j</span>
            </div>
          ))}
          {pairs.length > 5 && (
            <p className="text-xs text-zinc-500 pt-1">
              + {pairs.length - 5} autre{pairs.length - 5 > 1 ? 's' : ''}...{' '}
              <Link href="/analytics" className="text-yellow-400 hover:underline">
                Voir tout
              </Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
