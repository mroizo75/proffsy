"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Mail, Eye } from "lucide-react"
import Link from "next/link"

export type User = {
  id: string
  name: string
  email: string
  role: string
  orderCount: number
  totalSpent: number
  lastOrderDate: Date | null
  createdAt: string
  status: string
}

const roleLabels = {
  USER: { label: "Kunde", color: "bg-blue-500" },
  ADMIN: { label: "Admin", color: "bg-purple-500" },
}

const statusLabels = {
  ACTIVE: { label: "Aktiv", color: "bg-green-500" },
  INACTIVE: { label: "Inaktiv", color: "bg-gray-500" },
}

export const columns: ColumnDef<User>[] = [
  {
    header: "Navn",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-sm text-muted-foreground">{row.original.email}</span>
      </div>
    )
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rolle
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: "role",
    cell: ({ row }) => {
      const role = roleLabels[row.original.role as keyof typeof roleLabels]
      return (
        <Badge className={role.color}>
          {role.label}
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
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: "status",
    cell: ({ row }) => {
      const status = statusLabels[row.original.status as keyof typeof statusLabels]
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
          Ordre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: "orderCount",
    cell: ({ row }) => (
      <div className="text-center">
        <span className="font-semibold">{row.original.orderCount}</span>
        {row.original.orderCount > 0 && (
          <div className="text-xs text-muted-foreground">
            {formatPrice(row.original.totalSpent)} totalt
          </div>
        )}
      </div>
    )
  },
  {
    header: "Siste ordre",
    accessorKey: "lastOrderDate",
    cell: ({ row }) => {
      if (!row.original.lastOrderDate) {
        return <span className="text-muted-foreground">Aldri</span>
      }
      return (
        <div className="text-sm">
          {new Date(row.original.lastOrderDate).toLocaleDateString('nb-NO')}
        </div>
      )
    }
  },
  {
    header: "Registrert",
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.createdAt).toLocaleDateString('nb-NO')}
      </div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <a href={`mailto:${row.original.email}`}>
            <Mail className="h-4 w-4" />
          </a>
        </Button>
        {row.original.orderCount > 0 && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/admin/orders?user=${row.original.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Ordre
            </Link>
          </Button>
        )}
      </div>
    ),
  },
] 