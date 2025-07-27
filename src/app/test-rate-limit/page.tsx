"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"

export default function TestRateLimitPage() {
  const [email, setEmail] = useState("")
  const [results, setResults] = useState<Array<{ success: boolean; message: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Enkel validering - sjekker bare om det er tekst
  const isValidInput = email.trim().length > 0

  // Test én enkelt forespørsel
  const testSingleRequest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      
      setResults(prev => [...prev, {
        success: response.ok,
        message: `Status: ${response.status} - ${data.message}${data.remainingTime ? ` (${data.remainingTime} min igjen)` : ''}`
      }])
    } catch (error) {
      setResults(prev => [...prev, {
        success: false,
        message: "Feil under testing: " + (error as Error).message
      }])
    }
    setIsLoading(false)
  }

  // Test flere forespørsler raskt etter hverandre
  const testRateLimit = async () => {
    setIsLoading(true)
    setResults([])

    // Send 7 forespørsler (over grensen på 5)
    for (let i = 0; i < 7; i++) {
      await testSingleRequest()
      // Kort pause mellom hver forespørsel
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsLoading(false)
  }

  // Tøm resultatene
  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Rate Limiting</h1>
      
      <div className="space-y-4 mb-8">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            onClick={testSingleRequest}
            disabled={isLoading || !isValidInput}
          >
            Test Enkelt
          </Button>
          <Button 
            onClick={testRateLimit}
            disabled={isLoading || !isValidInput}
            variant="secondary"
          >
            Test Rate Limit
          </Button>
        </div>
        <Button 
          onClick={clearResults}
          variant="outline"
          className="w-full"
        >
          Tøm resultater
        </Button>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <Alert
            key={index}
            variant={result.success ? "default" : "destructive"}
          >
            {result.message}
          </Alert>
        ))}
      </div>
    </div>
  )
} 