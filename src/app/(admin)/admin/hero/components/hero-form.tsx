"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

// Skjemavalidering med Zod
const formSchema = z.object({
  title: z.string().min(1, "Tittel er påkrevd"),
  description: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  isVideo: z.boolean().default(false),
})

type HeroFormProps = {
  initialData?: {
    id: string
    title: string
    description: string | null
    buttonText: string | null
    buttonLink: string | null
    imageUrl: string | null
    videoUrl: string | null
    isVideo: boolean
    active: boolean
  } | null
}

export function HeroForm({ initialData }: HeroFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)

  // Form setup med react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      buttonText: initialData?.buttonText || "",
      buttonLink: initialData?.buttonLink || "",
      isVideo: initialData?.isVideo || false,
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      // Opprett en midlertidig URL for forhåndsvisning
      const imageUrl = URL.createObjectURL(file)
      setImagePreview(imageUrl)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedVideo(file)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      if ((!initialData?.imageUrl && !selectedImage) && (!initialData?.videoUrl && !selectedVideo) && !values.isVideo) {
        toast.error("Du må laste opp et bilde eller en video")
        setIsLoading(false)
        return
      }

      const formData = new FormData()
      
      // Legg til alle skjemaverdier i FormData
      formData.append("title", values.title)
      if (values.description) formData.append("description", values.description)
      if (values.buttonText) formData.append("buttonText", values.buttonText)
      if (values.buttonLink) formData.append("buttonLink", values.buttonLink)
      formData.append("isVideo", values.isVideo.toString())

      // Legg til bilde/video hvis det er valgt
      if (selectedImage) {
        formData.append("image", selectedImage)
      }
      if (selectedVideo) {
        formData.append("video", selectedVideo)
      }

      // Legg til ID hvis vi oppdaterer
      if (initialData?.id) {
        formData.append("id", initialData.id)
      }

      // Send data til API
      const url = initialData?.id 
        ? `/api/admin/hero/${initialData.id}` 
        : '/api/admin/hero'
      
      const response = await fetch(url, {
        method: initialData?.id ? "PUT" : "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Noe gikk galt")
      }

      toast.success(initialData?.id 
        ? "Hero-seksjonen ble oppdatert" 
        : "Hero-seksjonen ble opprettet")
      
      // Sikre at nettlesercachen tømmes og UI oppdateres
      router.refresh()
      
      // Kort timeout for å sikre at databaseoperasjonen er fullført
      setTimeout(() => {
        router.push("/admin/hero")
      }, 300)
    } catch (error) {
      toast.error("Noe gikk galt")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tittel *</FormLabel>
              <FormControl>
                <Input placeholder="Skriv en tittel..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Skriv en beskrivelse..."
                  rows={4}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="buttonText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Knappetekst</FormLabel>
                <FormControl>
                  <Input placeholder="F.eks. 'Se alle produkter'" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buttonLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Koblingsdestinasjon</FormLabel>
                <FormControl>
                  <Input placeholder="F.eks. '/products'" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isVideo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Bruk video i stedet for bilde
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <Label htmlFor="image">
            {form.watch("isVideo") ? "Video" : "Bilde"} 
            {initialData?.imageUrl || initialData?.videoUrl ? " (la være blank for å beholde nåværende)" : " *"}
          </Label>
          <Input 
            id={form.watch("isVideo") ? "video" : "image"}
            type="file" 
            accept={form.watch("isVideo") ? "video/*" : "image/*"}
            onChange={form.watch("isVideo") ? handleVideoChange : handleImageChange}
          />
          
          {/* Forhåndsvisning av bilde */}
          {imagePreview && !form.watch("isVideo") && (
            <div className="mt-2">
              <p className="text-sm mb-2">Forhåndsvisning:</p>
              <div className="relative aspect-[3/1] w-full overflow-hidden rounded-md">
                <Image 
                  src={imagePreview} 
                  alt="Forhåndsvisning" 
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Oppdater" : "Legg til"} hero-seksjon
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/hero")}>
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  )
} 