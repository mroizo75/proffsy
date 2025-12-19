"use client"

import { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { useProducts, mutateProducts } from "@/lib/hooks/use-products"
import { useCategories } from "@/lib/hooks/use-categories"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useColors } from "@/lib/hooks/use-colors"

interface ImagePreview {
  file: File | null
  url: string
  existing?: boolean
}

interface ProductDialogProps {
  trigger?: React.ReactNode
  product?: {
    id: string
    name: string
    description: string
    price: number
    sku: string
    stock: number
    colorId?: string | null
    color?: {
      id: string
      name: string
      value: string
    } | null
    categories: { id: string }[]
    images: { url: string }[]
    variants: Array<{
      id?: string
      name: string
      sku: string
      price: number
      stock: number
      colorId?: string | null
      image?: string
    }>
  }
}

export function ProductDialog({ trigger, product }: ProductDialogProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { mutate } = useProducts()
  const { categories = [], isLoading: categoriesLoading } = useCategories()

  const [variants, setVariants] = useState<Array<{
    id?: string
    name: string
    sku: string
    price: number
    stock: number
    colorId?: string | null
    image?: string
  }>>(() => product?.variants || [])

  const { colors = [], isLoading: colorsLoading } = useColors({
    revalidateOnFocus: false,
    revalidateIfStale: false,
    enabled: open,
  })

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }

    if (product) {
      setSelectedCategories(product.categories.map(c => c.id))
      setImagePreviews(product.images.map(img => ({
        file: null,
        url: img.url,
        existing: true
      })))
      setVariants(product.variants || [])
    } else {
      resetForm()
      setVariants([{ 
        name: "", 
        sku: "", 
        price: 0, 
        stock: 0,
        colorId: null,
        image: ""
      }])
    }
  }, [open, product])

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset()
    }
    setImagePreviews([])
    setSelectedCategories([])
    setVariants([])
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews = Array.from(files).map(file => ({
      file: file,
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

  const handleClose = () => {
    resetForm()
    setOpen(false)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      }
      return [...prev, categoryId]
    })
  }

  const handleOpen = () => {
    if (trigger && !product) {
      setOpen(true)
      return
    }
    
    if (product) {
      setOpen(true)
      return
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      // Last opp nye produktbilder først
      const uploadedImageUrls: string[] = []
      
      // Behold eksisterende bilder
      for (const preview of imagePreviews) {
        if (preview.existing) {
          uploadedImageUrls.push(preview.url)
        } else if (preview.file) {
          // Last opp nye bilder
          const imageFormData = new FormData()
          imageFormData.append("image", preview.file)
          imageFormData.append("type", "products")
          
          const uploadResponse = await fetch("/api/admin/products/upload", {
            method: "POST",
            body: imageFormData
          })
          
          if (uploadResponse.ok) {
            const data = await uploadResponse.json()
            uploadedImageUrls.push(data.url)
          }
        }
      }
      
      // Fjern images fra formData (vi sender dem separat som JSON)
      formData.delete("images")
      
      // Legg til bildene som JSON
      formData.append("uploadedImages", JSON.stringify(uploadedImageUrls))
      
      // Legg til kategorier
      formData.append("categories", JSON.stringify(selectedCategories))
      
      // Legg til variants med bilder
      formData.append("variants", JSON.stringify(variants.map(variant => ({
        ...variant,
        image: variant.image || null
      }))))

      const url = product 
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products"

      const response = await fetch(url, {
        method: product ? "PUT" : "POST",
        body: formData
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Noe gikk galt")
      }

      toast.success(product ? "Produkt oppdatert" : "Produkt opprettet")
      await mutateProducts()
      resetForm()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke lagre produkt")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImageUpload(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("type", "variants")

    const response = await fetch("/api/admin/products/upload", {
      method: "POST",
      body: formData
    })

    if (!response.ok) {
      throw new Error("Kunne ikke laste opp bilde")
    }

    const data = await response.json()
    return data.url
  }

  try {
    return (
      <>
        <div onClick={handleOpen}>{trigger}</div>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>
                {product ? "Rediger produkt" : "Opprett nytt produkt"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Produktnavn
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Produktnavn"
                      defaultValue={product?.name}
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
                      placeholder="SKU"
                      defaultValue={product?.sku}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kategorier
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border rounded-lg p-4">
                    {categoriesLoading ? (
                      <div>Laster kategorier...</div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                            disabled={isLoading}
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center text-muted-foreground">
                        Ingen kategorier tilgjengelig
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Beskrivelse
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Beskrivelse"
                    defaultValue={product?.description}
                    required
                    className="min-h-[100px]"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-1">
                      Pris
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="Pris"
                      step="0.01"
                      defaultValue={product?.price}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Produktbilder
                  </label>
                  
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

                {/* Variant section */}
                <div className="space-y-4">
                  <h3 className="font-medium">Varianter</h3>
                  {variants.map((variant, index) => (
                    <div key={index} className="grid gap-4 p-4 border rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Variant navn
                        </label>
                        <Input
                          placeholder="f.eks. Small, Medium, Large"
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].name = e.target.value
                            setVariants(newVariants)
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          SKU (varenummer)
                        </label>
                        <Input
                          placeholder="f.eks. PROD-001-S"
                          value={variant.sku}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].sku = e.target.value
                            setVariants(newVariants)
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Pris (NOK)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={variant.price}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].price = parseInt(e.target.value)
                            setVariants(newVariants)
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Lagerbeholdning
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={variant.stock}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index].stock = parseInt(e.target.value)
                            setVariants(newVariants)
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Farge
                        </label>
                        <Select
                          value={variant.colorId || ""}
                          onValueChange={(value) => {
                            const newVariants = [...variants]
                            newVariants[index].colorId = value
                            setVariants(newVariants)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velg farge" />
                          </SelectTrigger>
                          <SelectContent>
                            {colors.map((color: any) => (
                              <SelectItem 
                                key={color.id} 
                                value={color.id}
                                className="flex items-center gap-2"
                              >
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Variantbilde
                        </label>
                        <div className="relative border-2 border-dashed rounded-lg p-4">
                          {variant.image ? (
                            <div className="relative w-20 h-20">
                              <Image
                                src={variant.image}
                                alt={variant.name}
                                fill
                                className="object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newVariants = [...variants]
                                  newVariants[index].image = ""
                                  setVariants(newVariants)
                                }}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return

                                  try {
                                    const url = await handleImageUpload(file)
                                    const newVariants = [...variants]
                                    newVariants[index].image = url
                                    setVariants(newVariants)
                                  } catch (error) {
                                    // Error er allerede håndtert i handleImageUpload
                                  }
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                Klikk for å laste opp bilde
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setVariants(variants.filter((_, i) => i !== index))
                        }}
                      >
                        Fjern variant
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setVariants([
                        ...variants,
                        { name: "", sku: "", price: 0, stock: 0 }
                      ])
                    }}
                  >
                    Legg til variant
                  </Button>
                </div>
              </form>
            </div>

            <div className="border-t px-6 py-4">
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Avbryt
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    "Lagre produkt"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  } catch (error) {
    return <div>Error: Could not render product dialog</div>
  }
} 