import { prisma } from "@/lib/db"
import { SettingsForm } from "./components/settings-form"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function SettingsPage() {
  // Sjekk autentisering
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  try {
    // Hent innstillinger fra CompanySettings istedenfor Settings
    const settings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })
    
    // Konverter til ønsket format
    const settingsMap = {
      companyName: settings?.companyName || "",
      companyAddress: settings?.street || "",
      companyPostal: settings?.postalCode || "",
      companyCountry: settings?.country || "",
      companyLogo: settings?.logoUrl || "",
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Innstillinger</h1>
        <div className="max-w-2xl">
          <SettingsForm initialSettings={settingsMap} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching settings:", error)
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Innstillinger</h1>
        <div className="text-red-500">
          Det oppstod en feil ved henting av innstillinger
        </div>
      </div>
    )
  }
} 