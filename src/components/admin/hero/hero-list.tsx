"use client"

import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Eye, EyeOff, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

interface Hero {
  id: string
  title: string
  description: string
  imageUrl: string
  active: boolean
  startDate: Date | null
  endDate: Date | null
}

interface HeroListProps {
  heroes: Hero[]
  onEdit: (hero: Hero) => void
}

export function HeroList({ heroes, onEdit }: HeroListProps) {
  const handleToggleActive = async (hero: Hero) => {
    try {
      const response = await fetch(`/api/admin/hero/${hero.id}/toggle`, {
        method: "PATCH"
      })

      if (!response.ok) throw new Error()
      
      toast.success(hero.active ? "Hero deaktivert" : "Hero aktivert")
    } catch {
      toast.error("Kunne ikke endre status")
    }
  }

  const handleDelete = async (hero: Hero) => {
    if (!confirm("Er du sikker på at du vil slette denne hero?")) return

    try {
      const response = await fetch(`/api/admin/hero/${hero.id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error()
      
      toast.success("Hero slettet")
    } catch {
      toast.error("Kunne ikke slette hero")
    }
  }

  const getStatus = (hero: Hero) => {
    const now = new Date()
    
    if (!hero.active) return "Inaktiv"
    if (hero.startDate && hero.startDate > now) return "Planlagt"
    if (hero.endDate && hero.endDate < now) return "Utløpt"
    return "Aktiv"
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tittel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Start dato</TableHead>
          <TableHead>Slutt dato</TableHead>
          <TableHead className="w-[100px]">Handlinger</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {heroes.map((hero) => (
          <TableRow key={hero.id}>
            <TableCell className="font-medium">{hero.title}</TableCell>
            <TableCell>{getStatus(hero)}</TableCell>
            <TableCell>
              {hero.startDate 
                ? format(new Date(hero.startDate), "PPP", { locale: nb })
                : "-"
              }
            </TableCell>
            <TableCell>
              {hero.endDate
                ? format(new Date(hero.endDate), "PPP", { locale: nb })
                : "-"
              }
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(hero)}
                >
                  {hero.active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(hero)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(hero)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 