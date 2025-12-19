import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET

const r2Client = R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
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
    const key = path.join("/")

    console.log("R2 Proxy request - key:", key)
    console.log("R2 Proxy - R2_BUCKET:", R2_BUCKET)
    console.log("R2 Proxy - r2Client exists:", !!r2Client)

    if (!r2Client || !R2_BUCKET) {
      console.error("R2 Proxy - R2 not configured")
      return new NextResponse("R2 not configured", { status: 500 })
    }

    console.log("R2 Proxy - Fetching from R2...")

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })

    const response = await r2Client.send(command)

    console.log("R2 Proxy - Got response, ContentType:", response.ContentType)

    if (!response.Body) {
      console.error("R2 Proxy - No body in response")
      return new NextResponse("File not found", { status: 404 })
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const buffer = Buffer.concat(chunks)
    console.log("R2 Proxy - Buffer size:", buffer.length)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("R2 proxy error:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    return new NextResponse("File not found", { status: 404 })
  }
}
