import { NextRequest, NextResponse } from 'next/server'
import { AppwriteService } from '@/lib/appwrite'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json()

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token, email et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
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

    // Verify token
    if (user.password_reset_token !== token) {
      return NextResponse.json(
        { success: false, error: 'Token de réinitialisation invalide' },
        { status: 400 }
      )
    }

    // Check if token expired
    const expiresAt = new Date(user.password_reset_expires || 0)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.' },
        { status: 400 }
      )
    }

    // Generate new password hash
    const generatePasswordHash = (email: string, password: string) => {
      const salt = Math.random().toString(36).substring(2, 15)
      const hash = btoa(`${email}:${password}:${salt}`).substring(0, 60)
      return `$2y$10$${hash}`
    }

    const newPasswordHash = generatePasswordHash(email, newPassword)

    // Update password in database and clear reset token
    await appwrite.updateCustomer(user.$id, {
      password_hash: newPasswordHash,
      password_reset_token: '',
      password_reset_expires: '',
      updated_at: new Date().toISOString()
    })

    // Delete Auth account if it exists, so it will be recreated with new password on next login
    try {
      const { Client, Users, Query } = await import('node-appwrite')
      
      const adminClient = new Client()
      adminClient
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_API_KEY || '')

      const users = new Users(adminClient)
      
      // Try to find and delete the Auth user by email
      try {
        const authUsersList = await users.list([
          Query.equal('email', [email])
        ])
        
        if (authUsersList.users && authUsersList.users.length > 0) {
          const authUserId = authUsersList.users[0].$id
          await users.delete(authUserId)
          console.log('✅ Ancien compte Auth supprimé pour:', email)
          console.log('✅ Sera recréé avec nouveau mot de passe au prochain login')
        } else {
          console.log('ℹ️ Aucun compte Auth trouvé pour:', email)
        }
      } catch (deleteError: any) {
        console.error('⚠️ Erreur suppression compte Auth:', deleteError.message)
        // Continue anyway, the login will handle it
      }
    } catch (error: any) {
      console.error('⚠️ Erreur initialisation Admin SDK:', error.message)
      // Continue anyway, the login will handle it
    }

    console.log('✅ Mot de passe réinitialisé pour:', email)

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.'
    })

  } catch (error: any) {
    console.error('❌ Erreur reset-password:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
