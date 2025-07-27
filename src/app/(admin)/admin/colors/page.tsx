"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useColors } from "@/lib/hooks/use-colors"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ColorsPage() {
  const { colors, mutate } = useColors({
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })
  const [newColor, setNewColor] = useState({ name: "", value: "#000000" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newColor),
      })

      if (!response.ok) throw new Error("Kunne ikke legge til farge")
      
      const newColorData = await response.json()
      toast.success("Farge lagt til")
      setNewColor({ name: "", value: "#000000" })
      mutate(current => current ? [...current, newColorData] : [newColorData])
    } catch (error) {
      toast.error("Noe gikk galt")
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/colors/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Kunne ikke slette farge")
      
      toast.success("Farge slettet")
      mutate()
    } catch (error) {
      toast.error("Kunne ikke slette farge")
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Administrer farger</h1>

      <div className="grid gap-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Fargenavn"
              value={newColor.name}
              onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
              required
            />
            <Input
              type="color"
              value={newColor.value}
              onChange={(e) => setNewColor({ ...newColor, value: e.target.value })}
              className="w-20"
            />
            <Button type="submit">Legg til farge</Button>
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farge</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead>Hex</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colors.map((color: any) => (
              <TableRow key={color.id}>
                <TableCell>
                  <div 
                    className="w-8 h-8 rounded-full border"
                    style={{ backgroundColor: color.value }}
                  />
                </TableCell>
                <TableCell>{color.name}</TableCell>
                <TableCell>{color.value}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(color.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 