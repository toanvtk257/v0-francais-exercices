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
    // Get file from request
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return res.status(400).json({ error: "No file provided" })
    }

    // Prepare Cloudinary upload
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("file", file)
    cloudinaryFormData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "francais_exercices")

    const folder = process.env.CLOUDINARY_FOLDER || "entrainement-francais"
    cloudinaryFormData.append("folder", folder)

    // Determine resource type (image, video, or raw for audio)
    const fileName = file.name.toLowerCase()
    let resourceType = "auto"
    if (fileName.match(/\.(mp3|wav|ogg|m4a)$/)) {
      resourceType = "video" // Cloudinary uses 'video' for audio files
    }

    // Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`

    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cloudinary upload failed: ${error}`)
    }

    const data = await response.json()
    return res.status(200).json({ url: data.secure_url })
  } catch (error) {
    console.error("Upload error:", error)
    return res.status(500).json({ error: "Upload failed: " + (error as Error).message })
  }
}
