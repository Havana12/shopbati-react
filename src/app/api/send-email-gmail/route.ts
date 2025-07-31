import { NextRequest, NextResponse } from 'next/server'
import { OrderData } from '@/lib/orderService'
import nodemailer from 'nodemailer'
import jsPDF from 'jspdf'

// Fonction simple pour générer le PDF
async function generateInvoiceBuffer(orderData: OrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('Facture ShopBati', 105, 30, { align: 'center' })
      
      // Order details
      doc.setFontSize(12)
      doc.text(`Commande: ${orderData.orderId}`, 20, 50)
      doc.text(`Client: ${orderData.customerName || ''}`, 20, 60)
      doc.text(`Email: ${orderData.customerEmail}`, 20, 70)
      doc.text(`Date: ${new Date(orderData.timestamp).toLocaleString('fr-FR')}`, 20, 80)
      
      // Address if available
      let yPos = 90
      if (orderData.customerAddress) {
        doc.text('Adresse de facturation:', 20, yPos)
        yPos += 10
        if (orderData.customerAddress.street) {
          doc.text(orderData.customerAddress.street, 20, yPos)
          yPos += 10
        }
        doc.text(`${orderData.customerAddress.postalCode} ${orderData.customerAddress.city}`, 20, yPos)
        yPos += 10
        doc.text(orderData.customerAddress.country, 20, yPos)
        yPos += 10
      }
      
      // Products header
      doc.setFontSize(14)
      doc.text('Produits:', 20, yPos + 10)
      
      // Products list
      doc.setFontSize(10)
      let yPosition = yPos + 25
      orderData.items.forEach(item => {
        const line = `${item.name} x${item.quantity} - €${item.price.toFixed(2)} (Total: €${(item.price * item.quantity).toFixed(2)})`
        doc.text(line, 20, yPosition)
        yPosition += 10
      })
      
      // Total
      doc.setFontSize(14)
      doc.text(`Total: €${orderData.total.toFixed(2)}`, 150, yPosition + 20)
      
      // Footer
      doc.setFontSize(10)
      doc.text('Merci pour votre commande !', 105, yPosition + 40, { align: 'center' })
      
      // Get PDF as buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      resolve(pdfBuffer)
      
    } catch (err) {
      reject(err)
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    console.log('📧 Envoi email Gmail pour:', orderData.customerEmail)

    // Générer le contenu de l'email
    const emailContent = generateEmailContent(orderData)

    console.log('--- Génération PDF ---')
    let pdfBuffer = null
    try {
      pdfBuffer = await generateInvoiceBuffer(orderData)
      console.log('PDF généré, taille:', pdfBuffer.length)
    } catch (err) {
      console.error('Erreur génération PDF:', err)
      return NextResponse.json({ success: false, message: 'Erreur génération PDF', error: String(err) }, { status: 500 })
    }

    // Configuration SMTP simple (sans authentification 2FA)
    console.log('--- Configuration SMTP Simple ---')
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    })

    // Pour le développement, utilisons un service de test
    // En production, on pourra utiliser EmailJS ou un autre service
    
    // Créer un compte de test Ethereal
    const testAccount = await nodemailer.createTestAccount()
    
    const devTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    // Options de l'email
    const mailOptions = {
      from: `ShopBati <${testAccount.user}>`,
      to: orderData.customerEmail,
      subject: `Facture de votre commande ${orderData.orderId}`,
      html: emailContent,
      attachments: [
        {
          filename: `Facture-${orderData.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    console.log('--- Envoi email de test ---')
    try {
      const info = await devTransporter.sendMail(mailOptions)
      console.log('✅ Email de test envoyé:', info.messageId)
      console.log('🔗 Aperçu email:', nodemailer.getTestMessageUrl(info))
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email de test envoyé ! Vérifiez les logs pour voir l\'aperçu.',
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        note: 'Email de test - En production, configurez un vrai service SMTP'
      })
    } catch (error) {
      console.error('❌ Erreur envoi email de test:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email de test', 
        error: String(error) 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erreur API send-email-gmail:', error)
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}

function generateEmailContent(orderData: OrderData): string {
  const logoUrl = 'https://shopbati.com/logo-shopbati.png'
  const itemsHtml = orderData.items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; text-align: left;">
        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.name}</div>
        <div style="color: #666; font-size: 14px;">€${item.price.toFixed(2)} / unité</div>
      </td>
      <td style="padding: 12px; text-align: center; font-weight: 600;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: #f97316;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Facture ShopBati</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center;">
          <img src="${logoUrl}" alt="ShopBati" style="height: 60px; margin-bottom: 10px;" />
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Facture ShopBati</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Confirmation de commande</p>
        </div>
        <div style="padding: 30px;">
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 16px 0; font-size: 24px;">
              Merci ${orderData.customerName ? orderData.customerName : ''} !
            </h2>
            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
              Votre commande <strong style="color: #f97316;">${orderData.orderId}</strong> a été confirmée. 
              Voici le récapitulatif de votre achat :
            </p>
          </div>
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Détails de la commande</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f97316; color: white;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Produit</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Quantité</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          <div style="text-align: right; margin-bottom: 30px;">
            <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px; display: inline-block; min-width: 200px;">
              <div style="font-size: 18px; margin-bottom: 8px;">Total de la commande</div>
              <div style="font-size: 32px; font-weight: bold;">€${orderData.total.toFixed(2)}</div>
            </div>
          </div>
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">
              📋 Informations de commande
            </h4>
            <div style="color: #374151; font-size: 14px; line-height: 1.6;">
              <p style="margin: 4px 0;"><strong>Numéro :</strong> ${orderData.orderId}</p>
              <p style="margin: 4px 0;"><strong>Date :</strong> ${new Date(orderData.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 4px 0;"><strong>Email :</strong> ${orderData.customerEmail}</p>
              ${orderData.customerAddress ? `
              <p style="margin: 4px 0;"><strong>Adresse de facturation :</strong></p>
              <p style="margin: 4px 0 4px 20px; font-size: 13px;">
                ${orderData.customerAddress.street ? orderData.customerAddress.street + '<br>' : ''}
                ${orderData.customerAddress.postalCode} ${orderData.customerAddress.city}<br>
                ${orderData.customerAddress.country}
              </p>
              ` : ''}
            </div>
          </div>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 16px;">
              ✅ Prochaines étapes
            </h4>
            <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Nous préparons votre commande</li>
              <li>Vous recevrez un email de suivi avec les détails de livraison</li>
              <li>Notre équipe vous contactera pour finaliser les modalités</li>
            </ul>
          </div>
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">
              Une question ? Contactez-nous :
            </p>
            <p style="margin: 0;">
              📧 <a href="mailto:contact@shopbati.com" style="color: #f97316; text-decoration: none;">contact@shopbati.com</a>
              | 📞 <span style="color: #f97316;">01 23 45 67 89</span>
            </p>
          </div>
        </div>
        <div style="background-color: #374151; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            © 2025 ShopBati - Votre spécialiste en matériaux de construction
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
