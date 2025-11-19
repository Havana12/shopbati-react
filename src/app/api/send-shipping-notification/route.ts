import { NextRequest, NextResponse } from 'next/server'
import { OrderData } from '@/lib/orderService'
import { Resend } from 'resend'
import { AppwriteService } from '@/lib/appwrite'

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailContent = generateShippingNotificationEmail(orderData)
    
    const { error } = await resend.emails.send({
      from: 'SHOPBATI <onboarding@resend.dev>',
      to: [orderData.customerEmail],
      subject: `Votre commande ${orderData.orderId} a été expédiée`,
      html: emailContent,
    })
    
    if (error) {
      console.error('❌ Erreur envoi email expédition:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email d\'expédition', 
        error 
      }, { status: 500 })
    }
    
    // Mettre à jour le statut de la commande à "livré" ou "expédié"
    await updateOrderStatusAfterShipping(orderData.orderId)
    
    return NextResponse.json({ 
      success: true, 
      message: `Email d'expédition envoyé à ${orderData.customerEmail}`
    })
    
  } catch (error) {
    console.error('❌ Erreur serveur:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur général' 
    }, { status: 500 })
  }
}

// Fonction pour mettre à jour le statut après expédition
async function updateOrderStatusAfterShipping(orderId: string) {
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
        status: 'expédié',
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

function generateShippingNotificationEmail(orderData: OrderData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2 style="color: #2c3e50;">Objet : Votre commande ${orderData.orderId} a été expédiée</h2>
        
        <p>Madame, Monsieur,</p>
        
        <p>Nous avons le plaisir de vous informer que votre commande a été expédiée.</p>
        
        <p>Votre colis a quitté notre entrepôt et est actuellement en cours d'acheminement.</p>
        
        <h3>⏱️ Délais de livraison</h3>
        
        <p>La livraison interviendra généralement <strong>entre 24h et 72h</strong>, selon votre adresse.</p>
        
        <div style="margin: 30px 0; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>Informations de commande :</strong></p>
          <ul>
            <li>N° de commande : <strong>${orderData.orderId}</strong></li>
            <li>Date de commande : ${new Date(orderData.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
            <li>Email : ${orderData.customerEmail}</li>
            <li>Statut : <strong style="color: #3b82f6;">EXPÉDIÉ</strong></li>
          </ul>
        </div>
        
        ${orderData.shippingAddress ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #22c55e;">
          <p style="margin: 0 0 10px 0;"><strong>📍 Adresse de livraison :</strong></p>
          <p style="margin: 0;">
            ${orderData.customerName || ''}<br>
            ${typeof orderData.shippingAddress === 'object' ? `
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}<br>
              ${orderData.shippingAddress.country}
            ` : orderData.shippingAddress}
          </p>
        </div>
        ` : ''}
        
        <p style="margin-top: 30px;">Nous vous remercions d'avoir choisi <strong>SHOPBATI.FR</strong>.</p>
        <p>Notre équipe reste à votre disposition pour toute question.</p>
        
        <p>Cordialement,<br>
        <strong>Service Client – SHOPBATI.FR</strong></p>
        
        <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-top: 3px solid #3b82f6;">
          <p style="margin: 0; text-align: center; color: #666;">
            <strong>SHOPBATI.FR</strong><br>
            Email: contact@shopbati.fr | Tél: +33 6 52 35 40 15
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
