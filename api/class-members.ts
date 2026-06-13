import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  )

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { classId } = req.body

    if (!classId) {
      return res.status(400).json({ error: "classId is required" })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Supabase config missing")
      return res.status(500).json({ error: "Supabase not configured" })
    }

    // Call Supabase RPC via HTTP REST API
    // Use the REST endpoint directly to call the RPC function
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_class_members_with_users`
    
    console.log("[v0] Calling RPC:", rpcUrl, "with classId:", classId)

    const rpcResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ p_class_id: classId }),
    })

    console.log("[v0] RPC Response status:", rpcResponse.status)

    if (!rpcResponse.ok) {
      const errorText = await rpcResponse.text()
      console.error("[v0] RPC error response:", errorText.substring(0, 200))
      return res.status(500).json({ error: `Database error: ${rpcResponse.status}` })
    }

    const members = await rpcResponse.json()
    console.log("[v0] RPC returned", Array.isArray(members) ? members.length : 'null', "rows")

    // Transform the flat rows back to nested format
    const formattedMembers = Array.isArray(members)
      ? members.map((row: any) => ({
          id: row.member_id,
          class_id: classId,
          user_id: row.user_id,
          created_at: row.created_at,
          users: row.user_id
            ? {
                id: row.user_id,
                name: row.user_name,
                email: row.user_email,
              }
            : null,
        }))
      : []

    console.log("[v0] API: Returning", formattedMembers.length, "formatted members")
    return res.status(200).json({ members: formattedMembers })
  } catch (error) {
    console.error("[v0] API Exception:", error instanceof Error ? error.message : String(error))
    return res.status(500).json({
      error: "Server error: " + (error instanceof Error ? error.message : "Unknown error"),
    })
  }
}
