"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { columns } from "./components/columns"
import { ProductDialog } from "@/components/admin/products/product-dialog"
import { useProducts } from "@/lib/hooks/use-products"
import { Loader2 } from "lucide-react"
import type { Product } from "./components/columns"

export default function AdminProductsPage() {
  const { products, isLoading, isError } = useProducts()

  console.log('ProductsPage rendering')

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return <div>Error: {isError.message}</div>
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Produkter</h1>
        <ProductDialog 
          trigger={
            <Button onClick={() => {
              console.log('New product button clicked')
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nytt produkt
            </Button>
          }
        />
      </div>

      <DataTable 
        columns={columns} 
        data={(products || []) as unknown as Product[]}
        searchKey="name"
      />
    </div>
  )
} 