import { NextRequest, NextResponse } from 'next/server'
import { AppwriteService } from '@/lib/appwrite'
import { EmailService } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    const appwrite = AppwriteService.getInstance()

    // Find user by email
    const user = await appwrite.getCustomerByEmail(email)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email déjà vérifié',
        alreadyVerified: true
      })
    }

    // Send new verification email
    const emailService = EmailService.getInstance()
    const result = await emailService.sendVerificationEmail(email, user.$id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email de vérification renvoyé avec succès'
    })

  } catch (error: any) {
    console.error('❌ Erreur resend verification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
