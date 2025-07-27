import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { HeroForm } from "../components/hero-form"
import { notFound } from "next/navigation"
import { Metadata } from "next"

interface HeroEditPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Rediger Hero | Admin",
  description: "Rediger en eksisterende hero-seksjon"
}

export default async function HeroEditPage({ params }: HeroEditPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin")
  }

  const hero = await prisma.hero.findUnique({
    where: {
      id: params.id
    }
  })

  if (!hero) {
    return notFound()
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-8">Rediger hero-seksjon</h1>
      <HeroForm initialData={hero} />
    </div>
  )
} 