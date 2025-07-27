"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import Image from "next/image"

interface SettingsFormProps {
  initialSettings: {
    companyLogo?: string
    companyName?: string
    companyAddress?: string
    companyPostal?: string
    companyCountry?: string
  }
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(initialSettings.companyLogo)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Hvis det er valgt en ny logo, last den opp først
      if (logo) {
        const logoFormData = new FormData()
        logoFormData.append('logo', logo)
        
        const uploadResponse = await fetch('/api/settings/logo', {
          method: 'POST',
          body: logoFormData,
        })
        
        if (!uploadResponse.ok) throw new Error('Kunne ikke laste opp logo')
        const { logoUrl } = await uploadResponse.json()
        formData.append('companyLogo', logoUrl)
      }

      // Lagre alle innstillinger
      const response = await fetch('/api/settings', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error()
      
      toast.success('Innstillinger lagret')
    } catch (error) {
      toast.error('Kunne ikke lagre innstillinger')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        <div>
          <Label htmlFor="logo">Firmalogo</Label>
          <div className="mt-2 space-y-4">
            {previewUrl && (
              <div className="relative w-40 h-40 border rounded">
                <Image
                  src={previewUrl}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="companyName">Firmanavn</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={initialSettings.companyName}
          />
        </div>

        <div>
          <Label htmlFor="companyAddress">Adresse</Label>
          <Input
            id="companyAddress"
            name="companyAddress"
            defaultValue={initialSettings.companyAddress}
          />
        </div>

        <div>
          <Label htmlFor="companyPostal">Postnummer og sted</Label>
          <Input
            id="companyPostal"
            name="companyPostal"
            defaultValue={initialSettings.companyPostal}
          />
        </div>

        <div>
          <Label htmlFor="companyCountry">Land</Label>
          <Input
            id="companyCountry"
            name="companyCountry"
            defaultValue={initialSettings.companyCountry}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Lagrer...' : 'Lagre innstillinger'}
        </Button>
      </Card>
    </form>
  )
} 