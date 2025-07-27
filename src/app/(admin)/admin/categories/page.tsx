"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CategoryDialog } from "@/components/admin/categories/category-dialog"
import { CategoryList } from "@/components/admin/categories/category-list"
import { useCategories } from "@/lib/hooks/use-categories"

export default function CategoriesPage() {
  const { categories, isLoading, isError } = useCategories()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  if (isError) {
    console.error('Categories error:', isError)
    return <div>Feil ved lasting av kategorier</div>
  }
  
  if (isLoading) return <div>Laster...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kategorier</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny kategori
        </Button>
      </div>

      <CategoryList 
        categories={categories}
        onEdit={(category) => {
          setSelectedCategory(category)
          setIsDialogOpen(true)
        }}
      />

      <CategoryDialog 
        open={isDialogOpen}
        onClose={() => {
          setSelectedCategory(null)
          setIsDialogOpen(false)
        }}
        category={selectedCategory}
      />
    </div>
  )
} 