'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthlyData {
  month: string
  sales: number
  margin: number
  count: number
}

interface BrandData {
  name: string
  value: number
}

interface AnalyticsChartsProps {
  monthlyData: MonthlyData[]
  brandData: BrandData[]
}

const COLORS = ['#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a']
const CHART_COLORS = {
  grid: '#27272a',
  text: '#71717a',
  sales: '#818cf8',
  margin: '#4ade80',
}

function formatEur(n: number) {
  return `${n.toFixed(0)} €`
}

export function AnalyticsCharts({ monthlyData, brandData }: AnalyticsChartsProps) {
  if (monthlyData.length === 0 && brandData.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={i === 3 ? 'lg:col-span-2' : ''}>
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-sm text-zinc-500">Pas encore de données</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Sales per Month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Ventes par mois (€)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatEur}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 6,
                  color: '#e4e4e7',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value.toFixed(2)} €`, 'Ventes']}
              />
              <Bar dataKey="sales" fill={CHART_COLORS.sales} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Margin per Month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Marge par mois (€)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatEur}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 6,
                  color: '#e4e4e7',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value.toFixed(2)} €`, 'Marge']}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke={CHART_COLORS.margin}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS.margin, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Brands Pie */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-400">Top 5 marques vendues</CardTitle>
        </CardHeader>
        <CardContent>
          {brandData.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-zinc-500">Pas encore de ventes</p>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {brandData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: 6,
                      color: '#e4e4e7',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value, 'paires vendues']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {brandData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-zinc-300">{entry.name}</span>
                    <span className="text-sm text-zinc-500 ml-auto">{entry.value} paires</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
