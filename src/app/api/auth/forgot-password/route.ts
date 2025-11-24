import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { AppwriteService } from '@/lib/appwrite'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cette adresse, vous recevrez un email de réinitialisation.'
      })
    }

    // Generate password reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Save token to database
    await appwrite.updateCustomer(user.$id, {
      password_reset_token: resetToken,
      password_reset_expires: expiresAt
    })

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Send password reset email via Resend
    const { data, error } = await resend.emails.send({
      from: 'contact@shopbati.fr',
      to: email,
      subject: 'Réinitialisation de votre mot de passe - ShopBati',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">Réinitialisation de mot de passe</h1>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vous avez demandé la réinitialisation de votre mot de passe sur ShopBati.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </p>
            <p style="font-size: 12px; color: #dc2626; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              <strong>⚠️ Important :</strong><br>
              - Ce lien expirera dans <strong>1 heure</strong><br>
              - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email<br>
              - Votre mot de passe actuel reste inchangé tant que vous ne créez pas un nouveau
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              <strong>ShopBati</strong><br>
              Votre partenaire pour les matériaux de construction
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Réinitialisation de mot de passe - ShopBati

Vous avez demandé la réinitialisation de votre mot de passe.

Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :

${resetUrl}

⚠️ Important :
- Ce lien expirera dans 1 heure
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Votre mot de passe actuel reste inchangé tant que vous ne créez pas un nouveau

ShopBati - Votre partenaire pour les matériaux de construction
      `
    })

    if (error) {
      console.error('❌ Erreur Resend:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    console.log('✅ Email de réinitialisation envoyé:', data)

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cette adresse, vous recevrez un email de réinitialisation.',
      emailId: data?.id
    })

  } catch (error: any) {
    console.error('❌ Erreur API forgot-password:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
