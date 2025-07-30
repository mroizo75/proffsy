import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { calculateShipping } from "@/lib/shipping"

export async function GET(req: Request) {
  try {
    console.log("=== DEBUG SHIPPING TEST ===")
    
    // Sjekk environment variabler
    const hasPostNordKey = !!process.env.POSTNORD_API_KEY
    console.log("POSTNORD_API_KEY finnes:", hasPostNordKey)
    console.log("POSTNORD_API_KEY lengde:", process.env.POSTNORD_API_KEY?.length || 0)
    
    // Sjekk CompanySettings
    const companySettings = await prisma.companySettings.findFirst({
      where: { id: "default" }
    })
    console.log("CompanySettings:", companySettings)
    
    if (!companySettings) {
      return NextResponse.json({
        success: false,
        error: "CompanySettings ikke funnet",
        debug: {
          hasPostNordKey,
          companySettings: null,
          message: "Kjør 'npm run db:seed' for å opprette CompanySettings"
        }
      })
    }
    
    // Test PostNord API kall
    const testParams = {
      weight: 0.5,
      fromPostalCode: companySettings.postalCode,
      toPostalCode: "0150", // Oslo sentrum
      toCountry: "NO"
    }
    
    console.log("Tester med parametere:", testParams)
    
    const result = await calculateShipping(testParams)
    
    return NextResponse.json({
      success: true,
      debug: {
        hasPostNordKey,
        companySettings: {
          id: companySettings.id,
          companyName: companySettings.companyName,
          postalCode: companySettings.postalCode,
          city: companySettings.city
        },
        testParams,
        result
      }
    })
    
  } catch (error) {
    console.error("Debug shipping test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      debug: {
        hasPostNordKey: !!process.env.POSTNORD_API_KEY,
        timestamp: new Date().toISOString()
      }
    })
  }
}