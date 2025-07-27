"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

export type Product = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
}

export const columns: ColumnDef<Product>[] = [
  {
    header: "Navn",
    accessorKey: "name",
  },
  {
    header: "SKU",
    accessorKey: "sku",
  },
  {
    header: "Pris",
    accessorKey: "price",
    cell: ({ row }) => formatPrice(row.original.price),
  },
  {
    header: "Lager",
    accessorKey: "stock",
  },
  {
    header: "Vekt (g)",
    accessorKey: "weight",
    cell: ({ row }) => row.original.weight || "-",
  },
  {
    header: "Mål (cm)",
    accessorKey: "dimensions",
    cell: ({ row }) => {
      const { length, width, height } = row.original
      return `${length || '-'}x${width || '-'}x${height || '-'}`
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/admin/products/${row.original.id}`}>
          <Eye className="h-4 w-4 mr-2" />
          Se produkt
        </Link>
      </Button>
    ),
  },
] 