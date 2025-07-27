"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const orderStatuses = [
  { value: "PENDING", label: "Venter" },
  { value: "PROCESSING", label: "Behandles" },
  { value: "COMPLETED", label: "Fullført" },
  { value: "CANCELLED", label: "Kansellert" },
]

export function OrderStatusSelect({ order }: { order: any }) {
  const [status, setStatus] = useState(order.status)

  async function updateStatus(newStatus: string) {
    try {
      const response = await fetch(`/api/orders/${order.orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error()

      setStatus(newStatus)
      toast.success("Ordrestatus oppdatert")
    } catch {
      toast.error("Kunne ikke oppdatere status")
    }
  }

  return (
    <Select value={status} onValueChange={updateStatus}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Velg status" />
      </SelectTrigger>
      <SelectContent>
        {orderStatuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 