import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Kontaktinformasjon */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontakt oss</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+47 38 34 74 70</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:post@proffsy.no" className="hover:underline">
                  ordre@amento.no
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Amento AS, Nye Monoddveien 7, 4580 Lyngdal</span>
              </li>
            </ul>
          </div>

          {/* Informasjon */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informasjon</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:underline">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  Vilkår og betingelser
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  Personvern
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:underline">
                  Frakt og levering
                </Link>
              </li>
            </ul>
          </div>

          {/* Kundeservice */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kundeservice</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="hover:underline">
                  Ofte stilte spørsmål
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:underline">
                  Retur og bytte
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Kontakt oss
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:underline">
                  Størrelsesguide
                </Link>
              </li>
            </ul>
          </div>

          {/* Nyhetsbrev og sosiale medier */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Følg oss</h3>
            <div className="flex space-x-4 mb-6">
              <a
                href="https://facebook.com/proffsy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com/proffsy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Meld deg på vårt nyhetsbrev for å motta eksklusive tilbud og nyheter.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Proffsy. Alle rettigheter reservert.</p>
        </div>
      </div>
    </footer>
  )
} 