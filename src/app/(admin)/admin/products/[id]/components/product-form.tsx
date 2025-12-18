"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { AlertModal } from "@/components/modals/alert-modal"
import { toast } from "sonner"
import { Trash, ImagePlus, Plus, X } from "lucide-react"
import Image from "next/image"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Category, Color, Product, Image as ProductImage } from "@prisma/client"

const formSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  description: z.string().min(1, "Beskrivelse er påkrevd"),
  price: z.coerce.number().min(0, "Pris må være større enn 0"),
  sku: z.string().min(1, "SKU er påkrevd"),
  stock: z.coerce.number().min(0, "Lager må være større enn 0"),
  categoryIds: z.array(z.string()).min(1, "Velg minst én kategori"),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string(),
    alt: z.string().optional()
  })).min(1, "Minst ett bilde er påkrevd"),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    sku: z.string(),
    price: z.coerce.number(),
    stock: z.coerce.number(),
    colorId: z.string().optional(),
    images: z.array(z.object({
      id: z.string().optional(),
      url: z.string(),
      alt: z.string().optional()
    })).optional()
  })).optional()
})

type ProductFormValues = z.infer<typeof formSchema>

interface ProductFormProps {
  initialData: Product & {
    images: ProductImage[]
    variants: any[]
    categories: Category[]
  } | null
  categories: Category[]
  colors: Color[]
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  colors
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const title = initialData ? "Rediger produkt" : "Opprett produkt"
  const description = initialData ? "Rediger produktinformasjon." : "Legg til et nytt produkt"
  const toastMessage = initialData ? "Produkt oppdatert." : "Produkt opprettet."
  const action = initialData ? "Lagre endringer" : "Opprett"

  const defaultValues: ProductFormValues = initialData ? {
    name: initialData.name,
    description: initialData.description,
    price: Number(initialData.price),
    sku: initialData.sku,
    stock: initialData.stock,
    categoryIds: initialData.categories.map(c => c.id),
    images: initialData.images.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? undefined
    })),
    variants: initialData.variants?.map(v => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock,
      colorId: v.colorId ?? undefined,
      images: v.image ? [{ url: v.image }] : undefined
    })) ?? []
  } : {
    name: "",
    description: "",
    price: 0,
    sku: "",
    stock: 0,
    categoryIds: [],
    images: [],
    variants: []
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  })

  const onSubmit = async (data: ProductFormValues) => {
    try {
      console.log("Starter innsending av skjema", data);
      setLoading(true);
      
      const formData = {
        ...data,
        price: Number(data.price),
        variants: data.variants?.map(variant => ({
          ...variant,
          price: Number(variant.price),
          stock: Number(variant.stock)
        }))
      };
      
      console.log("Behandlet formData:", formData);

      if (initialData) {
        console.log("Oppdaterer eksisterende produkt:", initialData.id);
        const response = await fetch(`/api/admin/products/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        console.log("Respons status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Feil under oppdatering:", errorText);
          throw new Error(errorText || "Kunne ikke oppdatere produkt");
        }
        
        const result = await response.json();
        console.log("Oppdatert produkt:", result);
      } else {
        console.log("Oppretter nytt produkt");
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        console.log("Respons status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Feil under opprettelse:", errorText);
          throw new Error(errorText || "Kunne ikke opprette produkt");
        }
        
        const result = await response.json();
        console.log("Opprettet produkt:", result);
      }

      router.refresh();
      router.push('/admin/products');
      toast.success(toastMessage);
    } catch (error) {
      console.error("Feil under innsending:", error);
      toast.error(error instanceof Error ? error.message : "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  }

  const onDelete = async () => {
    try {
      setLoading(true)
      await fetch(`/api/admin/products/${initialData?.id}`, {
        method: "DELETE"
      })
      router.refresh()
      router.push('/admin/products')
      toast.success("Produkt slettet.")
    } catch (error) {
      toast.error("Noe gikk galt.")
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'products')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error()

      const data = await response.json()
      const images = form.getValues('images')
      form.setValue('images', [...images, { url: data.url }])
    } catch (error) {
      toast.error('Kunne ikke laste opp bilde')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleVariantImageUpload = async (file: File, variantIndex: number) => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'variant')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error()

      const data = await response.json()
      const variants = form.getValues('variants') || []
      const variant = variants[variantIndex]
      
      if (!variant.images) {
        variant.images = []
      }
      
      variant.images.push({ url: data.url })
      form.setValue(`variants.${variantIndex}.images`, variant.images)
    } catch (error) {
      toast.error('Kunne ikke laste opp bilde')
    } finally {
      setUploadingImage(false)
    }
  }

  const addVariant = () => {
    const variants = form.getValues('variants') || []
    variants.push({
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      images: []
    })
    form.setValue('variants', variants)
  }

  const removeVariant = (index: number) => {
    const variants = form.getValues('variants') || []
    variants.splice(index, 1)
    form.setValue('variants', variants)
  }

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    const variants = form.getValues('variants') || []
    const variant = variants[variantIndex]
    if (variant.images) {
      variant.images.splice(imageIndex, 1)
      form.setValue(`variants.${variantIndex}.images`, [...variant.images])
    }
  }

  return (
    <>
      <AlertModal 
        isOpen={open} 
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Produktnavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="SKU-kode" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pris</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="9.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lager</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={loading} 
                      placeholder="Produktbeskrivelse..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="font-medium">Bilder</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {form.watch('images')?.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt="Product image"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const images = form.getValues('images')
                      images.splice(index, 1)
                      form.setValue('images', [...images])
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <label className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0])
                    }
                  }}
                />
                <ImagePlus className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mt-2">
                  Last opp bilde
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="font-medium">Kategorier</div>
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      disabled={loading}
                      value={field.value?.[0]}
                      onValueChange={(value) => field.onChange([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Varianter</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
              >
                <Plus className="h-4 w-4 mr-2" />
                Legg til variant
              </Button>
            </div>
            <div className="space-y-4">
              {form.watch('variants')?.map((variant, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Navn</FormLabel>
                          <FormControl>
                            <Input disabled={loading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input disabled={loading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pris</FormLabel>
                          <FormControl>
                            <Input type="number" disabled={loading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.stock`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lager</FormLabel>
                          <FormControl>
                            <Input type="number" disabled={loading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.colorId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farge</FormLabel>
                          <Select
                            disabled={loading}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Velg farge" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {colors.map((color) => (
                                <SelectItem key={color.id} value={color.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="font-medium text-sm">Variantbilder</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {variant.images?.map((image, imageIndex) => (
                        <div key={imageIndex} className="relative aspect-square">
                          <Image
                            src={image.url}
                            alt={`Variant ${variant.name} image`}
                            fill
                            className="object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeVariantImage(index, imageIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <label className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleVariantImageUpload(e.target.files[0], index)
                            }
                          }}
                        />
                        <ImagePlus className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground mt-2">
                          Last opp variantbilde
                        </span>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="mt-4"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Fjern variant
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button 
            disabled={loading} 
            className="ml-auto" 
            type="submit"
            onClick={() => console.log("Knapp trykket, form state:", form.getValues(), form.formState.errors)}
          >
            {action}
          </Button>
        </form>
      </Form>
    </>
  )
} 