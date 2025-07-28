"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Eye, CheckCircle, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { HeroToggleButton } from "@/components/admin/hero/hero-toggle-button"

// Fetcher-funksjon for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function HeroTable() {
  const { data: heroes, error, isLoading } = useSWR('/api/admin/hero/list', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true
  })
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id)
      const response = await fetch(`/api/admin/hero/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error("Kunne ikke slette hero-seksjonen")
      }

      // Oppdater SWR-dataen
      await mutate('/api/admin/hero/list')
      toast.success("Hero-seksjonen ble slettet")
    } catch (error) {
      console.error(error)
      toast.error("Kunne ikke slette hero-seksjonen")
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Laster inn hero-seksjoner...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">En feil oppstod ved lasting av hero-seksjoner</p>
        <Button 
          onClick={() => mutate('/api/admin/hero/list')} 
          variant="outline" 
          className="mt-4"
        >
          Prøv igjen
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Hero-seksjoner</h1>
        <Button asChild>
          <Link href="/admin/hero/new" legacyBehavior>
            <Plus className="mr-2 h-4 w-4" />
            Legg til ny
          </Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Bilde</TableHead>
              <TableHead>Tittel</TableHead>
              <TableHead>Beskrivelse</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Opprettet</TableHead>
              <TableHead className="text-right w-[180px]">Handling</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heroes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Ingen hero-seksjoner funnet. Opprett en ny for å komme i gang.
                </TableCell>
              </TableRow>
            ) : (
              heroes?.map((hero) => (
                <TableRow key={hero.id}>
                  <TableCell>
                    {hero.imageUrl ? (
                      <div className="relative w-20 h-12 overflow-hidden rounded">
                        <img
                          src={hero.imageUrl}
                          alt={hero.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : hero.videoUrl ? (
                      <div className="bg-muted h-12 w-20 flex items-center justify-center rounded">Video</div>
                    ) : (
                      <div className="bg-muted h-12 w-20 flex items-center justify-center rounded">Ingen media</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {hero.title}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {hero.description || "Ingen beskrivelse"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {hero.active ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Inaktiv</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(hero.createdAt), "dd. MMM yyyy", { locale: nb })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <HeroToggleButton 
                        heroId={hero.id} 
                        isActive={hero.active}
                        onSuccess={() => mutate('/api/admin/hero/list')}
                      />
                      <Button asChild variant="outline" size="icon" title="Rediger">
                        <Link href={`/admin/hero/${hero.id}`} legacyBehavior>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="icon" title="Forhåndsvis">
                        <Link href={`/`} target="_blank" legacyBehavior>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600" 
                            title="Slett"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Denne handlingen kan ikke angres. Dette vil permanent slette hero-seksjonen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleDelete(hero.id)}
                              disabled={isDeleting === hero.id}
                            >
                              {isDeleting === hero.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sletter...
                                </>
                              ) : (
                                "Ja, slett"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 