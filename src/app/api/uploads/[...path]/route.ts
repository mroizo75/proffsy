import { join } from 'path'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET
const STORAGE_TYPE = process.env.STORAGE_TYPE

const r2Client = STORAGE_TYPE === "r2" && R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const pathString = path.join("/")
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    
    // Bestem content-type basert på filendelse
    const ext = pathString.split('.').pop()?.toLowerCase()
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
    }[ext || ''] || 'application/octet-stream'

    // Prøv lokal fil først
    try {
      const stats = await stat(filePath)
      if (stats.isFile()) {
        const stream = createReadStream(filePath)
        return new NextResponse(stream as unknown as ReadableStream, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
    } catch {
      // Lokal fil finnes ikke, fortsett til R2
    }

    // Prøv R2 som fallback
    if (r2Client && R2_BUCKET) {
      try {
        // Prøv med uploads/ prefix
        const r2Key = `uploads/${pathString}`
        
        const command = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
        })

        const response = await r2Client.send(command)

        if (response.Body) {
          const chunks: Uint8Array[] = []
          const reader = response.Body.transformToWebStream().getReader()
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
          }

          const buffer = Buffer.concat(chunks)

          return new NextResponse(buffer, {
            headers: {
              "Content-Type": response.ContentType || contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          })
        }
      } catch {
        // R2 feilet også
      }
    }

    return new NextResponse('Not found', { status: 404 })
  } catch {
    return new NextResponse('Internal error', { status: 500 })
  }
}
