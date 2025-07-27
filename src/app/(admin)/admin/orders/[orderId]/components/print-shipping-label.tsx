"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { toast } from "sonner"

export function PrintShippingLabel({ order }: { order: any }) {
  async function generateLabel() {
    try {
      const response = await fetch(`/api/orders/${order.orderId}/shipping-label`, {
        method: "POST"
      })

      if (!response.ok) throw new Error()

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fraktbrev-${order.orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Fraktbrev generert")
    } catch {
      toast.error("Kunne ikke generere fraktbrev")
    }
  }

  return (
    <Button onClick={generateLabel}>
      <Printer className="h-4 w-4 mr-2" />
      Skriv ut fraktbrev
    </Button>
  )
} 