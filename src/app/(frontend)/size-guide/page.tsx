import { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Størrelsesguide | Proffsy",
  description: "Guide for å velge riktig størrelse på verktøybelter og andre produkter fra Proffsy.",
}

export default function SizeGuidePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Størrelsesguide</h1>

        <article className="prose prose-gray dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-p:text-muted-foreground prose-p:leading-7 max-w-none">
          <section>
            <h2>Verktøybelter</h2>
            <p>
              Våre verktøybelter er designet for å gi optimal komfort og funksjonalitet. 
              For å finne riktig størrelse, mål rundt midjen der du normalt bruker beltet.
            </p>

            <div className="my-8 border rounded-lg p-6 bg-muted/10">
              <h3 className="text-lg font-semibold mb-4">Størrelsestabell - Verktøybelter</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Størrelse</th>
                      <th className="text-left">Midjemål (cm)</th>
                      <th className="text-left">Anbefalt for</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>S</td>
                      <td>75-85</td>
                      <td>Smal midje</td>
                    </tr>
                    <tr>
                      <td>M</td>
                      <td>85-95</td>
                      <td>Normal midje</td>
                    </tr>
                    <tr>
                      <td>L</td>
                      <td>95-105</td>
                      <td>Større midje</td>
                    </tr>
                    <tr>
                      <td>XL</td>
                      <td>105-115</td>
                      <td>Ekstra stor midje</td>
                    </tr>
                    <tr>
                      <td>XXL</td>
                      <td>115-125</td>
                      <td>Dobbel ekstra stor</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2>Slik måler du</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 mt-2">
                  <Image 
                    src="/images/measure-waist.png" 
                    alt="Måling av midje"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Midjemål</h3>
                  <p>
                    Mål rundt den naturlige midjen, der du normalt ville båret et belte. 
                    Målebåndet skal sitte komfortabelt, ikke for stramt eller for løst.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2>Tilpasning av belter</h2>
            <p>
              Alle våre belter har justeringsmuligheter for å sikre optimal passform:
            </p>
            <ul>
              <li>5-10 cm justeringsmulighet i hver retning</li>
              <li>Mulighet for ekstra hull ved behov</li>
              <li>Elastiske partier for økt komfort</li>
            </ul>
          </section>

          <section>
            <h2>Spesialtilpasning</h2>
            <p>
              Trenger du et belte i en spesiell størrelse eller med spesielle tilpasninger? 
              Vi kan skreddersy belter etter dine mål. Ta kontakt med oss for mer informasjon 
              om spesialtilpasning.
            </p>
          </section>

          <section>
            <h2>Tips for valg av størrelse</h2>
            <ul>
              <li>Mål deg to ganger for å være sikker på målet</li>
              <li>Bruk et målebånd, ikke et belte</li>
              <li>Hvis du er mellom to størrelser, velg den større størrelsen</li>
              <li>Ta hensyn til om du skal bruke beltet utenpå arbeidsklær</li>
            </ul>
          </section>

          <section>
            <h2>Trenger du hjelp?</h2>
            <p>
              Er du usikker på hvilken størrelse du skal velge? Ta kontakt med oss, så hjelper 
              vi deg med å finne riktig størrelse:
            </p>
            <ul>
              <li>E-post: post@proffsy.no</li>
              <li>Telefon: 380 00 000</li>
            </ul>
          </section>

          <section className="not-prose mt-8 border-t pt-8">
            <p className="text-sm text-muted-foreground">
              Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}
            </p>
          </section>
        </article>
      </div>
    </div>
  )
} 