export default async function handler(req, res) {
  console.log("[v0] list-json API called")

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { list } = await import("@vercel/blob")

    console.log("[v0] Listing blobs with prefix: questions-")

    const { blobs } = await list({
      prefix: "questions-",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("[v0] Found blobs:", blobs.length)

    // Sort by upload time (most recent first)
    const sortedBlobs = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

    res.status(200).json({
      success: true,
      files: sortedBlobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt,
        size: blob.size,
      })),
    })
  } catch (error) {
    console.error("[v0] Error listing blobs:", error)
    res.status(500).json({
      error: "Failed to list blobs",
      details: error.message,
    })
  }
}
