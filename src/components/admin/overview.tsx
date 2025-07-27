"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

interface OverviewProps {
  data: {
    name: string
    total: number
  }[]
}

export function Overview({ data }: OverviewProps) {
  // Formater tidsstempelet for visning
  const formattedData = data.map(item => ({
    ...item,
    name: new Date(item.name).toLocaleDateString('nb-NO', { 
      day: 'numeric', 
      month: 'short'
    })
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={formattedData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value} kr`}
        />
        <Tooltip 
          formatter={(value: number) => formatPrice(value)}
          labelFormatter={(label) => `Dato: ${label}`}
        />
        <Bar 
          dataKey="total" 
          fill="#8884d8" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 