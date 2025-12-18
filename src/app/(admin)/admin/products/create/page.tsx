"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImagePreview {
  file: File
  url: string
}

export default function CreateProduct() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }))

    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index].url)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      // Fjern eventuelle eksisterende bildefiler fra FormData
      formData.delete("images")
      
      // Legg til bildene fra vår preview-state
      imagePreviews.forEach(({ file }) => {
        formData.append("images", file)
      })

      // Legg til tom categories array hvis ingen er valgt
      if (!formData.get("categories")) {
        formData.append("categories", "[]")
      }

      const response = await fetch("/api/admin/products/new", {
        method: "POST",
        // Ikke sett Content-Type header - la browseren sette riktig boundary for multipart/form-data
        headers: {
          // La browseren automatisk sette riktig Content-Type med boundary
          // 'Content-Type' header skal IKKE settes manuelt for FormData
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Noe gikk galt")
      }

      toast.success("Produkt opprettet")
      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke opprette produkt")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Opprett nytt produkt</h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Produktnavn
            </label>
            <Input
              id="name"
              name="name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              SKU
            </label>
            <Input
              id="sku"
              name="sku"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Beskrivelse
          </label>
          <Textarea
            id="description"
            name="description"
            required
            className="min-h-[100px]"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Pris
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Produktbilder
          </label>
          
          {/* Bildeopplastingsområde */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
              disabled={isLoading}
            />
            <label 
              htmlFor="images"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Klikk for å laste opp bilder
              </span>
            </label>
          </div>

          {/* Bildeforhåndsvisning */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div 
                  key={preview.url} 
                  className="relative aspect-square group"
                >
                  <Image
                    src={preview.url}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oppretter...
              </>
            ) : (
              "Opprett produkt"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 