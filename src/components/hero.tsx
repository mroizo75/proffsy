"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface HeroProps {
  title: string
  description?: string | null
  buttonText?: string | null
  buttonLink?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  isVideo?: boolean
}

export function Hero({ 
  title, 
  description, 
  buttonText, 
  buttonLink,
  imageUrl,
  videoUrl,
  isVideo 
}: HeroProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/1" }}>
      {isVideo && videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : imageUrl ? (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ) : null}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
              {title}
            </h1>
            {description && (
              <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8">
                {description}
              </p>
            )}
            {buttonText && buttonLink && (
              <a
                href={buttonLink}
                className={cn(
                  "inline-flex items-center justify-center",
                  "rounded-md px-5 py-2.5 text-base md:text-lg font-medium",
                  "bg-white text-black hover:bg-white/90",
                  "transition-colors duration-200"
                )}
              >
                {buttonText}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 