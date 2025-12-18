import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// R2-klient konfigurasjon (samme mønster som andre prosjekter)
const STORAGE_TYPE = process.env.STORAGE_TYPE
const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL // Valgfri: custom public URL

// Opprett S3-klient for R2
export const r2Client = STORAGE_TYPE === "r2" && R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null

// Last opp fil til R2
export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  if (!r2Client || !R2_BUCKET || !R2_ENDPOINT) {
    throw new Error("R2 er ikke konfigurert. Sjekk miljøvariabler: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET")
  }

  const key = `uploads/${filename}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )

  // Returner offentlig URL
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }

  // Bygg URL fra endpoint - håndter ulike formater
  try {
    const endpointUrl = new URL(R2_ENDPOINT)
    // Cloudflare R2 public URL format
    return `https://pub-${R2_BUCKET}.${endpointUrl.host.replace('.r2.cloudflarestorage.com', '')}.r2.dev/${key}`
  } catch {
    // Fallback - bruk endpoint direkte
    return `${R2_ENDPOINT}/${R2_BUCKET}/${key}`
  }
}

// Slett fil fra R2
export async function deleteFromR2(url: string): Promise<void> {
  if (!r2Client || !R2_BUCKET) {
    throw new Error("R2 er ikke konfigurert. Sjekk miljøvariabler.")
  }

  // Ekstraher key fra URL
  const urlParts = url.split("/")
  const key = urlParts.slice(3).join("/")

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  )
}

// Sjekk om R2 er konfigurert
export function isR2Configured(): boolean {
  return STORAGE_TYPE === "r2" && r2Client !== null && !!R2_BUCKET && !!R2_ENDPOINT
}

// Generer unik filnavn
export function generateUniqueFilename(originalFilename: string): string {
  const extension = originalFilename.substring(originalFilename.lastIndexOf("."))
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}${extension}`
}
