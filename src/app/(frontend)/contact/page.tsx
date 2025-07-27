import { Metadata } from "next"
import { ContactForm } from "./components/contact-form"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Kontakt oss | Proffsy",
  description: "Kontakt Proffsy for spørsmål om våre produkter, spesialtilpasninger eller andre henvendelser.",
}

export default function ContactPage() {
  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Kontakt oss</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Kontaktinformasjon */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Kontaktinformasjon</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">E-post</p>
                    <a href="mailto:ordre@amento.no" className="text-muted-foreground hover:text-primary">
                      ordre@amento.no
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Telefon</p>
                    <a href="tel:38347470" className="text-muted-foreground hover:text-primary">
                      +47 38 34 74 70
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Besøksadresse</p>
                    <p className="text-muted-foreground">
                      Amento AS<br />
                      Nye Monoddveien 7<br />
                      4580 Lyngdal<br />
                      Norge
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Åpningstider</p>
                    <p className="text-muted-foreground">
                      Mandag-fredag: 08:00-16:00<br />
                      Lørdag-søndag: Stengt
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-6">Om oss</h2>
              <p className="text-muted-foreground">
                Proffsy har mer enn 30 års erfaring innen industrisøm. Vi produserer 
                kvalitetsbelter og andre produkter i vårt verksted på Kvavik i Lyngdal. 
                Ta gjerne kontakt for spesialtilpasninger eller andre henvendelser.
              </p>
            </div>
          </div>

          {/* Kontaktskjema */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Send oss en melding</h2>
            <ContactForm />
          </div>
        </div>

        {/* Kart */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Finn oss</h2>
          <div className="aspect-video w-full rounded-lg overflow-hidden border">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2147.635042137707!2d7.078847776678611!3d58.13859497355135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4637d8c8d3190f45%3A0x4947038bc1099a76!2sNye%20Monoddveien%207%2C%204580%20Lyngdal!5e0!3m2!1sno!2sno!4v1709837150651!5m2!1sno!2sno"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 