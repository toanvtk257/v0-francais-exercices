import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

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
      console.error("[v0] Supabase configuration missing")
      return res.status(500).json({ error: "Supabase not configured" })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Execute SQL directly using Supabase
    const { data, error } = await supabase.rpc("get_class_members_with_users", {
      p_class_id: classId,
    })

    if (error) {
      console.error("[v0] Error fetching members:", error)
      return res.status(500).json({ error: error.message || "Failed to fetch members" })
    }

    // Transform flat data back into the expected format
    const members = data?.map((row: any) => ({
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

    console.log("[v0] Fetched", members?.length || 0, "members for class", classId)
    return res.status(200).json({ members })
  } catch (error) {
    console.error("[v0] API error:", error)
    return res.status(500).json({
      error: "Failed to fetch class members: " + (error as Error).message,
    })
  }
}
