import type { VercelRequest, VercelResponse } from "@vercel/node"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "francais_exercices"

    if (!cloudName) {
      console.error("[v0] CLOUDINARY_CLOUD_NAME not configured")
      return res.status(500).json({
        error: "Configuration error: CLOUDINARY_CLOUD_NAME environment variable is missing.",
      })
    }

    console.log("[v0] Cloudinary config:", { cloudName, uploadPreset })

    // Read raw body as buffer
    const chunks: Buffer[] = []
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => chunks.push(chunk))
      req.on("end", resolve)
      req.on("error", reject)
    })

    const buffer = Buffer.concat(chunks)
    console.log("[v0] Received buffer size:", buffer.length)

    // Parse multipart form data manually to extract file and filename
    const boundary = req.headers["content-type"]?.split("boundary=")[1]
    if (!boundary) {
      return res.status(400).json({ error: "Invalid content-type" })
    }

    const parts = buffer.toString("binary").split(`--${boundary}`)
    let fileBuffer: Buffer | null = null
    let customFilename: string | null = null
    let originalFilename = "file"

    for (const part of parts) {
      if (part.includes('name="filename"')) {
        const match = part.match(/\r\n\r\n(.*?)(\r\n|$)/)
        if (match) customFilename = match[1].trim()
      } else if (part.includes('name="file"')) {
        const filenameMatch = part.match(/filename="(.+?)"/)
        if (filenameMatch) originalFilename = filenameMatch[1]

        const dataStart = part.indexOf("\r\n\r\n") + 4
        const dataEnd = part.lastIndexOf("\r\n")
        if (dataStart > 3 && dataEnd > dataStart) {
          const binaryData = part.substring(dataStart, dataEnd)
          fileBuffer = Buffer.from(binaryData, "binary")
        }
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: "No file provided" })
    }

    console.log("[v0] File extracted:", originalFilename, "Size:", fileBuffer.length)
    if (customFilename) {
      console.log("[v0] Using custom filename:", customFilename)
    }

    // Determine resource type
    const fileName = (customFilename || originalFilename).toLowerCase()
    let resourceType = "auto"
    if (fileName.match(/\.(mp3|wav|ogg|m4a)$/)) {
      resourceType = "video" // Cloudinary uses 'video' for audio
    }

    // Convert buffer to base64 for Cloudinary
    const base64File = `data:application/octet-stream;base64,${fileBuffer.toString("base64")}`

    // Prepare Cloudinary upload data
    const folder = process.env.CLOUDINARY_FOLDER || "entrainement-francais"
    const uploadData: any = {
      file: base64File,
      upload_preset: uploadPreset,
      folder: folder,
    }

    if (customFilename) {
      // Remove extension and any path components
      const publicId = customFilename.replace(/\.[^/.]+$/, "").replace(/\//g, "_")
      uploadData.public_id = publicId
      uploadData.use_filename = true
      uploadData.unique_filename = false
      console.log("[v0] Setting public_id:", publicId, "in folder:", folder)
    }

    console.log("[v0] Uploading to Cloudinary:", resourceType, "Folder:", folder)

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(uploadData),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Cloudinary error:", error)
      throw new Error(`Cloudinary upload failed: ${error}`)
    }

    const data = await response.json()
    console.log("[v0] Upload successful:", data.secure_url)

    return res.status(200).json({ url: data.secure_url })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return res.status(500).json({
      error: "Upload failed: " + (error as Error).message,
    })
  }
}
