import { Metadata } from "next"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Ofte stilte spørsmål | Proffsy",
  description: "Svar på vanlige spørsmål om produkter, bestilling, levering og kundeservice hos Proffsy.",
}

export default function FAQPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Ofte stilte spørsmål</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Bestilling og betaling</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Hvordan bestiller jeg?</AccordionTrigger>
                <AccordionContent>
                  Du kan enkelt bestille våre produkter gjennom nettbutikken. Velg produktene du ønsker, 
                  legg dem i handlekurven og følg betalingsprosessen. Du kan også kontakte oss direkte 
                  for spesialbestillinger eller større ordrer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Hvilke betalingsmetoder aksepterer dere?</AccordionTrigger>
                <AccordionContent>
                  Vi aksepterer betaling med VISA, Mastercard og Vipps. Bedriftskunder kan også få 
                  tilbud om faktura etter avtale.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Er det trygt å handle hos dere?</AccordionTrigger>
                <AccordionContent>
                  Ja, vi bruker sikre betalingsløsninger gjennom DIBS/Nets. Alle betalinger er 
                  krypterte og vi følger strenge sikkerhetsrutiner for å beskytte dine personopplysninger.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Produkter og tilpasning</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-4">
                <AccordionTrigger>Kan jeg få spesialtilpassede produkter?</AccordionTrigger>
                <AccordionContent>
                  Ja, vi tilbyr skreddersøm og spesialtilpasning av de fleste av våre produkter. 
                  Ta kontakt med oss for å diskutere dine behov og få et pristilbud.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Hvordan velger jeg riktig størrelse?</AccordionTrigger>
                <AccordionContent>
                  Vi har en detaljert størrelsesguide for alle våre produkter. Du finner denne under 
                  "Størrelsesguide" i menyen. Er du fortsatt usikker, ta gjerne kontakt med oss for 
                  veiledning.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Hva er garantien på produktene?</AccordionTrigger>
                <AccordionContent>
                  Alle våre produkter har 5 års reklamasjonsrett i henhold til norsk lov. Dette gjelder 
                  produksjonsfeil og materialfeil ved normal bruk.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Levering og retur</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-7">
                <AccordionTrigger>Hvor lang er leveringstiden?</AccordionTrigger>
                <AccordionContent>
                  Normal leveringstid er 3-5 virkedager for lagervarer. For spesialtilpassede produkter 
                  vil leveringstiden avtales individuelt. Du vil få beskjed når varen er sendt med 
                  sporingsnummer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>Kan jeg returnere varer?</AccordionTrigger>
                <AccordionContent>
                  Ja, du har 14 dagers angrerett på alle standardvarer. Merk at dette ikke gjelder for 
                  spesialtilpassede produkter. Se vår returside for mer informasjon om returer og 
                  bytter.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>Hva koster frakt?</AccordionTrigger>
                <AccordionContent>
                  Fraktkostnader beregnes ut fra vekt og leveringsadresse. Nøyaktig fraktpris vil bli 
                  vist i handlekurven før du bekrefter bestillingen.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Kundeservice</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-10">
                <AccordionTrigger>Hvordan kontakter jeg kundeservice?</AccordionTrigger>
                <AccordionContent>
                  Du kan nå oss på følgende måter:
                  <ul className="list-disc pl-6 mt-2">
                    <li>E-post: post@proffsy.no</li>
                    <li>Telefon: 380 00 000 (man-fre 08:00-16:00)</li>
                    <li>Besøksadresse: Kvavik, 4580 Lyngdal</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11">
                <AccordionTrigger>Kan jeg få tilbud på større bestillinger?</AccordionTrigger>
                <AccordionContent>
                  Ja, vi gir gjerne tilbud på større bestillinger og til bedriftskunder. Ta kontakt 
                  med oss for å diskutere dine behov og få et pristilbud.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="mt-12 border-t pt-8">
            <p className="text-sm text-muted-foreground">
              Fant du ikke svar på det du lurer på? Ta gjerne kontakt med oss!
            </p>
          </section>
        </div>
      </div>
    </div>
  )
} 