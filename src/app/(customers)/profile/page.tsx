"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react"

const profileSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  phone: z.string().optional(),
})

const addressSchema = z.object({
  street: z.string().min(2, "Gateadresse må være minst 2 tegn"),
  postalCode: z.string().length(4, "Postnummer må være 4 siffer"),
  city: z.string().min(2, "By må være minst 2 tegn"),
  country: z.string().default("NO"),
})

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [addresses, setAddresses] = useState([])

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    }
  })

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      postalCode: "",
      city: "",
      country: "NO",
    }
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      profileForm.reset({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "", // TODO: Add phone to user model
      })
    }
  }, [session, profileForm])

  const onSubmitProfile = async (data: z.infer<typeof profileSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Kunne ikke oppdatere profil")

      toast.success("Profil oppdatert")
      setEditingProfile(false)
    } catch (error) {
      toast.error("Kunne ikke oppdatere profil")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitAddress = async (data: z.infer<typeof addressSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Kunne ikke lagre adresse")

      toast.success("Adresse lagret")
      setEditingAddress(false)
      addressForm.reset()
      // TODO: Refresh addresses list
    } catch (error) {
      toast.error("Kunne ikke lagre adresse")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Laster profil...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Min profil</h1>
          <p className="text-gray-600 mt-2">
            Administrer din personlige informasjon og adresser
          </p>
        </div>

        {/* Profilinformasjon */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Personlig informasjon</h2>
            </div>
            {!editingProfile && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingProfile(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Rediger
              </Button>
            )}
          </div>

          {editingProfile ? (
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Navn</Label>
                  <Input
                    id="name"
                    {...profileForm.register("name")}
                    placeholder="Ditt navn"
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                    placeholder="din@epost.no"
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon (valgfritt)</Label>
                <Input
                  id="phone"
                  {...profileForm.register("phone")}
                  placeholder="+47 12 34 56 78"
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lagre endringer
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditingProfile(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Avbryt
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Navn</p>
                    <p className="font-medium">{session.user?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">E-post</p>
                    <p className="font-medium">{session.user?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium text-gray-500">Ikke oppgitt</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Adresser */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Mine adresser</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditingAddress(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Legg til adresse
            </Button>
          </div>

          {editingAddress && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-4">Legg til ny adresse</h3>
              <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Gateadresse</Label>
                  <Input
                    id="street"
                    {...addressForm.register("street")}
                    placeholder="Gatenavn 123"
                  />
                  {addressForm.formState.errors.street && (
                    <p className="text-sm text-red-500">
                      {addressForm.formState.errors.street.message}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postnummer</Label>
                    <Input
                      id="postalCode"
                      {...addressForm.register("postalCode")}
                      placeholder="0000"
                    />
                    {addressForm.formState.errors.postalCode && (
                      <p className="text-sm text-red-500">
                        {addressForm.formState.errors.postalCode.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">By</Label>
                    <Input
                      id="city"
                      {...addressForm.register("city")}
                      placeholder="Oslo"
                    />
                    {addressForm.formState.errors.city && (
                      <p className="text-sm text-red-500">
                        {addressForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Lagrer...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lagre adresse
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setEditingAddress(false)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Avbryt
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Existing addresses (placeholder) */}
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Ingen lagrede adresser ennå</p>
            <p className="text-sm">Legg til en adresse for raskere kasse</p>
          </div>
        </Card>

        {/* Kontoinnstillinger */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Kontoinnstillinger</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Endre passord</p>
                <p className="text-sm text-gray-600">Oppdater ditt passord</p>
              </div>
              <Button variant="outline" size="sm">
                Endre passord
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Slett konto</p>
                <p className="text-sm text-gray-600">Permanent slett din konto og all data</p>
              </div>
              <Button variant="destructive" size="sm">
                Slett konto
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}