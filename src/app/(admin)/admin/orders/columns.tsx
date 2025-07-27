"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "orderId",
    header: "Ordrenr",
    cell: ({ row }) => (
      <Link href={`/admin/orders/${row.original.id}`} className="hover:underline">
        {row.getValue("orderId")}
      </Link>
    ),
  },
  {
    accessorKey: "customerEmail",
    header: "Kunde",
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => formatPrice(row.getValue("totalAmount")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status")
      return (
        <Badge variant={
          status === "COMPLETED" ? "success" :
          status === "PENDING" ? "warning" :
          status === "CANCELLED" ? "destructive" :
          "default"
        }>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Dato",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString('no-NO'),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/admin/orders/${order.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Se detaljer
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 