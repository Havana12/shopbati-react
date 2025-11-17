import { NextRequest, NextResponse } from 'next/server'
import { OrderData } from '@/lib/orderService'
import { Resend } from 'resend'
import { generateInvoiceWithQRCode } from '@/lib/invoiceGenerator'
import { AppwriteService } from '@/lib/appwrite'

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    // Generate invoice with QR code and upload to Appwrite
    let invoiceResult = null
    try {
      console.log('🔧 Generating invoice with QR code for order:', orderData.orderId)
      invoiceResult = await generateInvoiceWithQRCode(orderData)
      console.log('✅ Invoice generated and uploaded to Appwrite:', {
        fileId: invoiceResult.fileId,
        invoiceUrl: invoiceResult.invoiceUrl
      })
    } catch (err) {
      console.error('❌ Error generating invoice with QR:', err)
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur génération de la facture avec QR code', 
        error: String(err) 
      }, { status: 500 })
    }

    const pdfBuffer = invoiceResult.pdfBuffer

    // Générer le contenu de l'email avec lien vers la facture
    const emailContent = generateEmailContent(orderData, invoiceResult.invoiceUrl, invoiceResult.qrCodeDataUrl)

    // Envoi avec Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    let emailToSend = orderData.customerEmail // Utiliser l'email du client
    let emailSubject = `🧾 Facture SHOPBATI - Commande ${orderData.orderId}`
    
    try {
      const { error, data } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [emailToSend],
        subject: emailSubject,
        html: emailContent,
        attachments: [
          {
            filename: `Facture-SHOPBATI-${orderData.orderId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      })
      
      if (error) {
        
        // Mode test : renvoyer à l'adresse vérifiée
        const errorStr = JSON.stringify(error)
        if (errorStr.includes('403') || errorStr.includes('You can only send testing emails')) {
          
          const testEmail = orderData.customerEmail // Utiliser l'email du client même en mode test
          const testContent = emailContent + `
            <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #92400e;">🧪 MODE TEST RESEND</h4>
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>📧 Email client original :</strong> ${orderData.customerEmail}<br>
                <strong>👤 Client :</strong> ${orderData.customerName || 'Non spécifié'}<br>
                <strong>📦 Commande :</strong> ${orderData.orderId}<br>
                <em>Cette facture devrait normalement être envoyée à ${orderData.customerEmail}</em>
              </p>
            </div>
          `
          
          const { error: testError, data: testData } = await resend.emails.send({
            from: 'SHOPBATI <onboarding@resend.dev>',
            to: [testEmail],
            subject: `🧪 [TEST] Facture pour ${orderData.customerEmail} - ${orderData.orderId}`,
            html: testContent,
            attachments: [
              {
                filename: `Facture-SHOPBATI-${orderData.orderId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ],
          })
          
          if (testError) {
            return NextResponse.json({ 
              success: false, 
              message: 'Erreur envoi email (test échoué)', 
              error: testError 
            }, { status: 500 })
          }
          
          // Mettre à jour le statut de la commande après envoi réussi de la facture
          console.log(`📧 Test email sent successfully to ${testEmail}, updating order status...`)
          await updateOrderStatusAfterInvoice(orderData.orderId)
          
          return NextResponse.json({ 
            success: true, 
            message: `📧 Email envoyé en mode test à ${testEmail}`,
            testMode: true,
            originalEmail: orderData.customerEmail,
            testEmail: testEmail
          })
        }
        
        return NextResponse.json({ 
          success: false, 
          message: 'Erreur lors de l\'envoi de l\'email', 
          error 
        }, { status: 500 })
      }
      
      // Mettre à jour le statut de la commande après envoi réussi de la facture
      console.log(`📧 Email sent successfully to ${orderData.customerEmail}, updating order status...`)
      await updateOrderStatusAfterInvoice(orderData.orderId)
      
      return NextResponse.json({ 
        success: true, 
        message: `📧 Facture envoyée avec succès à ${orderData.customerEmail}! Commande marquée comme livrée.`,
        directSend: true 
      })
      
    } catch (err) {
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur serveur email', 
        error: String(err) 
      }, { status: 500 })
    }
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur général' 
    }, { status: 500 })
  }
}

// Fonction pour mettre à jour le statut de la commande après envoi de la facture
async function updateOrderStatusAfterInvoice(orderId: string) {
  try {
    console.log(`🔍 Searching for order with ID: ${orderId}`)
    const appwrite = AppwriteService.getInstance()
    
    // Chercher la commande par order_number
    const result = await appwrite.databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'orders',
      [appwrite.Query.equal('order_number', orderId)]
    )
    
    console.log(`📊 Found ${result.documents.length} orders matching ID: ${orderId}`)
    
    if (result.documents.length > 0) {
      const order = result.documents[0]
      console.log(`📋 Order found: ${order.$id}, current status: ${order.status}, payment_status: ${order.payment_status}`)
      
      // Mettre à jour: status = "livré" et payment_status = "payé"
      const updateData = {
        status: 'livré',
        payment_status: 'payé',
        updated_at: new Date().toISOString(),
        invoice_sent_at: new Date().toISOString()
      }
      
      console.log('🔄 Updating order with data:', updateData)
      
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        order.$id,
        updateData
      )
      
      console.log(`✅ Commande ${orderId} mise à jour: status=livré, payment_status=payé`)
      return { success: true }
    } else {
      console.warn(`⚠️ Commande ${orderId} non trouvée pour mise à jour du statut`)
      return { success: false, error: 'Order not found' }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut de la commande:', error)
    return { success: false, error: String(error) }
  }
}

function generateEmailContent(orderData: OrderData, invoiceUrl?: string, qrCodeDataUrl?: string): string {
  const itemsHtml = orderData.items.map(item => `
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
              Votre commande <strong style="color: #FFD700; background: #212121; padding: 4px 8px; border-radius: 4px;">${orderData.orderId}</strong> a été confirmée et traitée. 
              Voici le récapitulatif détaillé avec votre facture en pièce jointe.
            </p>
          </div>
          
          <!-- Détails de la commande -->
          <div style="background: linear-gradient(45deg, #f9f9f9 0%, #ffffff 100%); border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; color: #212121; font-size: 18px; display: flex; align-items: center;">
              <span style="background: #FFD700; color: #212121; padding: 8px; border-radius: 8px; margin-right: 10px;">📦</span>
              Détails de votre commande
            </h3>
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
              <div style="font-size: 36px; font-weight: 900; color: #FFD700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">€${orderData.total.toFixed(2)}</div>
            </div>
          </div>
          
          <!-- Informations commande -->
          <div style="background: #fff9c4; border: 2px solid #FFD700; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 12px 0; color: #212121; font-size: 16px; display: flex; align-items: center;">
              <span style="background: #FFD700; color: #212121; padding: 6px; border-radius: 6px; margin-right: 8px;">ℹ️</span>
              Informations de commande
            </h4>
            <div style="color: #212121; font-size: 14px; line-height: 1.8;">
              <p style="margin: 4px 0;"><strong>📋 Numéro :</strong> ${orderData.orderId}</p>
              <p style="margin: 4px 0;"><strong>📅 Date :</strong> ${new Date(orderData.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 4px 0;"><strong>📧 Email :</strong> ${orderData.customerEmail}</p>
              <p style="margin: 4px 0;"><strong>🧾 Facture :</strong> Voir pièce jointe PDF</p>
            </div>
          </div>
          
          ${invoiceUrl && qrCodeDataUrl ? `
          <!-- Section QR Code -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 3px solid #0ea5e9; border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 18px; font-weight: 700;">
              📱 Accédez à votre facture depuis votre mobile !
            </h4>
            <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block; border: 2px solid #0ea5e9; margin-bottom: 15px;">
              <img src="${qrCodeDataUrl}" alt="QR Code Facture" style="width: 150px; height: 150px; display: block;" />
            </div>
            <p style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 14px; font-weight: 600;">
              Scannez ce QR code avec votre téléphone
            </p>
            <p style="margin: 0; color: #075985; font-size: 13px;">
              ou <a href="${invoiceUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: 700;">cliquez ici pour télécharger votre facture</a>
            </p>
            <div style="margin-top: 15px; padding: 12px; background: rgba(14, 165, 233, 0.1); border-radius: 8px;">
              <p style="margin: 0; color: #0c4a6e; font-size: 12px;">
                💡 <strong>Astuce :</strong> Gardez votre facture accessible à tout moment en scannant le QR code présent sur le PDF !
              </p>
            </div>
          </div>
          ` : ''}
          
          <!-- Prochaines étapes -->
          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; display: flex; align-items: center;">
              <span style="background: #22c55e; color: white; padding: 6px; border-radius: 6px; margin-right: 8px;">✅</span>
              Prochaines étapes
            </h4>
            <ul style="color: #166534; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Préparation :</strong> Nous préparons votre commande avec soin</li>
              <li style="margin-bottom: 8px;"><strong>Suivi :</strong> Vous recevrez un email de confirmation d'expédition</li>
              <li style="margin-bottom: 8px;"><strong>Livraison :</strong> Notre équipe vous contactera pour planifier la livraison</li>
              <li><strong>Support :</strong> Nous restons à votre disposition pour toute question</li>
            </ul>
          </div>
          
          <!-- Contact -->
          <div style="text-align: center; color: #666; font-size: 14px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #212121;">
              🤝 Une question ? Notre équipe est là pour vous !
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
              <span>📧 <a href="mailto:shopbati@gmail.com" style="color: #FFD700; text-decoration: none; font-weight: 600;">shopbati@gmail.com</a></span>
              <span>📞 <strong style="color: #FFD700;">+33 6 52 35 40 15</strong></span>
            </div>
          </div>
        </div>
        
        <!-- Pied de page -->
        <div style="background: #212121; color: white; padding: 25px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFD700; text-transform: uppercase; letter-spacing: 1px;">SHOPBATI</h3>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #ccc; text-transform: uppercase; letter-spacing: 1px;">Plateforme du bâtiment</p>
          </div>
          <div style="border-top: 1px solid #424242; padding-top: 15px;">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
              © 2025 SHOPBATI - Votre partenaire de confiance pour tous vos projets de construction
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.6;">
              123 Rue du Bâtiment, 75001 Paris, France
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// ...existing code...
