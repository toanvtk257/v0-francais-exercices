import { type NextRequest, NextResponse } from "next/server"

const ADMIN_EMAILS = ["prof@example.com", "admin@example.com", "enseignant@example.com"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Simple validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    // Check if admin
    const isAdmin = ADMIN_EMAILS.some((adminEmail) => email.toLowerCase().includes(adminEmail.toLowerCase()))

    // Return redirect URL
    const redirectUrl = isAdmin ? "/admin.html" : "/dashboard.html"

    return NextResponse.json({
      success: true,
      redirectUrl,
    })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
