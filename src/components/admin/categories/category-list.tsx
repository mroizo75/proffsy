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
import { Edit } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
}

export function CategoryList({ categories, onEdit }: CategoryListProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Navn</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Beskrivelse</TableHead>
            <TableHead className="w-[100px]">Handling</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(categories) && categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.slug}</TableCell>
              <TableCell>{category.description || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
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