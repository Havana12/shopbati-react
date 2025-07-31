import { NextRequest, NextResponse } from 'next/server'
import { InvoiceGenerator } from '@/lib/invoiceGenerator'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    console.log('📧 Génération et envoi email via Gmail pour:', orderData.customerEmail)
    
    // Générer le PDF
    const pdfBuffer = await InvoiceGenerator.generatePDFFromOrder(orderData)
    console.log('✅ PDF généré, taille:', pdfBuffer.length)

    // Configuration Gmail SMTP avec un compte de test gratuit
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'shopbati.test.2025@gmail.com', // Compte de test
        pass: 'app-password-here' // Mot de passe d'application
      }
    })

    // Contenu de l'email
    const emailContent = generateEmailContent(orderData)

    // Envoi de l'email
    const mailOptions = {
      from: 'SHOPBATI <shopbati.test.2025@gmail.com>',
      to: orderData.customerEmail,
      subject: `🧾 Facture SHOPBATI - Commande ${orderData.orderId}`,
      html: emailContent,
      attachments: [
        {
          filename: `Facture-SHOPBATI-${orderData.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('✅ Email envoyé avec succès:', info.messageId)
      
      return NextResponse.json({
        success: true,
        message: `📧 Facture envoyée avec succès à ${orderData.customerEmail}!`,
        messageId: info.messageId
      })
    } catch (emailError) {
      console.error('❌ Erreur envoi Gmail:', emailError)
      
      // Fallback : Utiliser un service de test gratuit (Ethereal)
      console.log('🔄 Fallback vers service de test...')
      
      const testAccount = await nodemailer.createTestAccount()
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      })

      const testInfo = await testTransporter.sendMail(mailOptions)
      const previewUrl = nodemailer.getTestMessageUrl(testInfo)
      
      console.log('✅ Email de test envoyé. Aperçu:', previewUrl)
      
      return NextResponse.json({
        success: true,
        message: `📧 Email de test envoyé. Aperçu disponible.`,
        testMode: true,
        previewUrl: previewUrl,
        originalEmail: orderData.customerEmail
      })
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'envoi de l\'email',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

function generateEmailContent(orderData: any): string {
  const itemsHtml = orderData.items.map((item: any) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; text-align: left;">
        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.name}</div>
        <div style="color: #666; font-size: 14px;">€${item.price.toFixed(2)} / unité</div>
      </td>
      <td style="padding: 12px; text-align: center; font-weight: 600;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: #FFD700;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Facture SHOPBATI</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- En-tête SHOPBATI -->
        <div style="background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%); color: #212121; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">SHOPBATI</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Plateforme du bâtiment</p>
          <div style="margin-top: 15px; padding: 15px; background: rgba(33, 33, 33, 0.1); border-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: bold;">🧾 FACTURE OFFICIELLE</h2>
          </div>
        </div>
        
        <!-- Contenu principal -->
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h2 style="color: #212121; margin: 0 0 16px 0; font-size: 24px;">
              Merci ${orderData.customerName ? orderData.customerName : 'cher client'} ! 🎉
            </h2>
            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
              Votre commande <strong style="color: #FFD700; background: #212121; padding: 4px 8px; border-radius: 4px;">${orderData.orderId}</strong> a été confirmée. 
              Voici votre facture en pièce jointe.
            </p>
          </div>
          
          <!-- Détails de la commande -->
          <div style="background: linear-gradient(45deg, #f9f9f9 0%, #ffffff 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; color: #212121; font-size: 18px;">📦 Détails de votre commande</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; border: 1px solid #FFD700;">
              <thead>
                <tr style="background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%); color: #212121;">
                  <th style="padding: 12px; text-align: left; font-weight: 700;">Produit</th>
                  <th style="padding: 12px; text-align: center; font-weight: 700;">Quantité</th>
                  <th style="padding: 12px; text-align: right; font-weight: 700;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <!-- Total -->
          <div style="text-align: right; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #212121 0%, #424242 100%); color: white; padding: 20px; border-radius: 12px; display: inline-block; min-width: 250px; border: 3px solid #FFD700;">
              <div style="font-size: 16px; margin-bottom: 8px; opacity: 0.9;">TOTAL À PAYER</div>
              <div style="font-size: 36px; font-weight: 900; color: #FFD700;">€${orderData.total.toFixed(2)}</div>
            </div>
          </div>
          
          <!-- Contact -->
          <div style="text-align: center; color: #666; font-size: 14px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #212121;">🤝 Une question ? Notre équipe est là pour vous !</p>
            <span>📧 shopbati@gmail.com | 📞 +33 1 23 45 67 89</span>
          </div>
        </div>
        
        <!-- Pied de page -->
        <div style="background: #212121; color: white; padding: 25px; text-align: center;">
          <h3 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFD700;">SHOPBATI</h3>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #ccc;">© 2025 SHOPBATI - Votre partenaire bâtiment</p>
        </div>
      </div>
    </body>
    </html>
  `
}
