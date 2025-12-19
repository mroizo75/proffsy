"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

type GalleryProps = {
  images: { url: string; alt?: string }[]
}

export function ProductGallery({ images }: GalleryProps) {
  const [mainImage, setMainImage] = useState<string>("")
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    // Sett det første bildet som hovedbilde
    if (images && images.length > 0) {
      setMainImage(images[0].url)
      setImageError(false)
    } else {
      setMainImage("")
    }
  }, [images])

  const hasValidImage = mainImage && !imageError

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="md:order-last md:col-span-3">
        <div className="relative aspect-square">
          {hasValidImage ? (
            <Image
              src={mainImage}
              alt="Hovedbilde"
              fill
              className="object-cover rounded-lg"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg">
              <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
              <span className="text-muted-foreground mt-2">Ingen bilde tilgjengelig</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Miniatyrbilder */}
      <div className="flex gap-4 md:flex-col">
        {images && images.length > 0 ? (
          images.map((image, index) => (
            <div 
              key={index}
              className={cn(
                "relative aspect-square cursor-pointer rounded-lg border-2",
                mainImage === image.url ? "border-primary" : "border-transparent"
              )}
              onClick={() => {
                setMainImage(image.url)
                setImageError(false)
              }}
            >
              <Image
                src={image.url}
                alt={image.alt || `Produktbilde ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ))
        ) : null}
      </div>
    </div>
  )
}
