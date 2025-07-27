import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kjøpsbetingelser | Proffsy",
  description: "Kjøpsbetingelser og vilkår for kjøp hos Proffsy.",
}

export default function TermsPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Kjøpsbetingelser</h1>

        <article className="prose prose-gray dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-p:text-muted-foreground prose-p:leading-7 max-w-none">
          <section>
            <h2>Generelt</h2>
            <p>
              De her angitte vilkår regulerer kundens bruk av varer og tjenester levert av proffsy.no, heretter kalt Proffsy.
              Disse vilkårene gjelder for alt salg fra Tremakeren så lenge ikke annet er skriftlig avtalt partene imellom.
            </p>
          </section>

          <section>
            <h2>Betaling</h2>
            <p>
              Betaling på vår side med kredittkort skjer gjennom sikre sider og ingen av dine opplysninger er tilgjengelig til andre. 
              DIBS/Nets er leverandør av betalingssystemet.
              Til registrerte bedriftskunder kan vi sende faktura, fyll ut skjema for å registrere bedriftskonto her.
            </p>
          </section>

          <section>
            <h2>Priser og levering</h2>
            <p>
              Alle priser er oppgitt eks. frakt, med mindre annet uttrykkelig er nevnt. Prisene er i stadig forandring og vi tar 
              derfor forbehold om prisendring som følge av endrede priser fra våre leverandører.
            </p>
            <p>
              Vi forbeholder oss rett til leveringsnekt på samtlige varer med bakgrunn i prissvingninger og lagersituasjon. 
              Alle leveringstider som blir oppgitt av oss må anses som veiledende. Med leveringstid menes tidspunkt for ankomst 
              av varer til vårt lager. Medgått tid til plukking, pakking og eventuell produksjon kommer i tillegg før innlevering 
              av forsendelsen til transportør. Når tid er oppgitt i antall dager, menes hverdager og befrakters tid kommer alltid i tillegg.
            </p>
            <p>
              Vi forbeholder oss retten til å avvike oppgitt leveringstid uten nærmere varsel. Eventuelle prisendringer som skjer 
              etter bestillingstidspunkt får ikke tilbakevirkende kraft. Vi tar forbehold om mulige skrive-/trykkfeil.
            </p>
          </section>

          <section>
            <h2>Kundens plikter</h2>
            <p>
              Den som er registrert som kunde hos Proffsy, er ansvarlig for betaling av de ytelser Proffsy eller samarbeidspartnere 
              leverer i henhold til nærværende vilkår. Ansvaret omfatter også andres bruk av kundens tilgang, herunder uvedkommendes 
              bruk, såfremt det ikke kan påvises at uvedkommendes bruk er muliggjort gjennom uaktsomhet fra Proffsys side.
            </p>
            <p>
              Er du 18 år? For og handle på proffsy.no så må bestiller/mottaker være over 18 år.
            </p>
          </section>

          <section>
            <h2>Angrerett</h2>
            <p>
              I henhold til angrerettloven har du 14 dagers angrerett på dine kjøp hos oss. 
              Angreretten gjelder fra den dagen du mottar varen. Angreretten gjelder ikke for 
              spesialtilpassede produkter eller varer som er produsert etter dine spesifikasjoner.
            </p>
          </section>

          <section>
            <h2>Reklamasjon og garanti</h2>
            <p>
              Alle våre produkter omfattes av norsk kjøpslov, som gir deg reklamasjonsrett i 5 år 
              på produkter som er ment å vare vesentlig lenger enn 2 år. For produkter med kortere 
              forventet levetid gjelder 2 års reklamasjonsrett.
            </p>
            <p>
              Ved reklamasjon må feilen meldes til oss innen rimelig tid etter at den ble oppdaget. 
              Vi dekker returporto ved berettigede reklamasjoner.
            </p>
          </section>

          <section>
            <h2>Personvern</h2>
            <p>
              Vi behandler dine personopplysninger i henhold til gjeldende personvernlovgivning. 
              Les mer om hvordan vi behandler personopplysninger i vår personvernerklæring.
            </p>
          </section>

          <section>
            <h2>Spesialtilpassede produkter</h2>
            <p>
              For spesialtilpassede produkter og skreddersøm gjelder egne betingelser som avtales 
              for hvert enkelt tilfelle. Dette inkluderer leveringstid, pris og eventuelle 
              spesielle vilkår.
            </p>
          </section>

          <section>
            <h2>Kontakt</h2>
            <p>
              Har du spørsmål om våre vilkår og betingelser, ta gjerne kontakt med oss:
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