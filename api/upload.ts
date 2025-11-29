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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "francais_exercices"

    if (!cloudName) {
      console.error("[v0] CLOUDINARY_CLOUD_NAME not configured")
      return res.status(500).json({
        error:
          "Configuration error: CLOUDINARY_CLOUD_NAME environment variable is missing. Please add it in Vercel project settings.",
      })
    }

    console.log("[v0] Cloudinary config:", { cloudName, uploadPreset })

    // Get file from request
    const formData = await req.formData()
    const file = formData.get("file")
    const customFilename = formData.get("filename")

    if (!file) {
      return res.status(400).json({ error: "No file provided" })
    }

    console.log("[v0] Uploading file:", file.name, "Size:", file.size)
    if (customFilename) {
      console.log("[v0] Using custom filename:", customFilename)
    }

    // Prepare Cloudinary upload
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("file", file)
    cloudinaryFormData.append("upload_preset", uploadPreset)

    const folder = process.env.CLOUDINARY_FOLDER || "entrainement-francais"
    cloudinaryFormData.append("folder", folder)

    if (customFilename) {
      // Remove extension from filename for public_id
      const publicId = customFilename.replace(/\.[^/.]+$/, "")
      cloudinaryFormData.append("public_id", publicId)
      console.log("[v0] Setting public_id:", publicId)
    }

    // Determine resource type (image, video, or raw for audio)
    const fileName = file.name.toLowerCase()
    let resourceType = "auto"
    if (fileName.match(/\.(mp3|wav|ogg|m4a)$/)) {
      resourceType = "video" // Cloudinary uses 'video' for audio files
    }

    console.log("[v0] Resource type:", resourceType, "Folder:", folder)

    // Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

    console.log("[v0] Uploading to:", cloudinaryUrl)

    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
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
    return res.status(500).json({ error: "Upload failed: " + (error as Error).message })
  }
}
