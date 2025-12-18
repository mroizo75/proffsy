"use client"

import { useState, use } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"

const schema = z.object({
  password: z.string().min(6, "Passordet må være minst 6 tegn"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passordene må være like",
  path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Noe gikk galt under tilbakestilling av passord")
      }
    }
  }

  if (success) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Alert>
            Passordet ditt er oppdatert. Du vil bli videresendt til innloggingssiden.
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Tilbakestill passord
          </h1>
          <p className="text-sm text-muted-foreground">
            Skriv inn ditt nye passord nedenfor
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nytt passord</Label>
              <Input
                id="password"
                type="password"
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Bekreft nytt passord</Label>
              <Input
                id="confirmPassword"
                type="password"
                disabled={isSubmitting}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            {error && <Alert variant="destructive">{error}</Alert>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Oppdaterer..." : "Oppdater passord"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 