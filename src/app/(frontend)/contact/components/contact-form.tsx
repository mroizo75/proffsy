"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "react-hot-toast"
import { Loader2 } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { useRef } from "react"

const formSchema = z.object({
  name: z.string()
    .min(2, "Navn må være minst 2 tegn")
    .max(50, "Navn kan ikke være lengre enn 50 tegn")
    .regex(/^[a-zA-ZæøåÆØÅ\s-]+$/, "Navn kan bare inneholde bokstaver"),
  
  email: z.string()
    .email("Ugyldig e-postadresse")
    .min(5, "E-post må være minst 5 tegn")
    .max(100, "E-post kan ikke være lengre enn 100 tegn"),
  
  phone: z.string()
    .optional()
    .refine((val) => !val || /^(\+?47)?[49]\d{7}$/.test(val), {
      message: "Ugyldig telefonnummer (må være norsk nummer)",
    }),
  
  subject: z.string()
    .min(2, "Emne må være minst 2 tegn")
    .max(100, "Emne kan ikke være lengre enn 100 tegn")
    .regex(/^[^<>{}]*$/, "Ugyldige tegn i emnet"),
  
  message: z.string()
    .min(10, "Meldingen må være minst 10 tegn")
    .max(1000, "Meldingen kan ikke være lengre enn 1000 tegn")
    .regex(/^[^<>{}]*$/, "Ugyldige tegn i meldingen"),
  
  honeypot: z.string().max(0, "Dette feltet skal være tomt"), // Honeypot felt
})

type FormValues = z.infer<typeof formSchema>

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const lastSubmitTime = useRef<number>(0)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      honeypot: "", // Skjult felt for spam-bots
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      // Rate limiting
      const now = Date.now()
      if (now - lastSubmitTime.current < 30000) { // 30 sekunder mellom hver innsending
        toast.error("Vennligst vent litt før du sender en ny melding")
        return
      }
      if (submitCount >= 5) { // Maks 5 innsendinger per sesjon
        toast.error("Du har nådd grensen for antall meldinger")
        return
      }

      // Verifiser reCAPTCHA
      const recaptchaValue = await recaptchaRef.current?.executeAsync()
      if (!recaptchaValue) {
        toast.error("Kunne ikke verifisere at du er et menneske")
        return
      }

      setIsLoading(true)

      // Sanitize data før sending
      const sanitizedData = {
        ...data,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim(),
        subject: data.subject.trim(),
        message: data.message.trim(),
      }

      // Send data til API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sanitizedData,
          recaptchaToken: recaptchaValue,
        }),
      })

      if (!response.ok) throw new Error()

      toast.success("Melding sendt! Vi tar kontakt så snart som mulig.")
      form.reset()
      setSubmitCount(prev => prev + 1)
      lastSubmitTime.current = now

    } catch (error) {
      toast.error("Noe gikk galt. Prøv igjen senere.")
    } finally {
      setIsLoading(false)
      recaptchaRef.current?.reset()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Honeypot felt - skjult for brukere */}
        <input
          type="text"
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
          {...form.register('honeypot')}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navn *</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="Ditt navn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-post *</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="din@epost.no" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon (valgfritt)</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="Ditt telefonnummer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emne *</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="Hva gjelder henvendelsen?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Melding *</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={isLoading} 
                  placeholder="Skriv din melding her..." 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Usynlig reCAPTCHA */}
        <ReCAPTCHA
          ref={recaptchaRef}
          size="invisible"
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        />

        <Button disabled={isLoading} type="submit" className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send melding
        </Button>
      </form>
    </Form>
  )
} 