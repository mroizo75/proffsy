import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Metadata } from "next"
import { HeroForm } from "../components/hero-form"

export const metadata: Metadata = {
  title: "Legg til ny Hero | Admin",
  description: "Legg til en ny hero-seksjon for forsiden"
}

export default async function NewHeroPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin")
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-8">Legg til ny hero-seksjon</h1>
      <HeroForm />
    </div>
  )
} 