import { put } from "@vercel/blob"

export const config = {
  runtime: "nodejs",
}

export default async function handler(req, res) {
  console.log("[v0] API /api/upload-json called, method:", req.method)

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { filename, content } = req.body

    console.log("[v0] Received filename:", filename)
    console.log("[v0] Content type:", typeof content)

    if (!filename || !content) {
      console.log("[v0] Missing filename or content")
      return res.status(400).json({ error: "Missing filename or content" })
    }

    const jsonString = JSON.stringify(content)
    console.log("[v0] JSON string length:", jsonString.length)

    const blob = await put(filename, jsonString, {
      access: "public",
      contentType: "application/json",
    })

    console.log("[v0] Blob uploaded successfully:", blob.url)

    return res.status(200).json({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    })
  } catch (error) {
    console.error("[v0] Error uploading to Vercel Blob:", error)
    return res.status(500).json({ error: error.message })
  }
}
