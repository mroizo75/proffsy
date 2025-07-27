"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type GalleryProps = {
  images: { url: string; alt?: string }[]
}

export function ProductGallery({ images }: GalleryProps) {
  const [mainImage, setMainImage] = useState<string>("")
  
  useEffect(() => {
    console.log("Gallery received images:", images)
    // Sett det første bildet som hovedbilde eller bruk placeholder
    if (images && images.length > 0) {
      setMainImage(images[0].url)
    } else {
      // Bruk en faktisk URL som finnes i prosjektet
      setMainImage("/placeholder.jpg")
    }
  }, [images])

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="md:order-last md:col-span-3">
        <div className="relative aspect-square">
          {mainImage ? (
            <Image
              src={mainImage}
              alt="Hovedbilde"
              fill
              className="object-cover rounded-lg"
              priority
              onError={() => setMainImage("/placeholder.jpg")} // Backup fallback
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
              <span className="text-muted-foreground">Ingen bilde tilgjengelig</span>
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
              onClick={() => setMainImage(image.url)}
            >
              <Image
                src={image.url}
                alt={image.alt || `Produktbilde ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">Ingen flere bilder tilgjengelig</div>
        )}
      </div>
    </div>
  )
} 