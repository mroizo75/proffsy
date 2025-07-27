import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const categories = await prisma.category.findMany()
    return NextResponse.json({
      message: "Database connection successful",
      categories,
      count: categories.length
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 