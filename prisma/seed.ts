import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Opprett admin bruker
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proffsy.no' },
    update: {},
    create: {
      email: 'admin@proffsy.no',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log({ admin })

  // Legg til noen testkategorier
  const categories = [
    {
      name: 'Verktøy',
      slug: 'verktoy',
      description: 'Profesjonelt verktøy for alle behov'
    },
    {
      name: 'Maling',
      slug: 'maling',
      description: 'Kvalitetsmaling for inne- og utebruk'
    },
    {
      name: 'Arbeidsklær',
      slug: 'arbeidsklær',
      description: 'Komfortable og slitesterke arbeidsklær'
    }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    })
  }

  // Opprett standard bedriftsinnstillinger
  const companySettings = await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "PROFFSY AS",
      street: "Peckels gate 12b",
      postalCode: "3616",
      city: "Kongsberg",
      country: "NO",
      phone: "+47 12345678",
      email: "admin@proffsy.no",
      orgNumber: "123456789"
    },
  })

  console.log({ companySettings })

  // Opprett et test-produkt
  const product = await prisma.product.create({
    data: {
      name: 'Test Hammer',
      description: 'En kvalitets hammer for profesjonelle',
      price: 299.99,
      sku: 'HAMMER001',
      stock: 10,
      categories: {
        connect: [{ slug: 'verktoy' }]
      }
    }
  })

  console.log({ product })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 