"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Eye, ArrowUpDown } from "lucide-react"

export type Order = {
  id: string
  orderId: string
  status: string
  shippingStatus: string
  totalAmount: number
  shippingAmount: number
  customerEmail: string
  createdAt: string
  paymentStatus: string
  paymentMethod: string
  paymentId?: string
  trackingNumber?: string
}

const orderStatuses = {
  PENDING: { label: "Venter", color: "bg-yellow-500" },
  PROCESSING: { label: "Behandles", color: "bg-blue-500" },
  COMPLETED: { label: "Fullført", color: "bg-green-500" },
  CANCELLED: { label: "Kansellert", color: "bg-red-500" },
}

const paymentStatuses = {
  PENDING: { label: "Venter", color: "bg-yellow-500" },
  PAID: { label: "Betalt", color: "bg-green-500" },
  FAILED: { label: "Feilet", color: "bg-red-500" },
}

const shippingStatuses = {
  PENDING: { label: "Venter", color: "bg-gray-500", icon: "⏳" },
  PROCESSING: { label: "Klar for sending", color: "bg-orange-500", icon: "⚡" },
  SHIPPED: { label: "Sendt", color: "bg-blue-500", icon: "📦" },
  IN_TRANSIT: { label: "På vei", color: "bg-blue-600", icon: "🚚" },
  OUT_FOR_DELIVERY: { label: "Ute på levering", color: "bg-purple-500", icon: "🚛" },
  DELIVERED: { label: "Levert", color: "bg-green-500", icon: "✅" },
  FAILED_DELIVERY: { label: "Leveringsfeil", color: "bg-red-500", icon: "❌" },
  RETURNED: { label: "Returnert", color: "bg-gray-600", icon: "↩️" },
}

const paymentMethods: Record<string, string> = {
  "visa": "Visa",
  "mastercard": "Mastercard",
  "vipps": "Vipps"
}

export const columns: ColumnDef<Order>[] = [
  {
    header: "Ordre ID",
    accessorKey: "orderId",
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: "status",
    cell: ({ row }) => {
      const status = orderStatuses[row.original.status as keyof typeof orderStatuses]
      return (
        <Badge className={status.color}>
          {status.label}
        </Badge>
      )
    }
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Forsendelse
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: "shippingStatus",
    cell: ({ row }) => {
      const status = shippingStatuses[row.original.shippingStatus as keyof typeof shippingStatuses] || 
                    { label: row.original.shippingStatus, color: "bg-gray-500", icon: "❓" }
      return (
        <div className="flex items-center gap-2">
          <Badge className={status.color}>
            <span className="mr-1">{status.icon}</span>
            {status.label}
          </Badge>
          {row.original.trackingNumber && (
            <span className="text-xs text-muted-foreground font-mono">
              {row.original.trackingNumber}
            </span>
          )}
        </div>
      )
    }
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Betaling
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: "paymentStatus",
    cell: ({ row }) => {
      const isPaid = row.original.paymentStatus === "PAID" || 
                    (row.original.paymentId && row.original.status !== "CANCELLED")
      
      const status = isPaid 
        ? paymentStatuses.PAID
        : row.original.status === "CANCELLED"
          ? paymentStatuses.FAILED
          : paymentStatuses.PENDING

      const method = row.original.paymentMethod?.toLowerCase()
      const methodLabel = method ? paymentMethods[method] : null
      
      return (
        <div className="space-y-1">
          <Badge className={status.color}>
            {status.label}
          </Badge>
          {isPaid && methodLabel && (
            <div className="text-sm text-muted-foreground">
              via {methodLabel}
            </div>
          )}
        </div>
      )
    }
  },
  {
    header: "Total",
    accessorKey: "totalAmount",
    cell: ({ row }) => formatPrice(row.original.totalAmount),
  },
  {
    header: "Frakt",
    accessorKey: "shippingAmount",
    cell: ({ row }) => formatPrice(row.original.shippingAmount),
  },
  {
    header: "Kunde",
    accessorKey: "customerEmail",
  },
  {
    header: "Dato",
    accessorKey: "createdAt",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('nb-NO'),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/admin/orders/${row.original.orderId}`}>
          <Eye className="h-4 w-4 mr-2" />
          Se ordre
        </Link>
      </Button>
    ),
  },
] 