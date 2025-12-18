import { join } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    
    // Sjekk om filen eksisterer
    const stats = await stat(filePath)
    if (!stats.isFile()) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Les filen som stream
    const stream = createReadStream(filePath)
    
    // Bestem content-type basert på filendelse
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    }[ext || ''] || 'application/octet-stream'

    // Returner filen med riktig content-type
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 