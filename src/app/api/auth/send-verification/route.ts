import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { AppwriteService } from '@/lib/appwrite'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json(
        { success: false, error: 'Email et userId requis' },
        { status: 400 }
      )
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Save token to database
    const appwrite = AppwriteService.getInstance()
    await appwrite.updateCustomer(userId, {
      email_verification_token: verificationToken,
      email_verification_expires: expiresAt,
      email_verified: false
    })

    // Create verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`

    // Send verification email via Resend
    const { data, error } = await resend.emails.send({
      from: 'contact@shopbati.fr',
      to: email,
      subject: 'Vérifiez votre adresse email - ShopBati',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Bienvenue sur ShopBati !</h1>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Merci de vous être inscrit. Pour activer votre compte et commencer vos achats, 
              veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Vérifier mon email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </p>
            <p style="font-size: 12px; color: #2563eb; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              Ce lien de vérification expirera dans 24 heures.<br>
              Si vous n'avez pas créé de compte sur ShopBati, vous pouvez ignorer cet email.
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
Bienvenue sur ShopBati !

Merci de vous être inscrit. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :

${verificationUrl}

Ce lien expirera dans 24 heures.

Si vous n'avez pas créé de compte sur ShopBati, vous pouvez ignorer cet email.

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

    console.log('✅ Email de vérification envoyé:', data)

    return NextResponse.json({
      success: true,
      message: 'Email de vérification envoyé avec succès',
      emailId: data?.id
    })

  } catch (error: any) {
    console.error('❌ Erreur API send-verification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
