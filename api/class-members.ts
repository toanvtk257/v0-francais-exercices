import type { VercelRequest, VercelResponse } from "@vercel/node"
import { Client } from "pg"

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

  let client: Client | null = null
  try {
    const { classId } = req.body

    if (!classId) {
      return res.status(400).json({ error: "classId is required" })
    }

    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

    if (!databaseUrl) {
      console.error("[v0] Database URL missing")
      return res.status(500).json({ error: "Database not configured" })
    }

    // Create PostgreSQL client directly - bypasses PostgREST completely
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    })

    await client.connect()

    // Execute raw SQL to fetch members with user data - no relationship ambiguity
    const query = `
      SELECT 
        cm.id,
        cm.class_id,
        cm.user_id,
        cm.created_at,
        u.name as user_name,
        u.email as user_email
      FROM class_memberships cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.class_id = $1
      ORDER BY cm.created_at DESC
    `

    const result = await client.query(query, [classId])

    // Transform rows to expected format
    const members = result.rows.map((row: any) => ({
      id: row.id,
      class_id: row.class_id,
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

    console.log("[v0] API: Fetched", members.length, "members for class", classId)
    return res.status(200).json({ members })
  } catch (error) {
    console.error("[v0] API Exception:", error)
    return res.status(500).json({
      error: "Server error: " + (error instanceof Error ? error.message : "Unknown error"),
    })
  } finally {
    if (client) {
      await client.end()
    }
  }
}
