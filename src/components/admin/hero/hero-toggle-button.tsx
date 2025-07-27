"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface HeroToggleButtonProps {
  heroId: string
  isActive: boolean
  onSuccess?: () => void
}

export function HeroToggleButton({ heroId, isActive, onSuccess }: HeroToggleButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [active, setActive] = useState(isActive)

  const handleToggle = async () => {
    try {
      setIsPending(true)
      const response = await fetch(`/api/admin/hero/${heroId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Kunne ikke endre status')
      }

      const result = await response.json()
      setActive(result.active)
      
      toast.success(`Hero ${result.active ? 'aktivert' : 'deaktivert'}`)
      
      // Kall onSuccess-callback hvis den finnes
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error(error)
      toast.error('Det oppstod en feil')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button 
      onClick={handleToggle}
      variant={active ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Lagrer...
        </>
      ) : (
        active ? "Deaktiver" : "Aktiver"
      )}
    </Button>
  )
} 