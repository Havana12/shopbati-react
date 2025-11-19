import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Send email to SHOPBATI
    const { data, error } = await resend.emails.send({
      from: 'SHOPBATI Contact <onboarding@resend.dev>',
      to: ['contact@shopbati.fr'],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%); color: #212121; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .info-row { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #FFD700; }
            .message-box { background: #f9f9f9; padding: 20px; border-left: 4px solid #FFD700; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">📧 Nouveau message de contact</h1>
              <p style="margin: 5px 0 0 0;">SHOPBATI.FR</p>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="label">👤 Nom:</span> ${name}
              </div>
              <div class="info-row">
                <span class="label">📧 Email:</span> <a href="mailto:${email}">${email}</a>
              </div>
              ${phone ? `<div class="info-row"><span class="label">📞 Téléphone:</span> ${phone}</div>` : ''}
              <div class="info-row">
                <span class="label">📋 Sujet:</span> ${subject}
              </div>
              <div class="message-box">
                <h3 style="margin-top: 0; color: #212121;">💬 Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <div style="margin-top: 30px; padding: 15px; background: #fff9c4; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Répondre directement à: <strong>${email}</strong>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Erreur lors de l\'envoi de l\'email', error },
        { status: 500 }
      )
    }

    // Send confirmation email to customer
    try {
      await resend.emails.send({
        from: 'SHOPBATI <onboarding@resend.dev>',
        to: [email],
        subject: 'Confirmation de réception - SHOPBATI',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%); color: #212121; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">SHOPBATI</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Plateforme du bâtiment</p>
              </div>
              <div class="content">
                <h2 style="color: #FFD700; margin-top: 0;">✅ Message bien reçu !</h2>
                <p>Bonjour ${name},</p>
                <p>Merci d'avoir contacté <strong>SHOPBATI</strong>. Nous avons bien reçu votre message concernant : <strong>${subject}</strong></p>
                <p>Notre équipe vous répondra dans les plus brefs délais, généralement sous <strong>24 heures</strong>.</p>
                <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #FFD700; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #212121;">📋 Récapitulatif de votre demande:</h3>
                  <p style="margin: 5px 0;"><strong>Sujet:</strong> ${subject}</p>
                  <p style="margin: 5px 0; white-space: pre-wrap;"><strong>Message:</strong><br>${message}</p>
                </div>
                <p>Si vous avez besoin d'une assistance immédiate, n'hésitez pas à nous appeler au <strong>+33 6 52 35 40 15</strong>.</p>
                <p>Cordialement,<br><strong>L'équipe SHOPBATI</strong></p>
                <div style="margin-top: 30px; padding: 20px; background: #212121; color: white; text-align: center; border-radius: 8px;">
                  <p style="margin: 0; font-size: 12px;">
                    📧 contact@shopbati.fr • 📞 +33 6 52 35 40 15<br>
                    6 Rue des Bateliers - Bureau 3, 92110 Clichy
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    } catch (confirmError) {
      // Don't fail the main request if confirmation email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès !',
      data
    })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
