export const config = {
  runtime: "edge",
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    let oembedUrl: string

    // Detect video platform and construct oEmbed URL
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    } else if (url.includes("vimeo.com")) {
      oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
    } else if (url.includes("dailymotion.com")) {
      oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(url)}`
    } else {
      return new Response(JSON.stringify({ error: "Unsupported video platform" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch from oEmbed API
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch video metadata" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await response.json()

    return new Response(JSON.stringify({ title: data.title || null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Error in fetch-video-title API:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
