import { NextResponse } from "next/server"

const NETS_SECRET_KEY = process.env.NEXI_SECRET_TEST_KEY!
const NETS_CHECKOUT_KEY = process.env.NEXT_PUBLIC_NEXI_CHECKOUT_TEST_KEY!
// Fjern trailing slash fra BASE_URL for å unngå doble skråstreker
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, '')

export async function GET() {
  try {
    console.log('💳 Debug payment endpoint called')
    
    const debug = {
      environment: {
        hasNetsSecretKey: !!NETS_SECRET_KEY,
        netsSecretKeyLength: NETS_SECRET_KEY?.length || 0,
        hasNetsCheckoutKey: !!NETS_CHECKOUT_KEY,
        netsCheckoutKeyLength: NETS_CHECKOUT_KEY?.length || 0,
        hasBaseUrl: !!BASE_URL,
        baseUrl: BASE_URL
      },
      urls: {
        termsUrl: `${BASE_URL}/terms`,
        returnUrl: `${BASE_URL}/checkout/complete?order=TEST`,
        cancelUrl: `${BASE_URL}/checkout/cancel`
      },
      netsApi: {
        endpoint: "https://test.api.dibspayment.eu/v1/payments",
        testMode: true
      }
    }
    
    console.log('💳 Debug info:', debug)
    
    return NextResponse.json({
      success: true,
      debug,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('💳 Debug payment error:', error)
    return NextResponse.json(
      { 
        error: "Debug payment feilet",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}