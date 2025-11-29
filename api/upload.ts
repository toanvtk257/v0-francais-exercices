import { put } from "@vercel/blob"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const folder = searchParams.get("folder") || "uploads"

    // Get file from request
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return res.status(400).json({ error: "No file provided" })
    }

    // Upload to Vercel Blob
    const blob = await put(`${folder}/${file.name}`, file, {
      access: "public",
    })

    return res.status(200).json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return res.status(500).json({ error: "Upload failed" })
  }
}
