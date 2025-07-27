"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"

const schema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.status === 429) {
        const retryAfter = new Date(result.retryAfter).getTime() - Date.now()
        const minutes = Math.ceil(retryAfter / 1000 / 60)
        setError(`For mange forsøk. Vennligst vent ${minutes} minutter før du prøver igjen.`)
        return
      }

      if (response.ok) {
        setStatus("success")
      } else {
        setError(result.message || "Noe gikk galt. Prøv igjen senere.")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Glemt passord
          </h1>
          <p className="text-sm text-muted-foreground">
            Skriv inn din e-postadresse for å tilbakestille passordet
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                placeholder="navn@eksempel.no"
                type="email"
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            {status === "success" && (
              <Alert>Sjekk e-posten din for instruksjoner</Alert>
            )}
            {status === "error" && (
              <Alert variant="destructive">
                {error}
              </Alert>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sender..." : "Send tilbakestillingslenke"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 