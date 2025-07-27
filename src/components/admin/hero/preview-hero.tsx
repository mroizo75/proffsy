"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog"
import { Hero } from "@/components/hero"
import { Button } from "@/components/ui/button"
import { Laptop, Smartphone, Tablet, Monitor } from "lucide-react"

interface PreviewHeroProps {
  open: boolean
  onClose: () => void
  data: {
    title: string
    description: string
    buttonText: string
    buttonLink: string
    imageUrl?: string
  }
}

type DeviceSize = "mobile" | "tablet" | "laptop" | "desktop"

const deviceSizes = {
  mobile: "380px",
  tablet: "768px",
  laptop: "1024px",
  desktop: "100%"
}

const deviceIcons = {
  mobile: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor
}

export function PreviewHero({ open, onClose, data }: PreviewHeroProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceSize>("desktop")
  const Icon = deviceIcons[selectedDevice]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl p-6">
        <DialogHeader>
          <DialogTitle>Forhåndsvisning av Hero</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Device selector */}
          <div className="flex items-center justify-center gap-2">
            {(Object.keys(deviceSizes) as DeviceSize[]).map((device) => {
              const DeviceIcon = deviceIcons[device]
              return (
                <Button
                  key={device}
                  variant={selectedDevice === device ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDevice(device)}
                  className="flex items-center gap-2"
                >
                  <DeviceIcon className="h-4 w-4" />
                  <span className="capitalize">{device}</span>
                </Button>
              )
            })}
          </div>

          {/* Preview container */}
          <div className="flex justify-center bg-muted/30 rounded-lg p-4">
            <div 
              style={{ 
                width: deviceSizes[selectedDevice],
                transition: "width 0.3s ease"
              }}
              className="bg-background overflow-hidden rounded-lg shadow-lg"
            >
              <div className={`
                relative 
                ${selectedDevice === "mobile" ? "scale-75" : "scale-100"}
                transition-transform
              `}>
                <Hero {...data} />
              </div>
            </div>
          </div>

          {/* Device info */}
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Icon className="h-4 w-4" />
              Forhåndsvisning for {selectedDevice} ({deviceSizes[selectedDevice]})
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 