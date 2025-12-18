"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const companySchema = z.object({
  companyName: z.string().min(2, "Bedriftsnavn må være minst 2 tegn"),
  street: z.string().min(2, "Gateadresse må være minst 2 tegn"),
  postalCode: z.string().length(4, "Postnummer må være 4 siffer"),
  city: z.string().min(2, "By må være minst 2 tegn"),
  country: z.string().default("NO"),
  phone: z.string().optional(),
  email: z.string().email("Ugyldig e-postadresse").optional().or(z.literal("")),
  orgNumber: z.string().optional(),
})

export default function CompanySettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(companySchema)
  })

  // Last inn eksisterende innstillinger når komponenten mounter
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoadingData(true)
        const response = await fetch("/api/admin/settings/company")
        
        if (!response.ok) {
          // Ikke vis error toast - kanskje det ikke finnes innstillinger ennå
          return
        }

        const settings = await response.json()
        
        if (settings) {
          // Populer formen med eksisterende data
          reset({
            companyName: settings.companyName || "",
            street: settings.street || "",
            postalCode: settings.postalCode || "",
            city: settings.city || "",
            country: settings.country || "NO",
            phone: settings.phone || "",
            email: settings.email || "",
            orgNumber: settings.orgNumber || ""
          })
        }
      } catch (error) {
      } finally {
        setIsLoadingData(false)
      }
    }

    loadSettings()
  }, [])

  const onSubmit = async (data: z.infer<typeof companySchema>) => {
    setIsLoading(true)
    try {
      
      const response = await fetch("/api/admin/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Kunne ikke lagre innstillinger: ${response.status}`)
      }

      const result = await response.json()
      
      toast.success("Bedriftsinnstillinger lagret successfully!")
    } catch (error) {
      toast.error(`Kunne ikke lagre innstillinger: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Vis loading mens data lastes
  if (isLoadingData) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Bedriftsinnstillinger</h1>
        <Card className="max-w-2xl p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Laster innstillinger...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Bedriftsinnstillinger</h1>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              {...register("companyName")}
              placeholder="Bedriftsnavn"
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              {...register("street")}
              placeholder="Gateadresse"
            />
            {errors.street && (
              <p className="text-sm text-red-500">{errors.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                {...register("postalCode")}
                placeholder="Postnummer"
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500">{errors.postalCode.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                {...register("city")}
                placeholder="By"
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Input
              {...register("phone")}
              placeholder="Telefon"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              {...register("email")}
              type="email"
              placeholder="E-post"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              {...register("orgNumber")}
              placeholder="Organisasjonsnummer"
            />
            {errors.orgNumber && (
              <p className="text-sm text-red-500">{errors.orgNumber.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              "Lagre innstillinger"
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
} 