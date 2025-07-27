import { prisma } from "@/lib/db"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Metadata } from "next"
import { Plus, Edit, Eye, CheckCircle } from "lucide-react"
import { HeroToggleButton } from "@/components/admin/hero/hero-toggle-button"
import { HeroTable } from "./components/hero-table"

export const metadata: Metadata = {
  title: "Administrer Hero-seksjoner | Admin",
  description: "Administrer hero-seksjoner for forsiden",
}

export default function HeroPage() {
  return (
    <div className="container py-10">
      <HeroTable />
    </div>
  )
} 