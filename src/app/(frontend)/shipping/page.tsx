import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Frakt og levering | Proffsy",
  description: "Informasjon om frakt, levering og leveringstider hos Proffsy.",
}

export default function ShippingPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Frakt og levering</h1>

        <article className="prose prose-gray dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-p:text-muted-foreground prose-p:leading-7 max-w-none">
          <section>
            <h2>Leveringstid</h2>
            <p>
              Normal leveringstid for lagervarer er 3-5 virkedager. For spesialtilpassede produkter 
              vil leveringstiden avtales for hvert enkelt tilfelle. Leveringstiden regnes fra ordren 
              er bekreftet og betalt.
            </p>
            <p>
              Merk at leveringstiden kan variere avhengig av leveringsadresse og tilgjengelighet. 
              Ved bestilling av flere varer kan leveringen bli delt opp i flere forsendelser.
            </p>
          </section>

          <section>
            <h2>Fraktkostnader</h2>
            <p>
              Fraktkostnader beregnes ut fra vekt, volum og leveringsadresse. Nøyaktig fraktpris 
              vil bli vist i handlekurven før du bekrefter bestillingen.
            </p>
            <ul>
              <li>Pakker under 2 kg: fra kr 89,-</li>
              <li>Pakker 2-5 kg: fra kr 149,-</li>
              <li>Pakker 5-10 kg: fra kr 199,-</li>
              <li>Pakker over 10 kg: pris beregnes ved bestilling</li>
            </ul>
          </section>

          <section>
            <h2>Leveringsmetoder</h2>
            <p>
              Vi samarbeider med Posten/Bring for å sikre trygg levering av dine varer. Du kan velge 
              mellom følgende leveringsalternativer:
            </p>
            <ul>
              <li>Levering til nærmeste postkontor/Post i Butikk</li>
              <li>Levering til Pakkeboks</li>
              <li>Hjemlevering (tillegg i pris)</li>
              <li>Bedriftslevering (for bedriftskunder)</li>
            </ul>
          </section>

          <section>
            <h2>Sporing av pakke</h2>
            <p>
              Når pakken er sendt fra vårt lager, vil du motta en e-post med sporingsnummer. 
              Du kan følge forsendelsen din via Posten/Brings sporingssystem.
            </p>
          </section>

          <section>
            <h2>Henting i butikk</h2>
            <p>
              Det er mulig å hente varene direkte fra vårt verksted på Kvavik i Lyngdal. 
              Velg "Henting i butikk" som leveringsmetode ved bestilling, og vent på beskjed 
              om at varene er klare for henting.
            </p>
            <p>
              Åpningstider for henting:
            </p>
            <ul>
              <li>Mandag-fredag: 08:00-16:00</li>
              <li>Lørdag-søndag: Stengt</li>
            </ul>
          </section>

          <section>
            <h2>Forbehold</h2>
            <p>
              Vi tar forbehold om at leveringstiden kan bli lengre ved stor pågang eller andre 
              forhold utenfor vår kontroll. Ved forsinkelser vil vi kontakte deg så snart som mulig.
            </p>
            <p>
              For spesialtilpassede produkter eller større bestillinger kan andre leveringsbetingelser 
              gjelde. Dette vil bli avtalt spesielt for hver enkelt ordre.
            </p>
          </section>

          <section>
            <h2>Kontakt</h2>
            <p>
              Har du spørsmål om frakt og levering, ta gjerne kontakt med oss:
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