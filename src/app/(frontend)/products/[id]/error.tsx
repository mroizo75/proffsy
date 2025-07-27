'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Product page error:', error)
  }, [error])

  return (
    <div className="container py-10">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Noe gikk galt!</h2>
        <p className="text-muted-foreground">
          Vi kunne ikke laste produktinformasjonen. Vennligst prøv igjen.
        </p>
        
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => reset()}
            className="mt-4"
          >
            Prøv igjen
          </Button>
          <Button
            asChild
            variant="outline"
            className="mt-4"
          >
            <Link href="/products">
              Tilbake til produkter
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 