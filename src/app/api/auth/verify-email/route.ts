import { NextRequest, NextResponse } from 'next/server'
import { AppwriteService } from '@/lib/appwrite'

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: 'Token et email requis' },
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

    // Verify token
    if (user.email_verification_token !== token) {
      return NextResponse.json(
        { success: false, error: 'Token de vérification invalide' },
        { status: 400 }
      )
    }

    // Check if token expired
    const expiresAt = new Date(user.email_verification_expires || 0)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Le lien de vérification a expiré. Veuillez demander un nouveau lien.' },
        { status: 400 }
      )
    }

    // Update user - mark as verified and clear token
    await appwrite.updateCustomer(user.$id, {
      email_verified: true,
      email_verification_token: '',
      email_verification_expires: '',
      updated_at: new Date().toISOString()
    })

    console.log('✅ Email vérifié pour:', email)

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
    })

  } catch (error: any) {
    console.error('❌ Erreur vérification email:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
