import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Retur og bytte | Proffsy",
  description: "Informasjon om retur, bytte og reklamasjon hos Proffsy.",
}

export default function ReturnPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Retur og bytte</h1>

        <article className="prose prose-gray dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-p:text-muted-foreground prose-p:leading-7 max-w-none">
          <section>
            <h2>Angrerett</h2>
            <p>
              I henhold til angrerettloven har du 14 dagers angrerett på dine kjøp hos Proffsy. 
              Angreretten gjelder fra den dagen du mottar varen. For å benytte angreretten må du 
              gi oss beskjed innen 14 dager etter at du mottok varen.
            </p>
            <p>
              <strong>Merk:</strong> Angreretten gjelder ikke for spesialtilpassede produkter eller 
              varer som er produsert etter dine spesifikasjoner.
            </p>
          </section>

          <section>
            <h2>Returprosess</h2>
            <p>
              For å returnere en vare, følg disse trinnene:
            </p>
            <ol>
              <li>Kontakt oss på post@proffsy.no eller telefon 380 00 000</li>
              <li>Oppgi ordrenummer og årsak til retur</li>
              <li>Vent på returlabel og instruksjoner fra oss</li>
              <li>Pakk varen forsvarlig i original emballasje hvis mulig</li>
              <li>Send pakken med returlabelen vi har sendt deg</li>
            </ol>
          </section>

          <section>
            <h2>Returkostnader</h2>
            <p>
              Ved bruk av angrerett må kunden selv betale returporto. Ved berettiget reklamasjon 
              dekker Proffsy returkostnadene. Vi anbefaler at du bruker en sporbar forsendelsesmåte 
              for returen.
            </p>
          </section>

          <section>
            <h2>Bytte av vare</h2>
            <p>
              Ønsker du å bytte til en annen størrelse eller variant, behandler vi dette som en 
              retur og ny bestilling. Ta kontakt med oss før du sender varen i retur, så hjelper 
              vi deg med prosessen.
            </p>
          </section>

          <section>
            <h2>Reklamasjon</h2>
            <p>
              Hvis varen har en feil eller mangel, har du rett til å reklamere. Reklamasjonsretten 
              gjelder i:
            </p>
            <ul>
              <li>5 år for produkter som er ment å vare vesentlig lenger enn 2 år</li>
              <li>2 år for produkter med normal forventet levetid</li>
            </ul>
            <p>
              Ved reklamasjon må du kontakte oss så snart som mulig etter at feilen er oppdaget. 
              Beskriv feilen og legg gjerne ved bilder når du kontakter oss.
            </p>
          </section>

          <section>
            <h2>Tilbakebetaling</h2>
            <p>
              Ved godkjent retur vil vi tilbakebetale beløpet til samme betalingsmåte som ble 
              brukt ved kjøpet. Tilbakebetalingen skjer innen 14 dager etter at vi har mottatt 
              returen, forutsatt at varen er i samme stand som ved mottak.
            </p>
          </section>

          <section>
            <h2>Varens stand</h2>
            <p>
              Returnerte varer må være:
            </p>
            <ul>
              <li>Ubrukt og i original stand</li>
              <li>Komplett med alle deler og tilbehør</li>
              <li>I original emballasje hvis mulig</li>
              <li>Fri for skader og merker</li>
            </ul>
          </section>

          <section>
            <h2>Kontakt</h2>
            <p>
              Har du spørsmål om retur eller reklamasjon, ta gjerne kontakt med oss:
            </p>
            <ul>
              <li>E-post: post@proffsy.no</li>
              <li>Telefon: 380 00 000</li>
              <li>Adresse: Kvavik, 4580 Lyngdal</li>
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