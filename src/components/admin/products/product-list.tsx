"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { useState } from "react"
import { removeProductFromCache } from "@/lib/hooks/use-products"

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  stock: number
  categories: { id: string; name: string }[]
  images: { url: string }[]
}

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
}

export function ProductList({ products, onEdit }: ProductListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (productId: string) => {
    if (!confirm("Er du sikker på at du vil slette dette produktet?")) return

    setDeletingId(productId)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Kunne ikke slette produkt")
      }

      await removeProductFromCache(productId)
      toast.success("Produkt slettet")
    } catch (error) {
      toast.error("Kunne ikke slette produkt")
    } finally {
      setDeletingId(null)
    }
  }

  if (!products?.length) {
    return (
      <div className="text-center p-6 border rounded-lg">
        <p className="text-muted-foreground">Ingen produkter funnet</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Navn</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Pris</TableHead>
            <TableHead>Lager</TableHead>
            <TableHead>Kategorier</TableHead>
            <TableHead className="w-[150px]">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{formatPrice(product.price)}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                {product.categories.map(cat => cat.name).join(", ")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 