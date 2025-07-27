import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Om oss | Proffsy",
  description: "Proffsy tilbyr skreddersøm innenfor flere områder med over 30 års erfaring innen industrisøm.",
}

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h1 className="text-4xl font-bold mb-6">Om Proffsy</h1>
          <p className="text-xl text-muted-foreground mb-8">
            "Proffsy tilbyr skreddersøm innenfor flere områder"
          </p>
        </section>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <p className="lead">
            Proffsy har mer enn 30 års erfaring innen industrisøm. Våre produkter er håndlaget 
            på vårt eget sømverksted på Kvavik i Lyngdal. Våre arbeids- og snekkerbelter brukes 
            av kvalitetesbevisste håndverkere i hele Norge som vet å sette pris på god holdbarhet 
            og ergonomi som er ensbetydende med Proffsy!
          </p>

          <p>
            Vi spesiallager presenninger og tildekning til alt av utstyr som skal stå utendørs. 
            Vi lager også båtkalesjer og havnepresenninger etter mål. Proffsy utfører også små 
            og store reparasjoner.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6">Om våre produkter</h2>
          
          <p>
            Vi leverer snekker- og verktøybelter til private og for proffmarkedet, og produserer 
            kalesjer, presenninger, seil og trekking av møbler med mer. Vi spesiallager presenninger 
            og tildekning til alt av utstyr som skal stå utendørs. Det meste kan spesialsys etter 
            mål og vi utfører små og store reparasjoner. Proffsy har mer enn 30 års erfaring innen 
            industrisøm. Våre produkter er håndlaget på vårt eget sømverksted på Kvavik i Lyngdal.
          </p>
        </section>
      </div>
    </div>
  )
} 