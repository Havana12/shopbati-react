import { NextRequest, NextResponse } from 'next/server'
import { OrderData } from '@/lib/orderService'
import EmailService from '@/lib/emailService'
import { InvoiceGenerator } from '@/lib/invoiceGenerator'
import { AppwriteService } from '@/lib/appwrite'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()

    // Save order to database using our EmailService
    const emailService = EmailService.getInstance()
    
    // Utiliser customerAddress ou shippingAddress selon ce qui est disponible
    const addressToUse = orderData.shippingAddress || orderData.customerAddress || {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    }
    
    const orderSaved = await emailService.createOrderInDatabase({
      orderNumber: orderData.orderId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName || '',
      customerPhone: '',
      items: orderData.items,
      subtotal: orderData.total, // Use the total for now since subtotal might not be separate
      shipping: 0, // Shipping is usually included in total for this system
      total: orderData.total,
      shippingAddress: addressToUse,
      billingAddress: addressToUse,
      paymentMethod: 'card',
      specialInstructions: ''
    })

    if (orderSaved.success) {
      // Send invoice directly using InvoiceGenerator and Resend
      let emailSent = false
      try {
        // Préparer les données pour le générateur de factures avec l'adresse correcte
        const invoiceData = {
          ...orderData,
          shippingAddress: addressToUse // S'assurer que l'adresse est disponible
        }
        
        // Generate PDF invoice
        const pdfBuffer = await InvoiceGenerator.generatePDFFromOrder(invoiceData)
        
        // Send email with Resend
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        const emailContent = generateEmailContent(orderData)
        
        const { error, data } = await resend.emails.send({
          from: 'SHOPBATI <onboarding@resend.dev>',
          to: [orderData.customerEmail],
          subject: `🧾 Facture SHOPBATI - Commande ${orderData.orderId}`,
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
          console.error('❌ Erreur envoi email Resend:', error)
        } else {
          emailSent = true
          console.log('✅ Invoice email sent successfully:', data?.id)
          
          // Update order status to delivered/paid after successful email
          if (orderSaved.orderId) {
            try {
              const appwrite = AppwriteService.getInstance()
              await appwrite.updateOrder(orderSaved.orderId, {
                status: 'livré',
                payment_status: 'payé',
                updated_at: new Date().toISOString(),
                invoice_sent_at: new Date().toISOString()
              })
              console.log('✅ Order status updated to livré/payé after email sent:', orderSaved.orderId)
            } catch (updateError) {
              console.error('❌ Error updating order status:', updateError)
              // Don't fail the order if status update fails
            }
          }
        }
      } catch (emailError) {
        console.error('❌ Erreur lors de la génération/envoi de facture:', emailError)
        // Don't fail the order if email fails
      }

      return NextResponse.json({ 
        success: true, 
        message: emailSent ? 'Commande sauvegardée et facture envoyée' : 'Commande sauvegardée (erreur envoi email)',
        orderId: orderData.orderId,
        emailSent
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: orderSaved.error || 'Erreur lors de la sauvegarde de la commande' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erreur API orders:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get orders from database (placeholder for admin functionality)
    const orders = await getOrdersFromDatabase()
    
    return NextResponse.json({ 
      success: true, 
      orders 
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 })
  }
}

async function getOrdersFromDatabase(): Promise<OrderData[]> {
  try {
    // Placeholder - replace with actual database query
    return []
  } catch (error) {
    return []
  }
}

function generateEmailContent(orderData: OrderData): string {
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
              Merci ${orderData.customerName || 'cher client'} ! 🎉
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
          
          <!-- Contact -->
          <div style="text-align: center; color: #666; font-size: 14px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #212121;">
              🤝 Une question ? Notre équipe est là pour vous !
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
              <span>📧 <a href="mailto:shopbati@gmail.com" style="color: #FFD700; text-decoration: none; font-weight: 600;">shopbati@gmail.com</a></span>
              <span>📞 <strong style="color: #FFD700;">+33 1 23 45 67 89</strong></span>
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