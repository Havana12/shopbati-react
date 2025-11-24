import { NextRequest, NextResponse } from 'next/server'
import { OrderData } from '@/lib/orderService'
import { Resend } from 'resend'
import { generateInvoiceWithQRCode } from '@/lib/invoiceGenerator'
import { AppwriteService } from '@/lib/appwrite'

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    // Fetch address from users table if shippingAddress is empty
    if (!orderData.shippingAddress?.street && orderData.customerEmail) {
      console.log('📍 Fetching address from users table for:', orderData.customerEmail)
      
      const { Client, Databases, Query } = await import('node-appwrite')
      
      const client = new Client()
      client
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_API_KEY || '')
      
      const databases = new Databases(client)
      
      try {
        const users = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          [Query.equal('email', orderData.customerEmail)]
        )
        
        if (users.documents.length > 0) {
          const user = users.documents[0]
          console.log('✅ User found, address:', user.address, user.city)
          
          orderData.shippingAddress = {
            street: user.address || '',
            city: user.city || '',
            postalCode: user.postalCode || user.postal_code || '',
            country: user.country || 'France'
          }
          
          console.log('✅ ShippingAddress updated:', orderData.shippingAddress)
        } else {
          console.log('⚠️ No user found with email:', orderData.customerEmail)
        }
      } catch (err) {
        console.error('❌ Error fetching user address:', err)
      }
    }

    // Generate invoice with QR code and upload to Appwrite
    let invoiceResult = null
    try {
      invoiceResult = await generateInvoiceWithQRCode(orderData)
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
    const emailContent = generatePaymentConfirmationEmail(orderData, invoiceResult.invoiceUrl, invoiceResult.qrCodeDataUrl)

    // Envoi avec Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Convert QR code data URL to buffer for email attachment
    let qrCodeBuffer: Buffer | undefined
    if (invoiceResult.qrCodeDataUrl) {
      const base64Data = invoiceResult.qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
      qrCodeBuffer = Buffer.from(base64Data, 'base64')
    }
    
    const attachments: any[] = [
      {
        filename: `Facture-SHOPBATI-${orderData.orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }
    ]
    
    // Add QR code as inline attachment with CID
    if (qrCodeBuffer) {
      attachments.push({
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        contentType: 'image/png',
        disposition: 'inline',
        content_id: 'qrcode'
      })
    }
    
    try {
      const { error } = await resend.emails.send({
        from: 'SHOPBATI <contact@shopbati.fr>',
        to: [orderData.customerEmail],
        subject: `Confirmation de paiement & préparation de votre commande – ${orderData.orderId}`,
        html: emailContent,
        attachments: attachments,
      })
      
      if (error) {
        console.error('❌ Erreur envoi email Resend:', error)
        return NextResponse.json({ 
          success: false, 
          message: 'Erreur lors de l\'envoi de l\'email', 
          error 
        }, { status: 500 })
      }
      
      // Mettre à jour le statut de la commande : status = "payé", invoice_sent = true
      await updateOrderStatusAfterPaymentConfirmation(orderData.orderId)
      
      return NextResponse.json({ 
        success: true, 
        message: `Facture envoyée avec succès à ${orderData.customerEmail}`
      })
      
    } catch (err) {
      console.error('❌ Erreur serveur email:', err)
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur serveur email', 
        error: String(err) 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erreur serveur général:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur général' 
    }, { status: 500 })
  }
}

// Fonction pour mettre à jour le statut après confirmation de paiement
async function updateOrderStatusAfterPaymentConfirmation(orderId: string) {
  try {
    const appwrite = AppwriteService.getInstance()
    
    const result = await appwrite.databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'orders',
      [appwrite.Query.equal('order_number', orderId)]
    )
    
    if (result.documents.length > 0) {
      const order = result.documents[0]
      
      const updateData = {
        status: 'payé',
        payment_status: 'payé',
        updated_at: new Date().toISOString()
      }
      
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        order.$id,
        updateData
      )
      
      return { success: true }
    } else {
      console.error('⚠️ Commande non trouvée:', orderId)
      return { success: false, error: 'Order not found' }
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error)
    return { success: false, error: String(error) }
  }
}

function generatePaymentConfirmationEmail(orderData: OrderData, invoiceUrl?: string, qrCodeDataUrl?: string): string {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  // Format shipping address for display
  let shippingAddressHtml = ''
  if (orderData.shippingAddress?.street) {
    shippingAddressHtml = `
      <li>Adresse de livraison : ${orderData.shippingAddress.street}, ${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}, ${orderData.shippingAddress.country || 'France'}</li>
    `
  } else if (orderData.customerInfo?.address) {
    shippingAddressHtml = `
      <li>Adresse de livraison : ${orderData.customerInfo.address}, ${orderData.customerInfo.postalCode} ${orderData.customerInfo.city}, ${orderData.customerInfo.country || 'France'}</li>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2 style="color: #2c3e50;">Objet : Confirmation de paiement & préparation de votre commande – ${orderData.orderId}</h2>
        
        <p>Madame, Monsieur,</p>
        
        <p>Nous vous confirmons la bonne réception de votre règlement.</p>
        <p>Nous vous remercions pour votre confiance.</p>
        
        <p>Veuillez trouver en pièce jointe :</p>
        <ul>
          <li>La facture de votre commande</li>
          <li>Le récapitulatif détaillé des articles</li>
        </ul>
        
        <p>Votre commande est désormais validée et transmise à notre équipe logistique.</p>
        
        <h3>🚚 Délais de traitement & expédition</h3>
        
        <p>La préparation de votre commande commence immédiatement.</p>
        <p>L'expédition sera effectuée dans un délai maximum de <strong>48 heures (jours ouvrés)</strong>.</p>
        <p>Vous recevrez un e-mail automatique avec le numéro de suivi dès que votre colis quittera notre entrepôt.</p>
        
        ${invoiceUrl && qrCodeDataUrl ? `
        <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; text-align: center;">
          <h3 style="color: #0c4a6e;">📱 Accédez à votre facture depuis votre mobile !</h3>
          <div style="margin: 15px 0;">
            <img src="cid:qrcode" alt="QR Code Facture" style="width: 150px; height: 150px;" />
          </div>
          <p>Scannez ce QR code avec votre téléphone</p>
          <p>ou <a href="${invoiceUrl}" style="color: #0ea5e9; text-decoration: none; font-weight: bold;">cliquez ici pour télécharger votre facture</a></p>
        </div>
        ` : ''}
        
        <h3>Récapitulatif de votre commande</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Produit</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantité</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Prix unitaire</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">TOTAL :</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">€${orderData.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>Informations de commande :</strong></p>
          <ul>
            <li>N° de commande : <strong>${orderData.orderId}</strong></li>
            <li>Date : ${new Date(orderData.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>
            <li>Email : ${orderData.customerEmail}</li>
            ${orderData.customerName ? `<li>Client : ${orderData.customerName}</li>` : ''}
            ${shippingAddressHtml}
            <li>Statut : <strong style="color: #22c55e;">PAYÉ</strong></li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">Nous vous remercions sincèrement d'avoir choisi <strong>SHOPBATI.FR</strong> pour vos achats de matériels de bâtiment.</p>
        <p>Nous restons à votre entière disposition pour toute question.</p>
        
        <p>Cordialement,<br>
        <strong>Service Client – SHOPBATI.FR</strong></p>
        
        <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-top: 3px solid #22c55e;">
          <p style="margin: 0; text-align: center; color: #666;">
            <strong>SHOPBATI.FR</strong><br>
            Email: contact@shopbati.fr | Tél: +33 1 89 48 08 02
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
