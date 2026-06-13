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

    // Execute raw SQL query to bypass PostgREST relationship detection completely
    const { data: flatData, error } = await supabase.from("class_members_view")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching members from view:", error)
      return res.status(500).json({ error: error.message || "Failed to fetch members" })
    }

    // If we have members, fetch the user data separately
    let members = []
    if (flatData && flatData.length > 0) {
      const userIds = flatData.map((m: any) => m.user_id).filter((id: string) => id)
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", userIds)

        if (!usersError && users) {
          const usersMap: { [key: string]: any } = {}
          users.forEach(u => {
            usersMap[u.id] = u
          })

          members = flatData.map((row: any) => ({
            id: row.id,
            class_id: row.class_id,
            user_id: row.user_id,
            created_at: row.created_at,
            users: row.user_id ? usersMap[row.user_id] || null : null,
          }))
        }
      }
    }

    console.log("[v0] Fetched", members.length, "members for class", classId)
    return res.status(200).json({ members })
  } catch (error) {
    console.error("[v0] API error:", error)
    return res.status(500).json({
      error: "Failed to fetch class members: " + (error as Error).message,
    })
  }
}
