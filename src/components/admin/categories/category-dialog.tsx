"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useCategories, mutateCategories } from "@/lib/hooks/use-categories"
import { z } from "zod"

interface CategoryDialogProps {
  open: boolean
  onClose: () => void
  category?: {
    id: string
    name: string
    slug: string
    description?: string
  }
}

// Samme valideringsskjema som i API
const categorySchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  slug: z.string().min(1, "Slug er påkrevd"),
  description: z.string().optional(),
})

export function CategoryDialog({ open, onClose, category }: CategoryDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const formData = new FormData(event.currentTarget)
      const data = Object.fromEntries(formData)

      // Valider data før sending
      const validatedData = categorySchema.safeParse(data)
      
      if (!validatedData.success) {
        const fieldErrors: Record<string, string> = {}
        validatedData.error.errors.forEach(error => {
          if (error.path[0]) {
            fieldErrors[error.path[0].toString()] = error.message
          }
        })
        setErrors(fieldErrors)
        return
      }

      const url = category 
        ? `/api/admin/categories/${category.id}`
        : "/api/admin/categories"

      const response = await fetch(url, {
        method: category ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData.data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Noe gikk galt")
      }

      toast.success(category ? "Kategori oppdatert" : "Kategori opprettet")
      await mutateCategories()
      onClose()
    } catch (error) {
      console.error("Feil:", error)
      toast.error(error instanceof Error ? error.message : "Kunne ikke lagre kategori")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Rediger kategori" : "Opprett ny kategori"}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Navn
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              required
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-1">
              Slug
            </label>
            <Input
              id="slug"
              name="slug"
              defaultValue={category?.slug}
              required
              disabled={isLoading}
            />
            {errors.slug && (
              <p className="text-sm text-destructive mt-1">{errors.slug}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Beskrivelse
            </label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description}
              className="min-h-[100px]"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {category ? "Oppdaterer..." : "Oppretter..."}
                </>
              ) : (
                category ? "Oppdater" : "Opprett"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 