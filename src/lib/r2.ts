import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// R2-klient konfigurasjon
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "proffsy"
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL // f.eks. https://cdn.proffsy.no

// Opprett S3-klient for R2
export const r2Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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
  if (!r2Client) {
    throw new Error("R2 er ikke konfigurert. Sjekk miljøvariabler.")
  }

  const key = `uploads/${filename}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  )

  // Returner offentlig URL
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }

  // Fallback til standard R2 URL (krever public bucket)
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
}

// Slett fil fra R2
export async function deleteFromR2(url: string): Promise<void> {
  if (!r2Client) {
    throw new Error("R2 er ikke konfigurert. Sjekk miljøvariabler.")
  }

  // Ekstraher key fra URL
  let key: string
  if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
    key = url.replace(`${R2_PUBLIC_URL}/`, "")
  } else {
    // Prøv å ekstrahere fra standard URL
    const urlParts = url.split("/")
    key = urlParts.slice(3).join("/") // Fjern protocol, domain
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  )
}

// Sjekk om R2 er konfigurert
export function isR2Configured(): boolean {
  return r2Client !== null
}

// Generer unik filnavn
export function generateUniqueFilename(originalFilename: string): string {
  const extension = originalFilename.substring(originalFilename.lastIndexOf("."))
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}${extension}`
}

