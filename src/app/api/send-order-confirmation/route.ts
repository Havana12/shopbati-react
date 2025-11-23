import { NextRequest, NextResponse } from 'next/server'
import { OrderData } from '@/lib/orderService'
import { Resend } from 'resend'
import { generateInvoicePDF } from '@/lib/invoiceGenerator'
import fs from 'fs'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json()
    
    // If shippingAddress is empty, fetch from users table
    if (!orderData.shippingAddress?.street && orderData.customerEmail) {
      try {
        const { Client, Databases, Query } = await import('node-appwrite')
        const client = new Client()
        client
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
          .setKey(process.env.APPWRITE_API_KEY || '')
        
        const databases = new Databases(client)
        const users = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          [Query.equal('email', orderData.customerEmail)]
        )
        
        if (users.documents.length > 0) {
          const user = users.documents[0] as any
          orderData.shippingAddress = {
            street: user.address || '',
            city: user.city || '',
            postalCode: user.postalCode || user.postal_code || '',
            country: user.country || 'France'
          }
          console.log('✅ Fetched address from users table:', orderData.shippingAddress)
        }
      } catch (error) {
        console.error('❌ Error fetching user address:', error)
      }
    }
    
    // Debug: Log the address data being used
    console.log('🏠 Address data in order confirmation:', {
      shippingAddress: orderData.shippingAddress,
      customerInfoAddress: orderData.customerInfo?.address,
      customerInfoCity: orderData.customerInfo?.city
    })
    
    const emailContent = generateOrderConfirmationEmail(orderData)
    
    // Generate Bon de Commande PDF (same as invoice but named differently)
    const bonDeCommandePDF = await generateInvoicePDF(orderData, 'Bon de Commande')
    
    // Read RIB PDF file
    const ribPath = path.join(process.cwd(), 'public', 'RIB', 'RIB.pdf')
    const ribBuffer = fs.readFileSync(ribPath)
    const ribBase64 = ribBuffer.toString('base64')
    
    const result = await resend.emails.send({
      from: 'SHOPBATI <contact@shopbati.fr>',
      to: [orderData.customerEmail],
      subject: `Confirmation de votre Bon de Commande – ${orderData.orderId}`,
      html: emailContent,
      attachments: [
        {
          filename: `Bon_de_Commande_${orderData.orderId}.pdf`,
          content: bonDeCommandePDF
        },
        {
          filename: 'RIB_SHOPBATI.pdf',
          content: ribBase64
        }
      ]
    })
    
    if (result.error) {
      console.error('❌ Email send failed:', result.error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email', 
        error: result.error 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Email de confirmation envoyé à ${orderData.customerEmail}`
    })
    
  } catch (error) {
    console.error('❌ Erreur serveur:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur général' 
    }, { status: 500 })
  }
}

function generateOrderConfirmationEmail(orderData: OrderData): string {
  // Helper to escape HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
  
  // Parse items if they're a string
  const items = typeof orderData.items === 'string' 
    ? JSON.parse(orderData.items) 
    : orderData.items
    
  const itemsHtml = items.map((item: any) => {
    // Sanitize the product name (remove tabs, extra whitespace)
    const sanitizedName = escapeHtml((item.name || '').replace(/[\t\n\r]+/g, ' ').trim())
    const price = Number(item.price) || 0
    const quantity = Number(item.quantity) || 0
    
    return `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${sanitizedName}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${price.toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${(price * quantity).toFixed(2)}</td>
    </tr>
  `}).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2 style="color: #2c3e50;">Objet : Confirmation de votre Bon de Commande – ${orderData.orderId}</h2>
        
        <p>Madame, Monsieur,</p>
        
        <p>Nous vous remercions pour votre commande effectuée sur <strong>SHOPBATI.FR</strong>.</p>
        
        <p>Vous trouverez en pièces jointes :</p>
        <ul>
          <li>Votre Bon de Commande</li>
          <li>Le RIB de notre société destiné au règlement par virement bancaire</li>
        </ul>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Merci de noter que ce document n'a pas valeur de facture.</strong></p>
          <p style="margin: 10px 0 0 0;">La facture définitive sera émise exclusivement après réception du paiement.</p>
        </div>
        
        <h3 style="color: #c41e3a;">Validité du Bon de Commande</h3>
        
        <p>Votre Bon de Commande bénéficie d'une validité de <strong>3 jours</strong>.</p>
        
        <p>À défaut de réception du virement dans ce délai :</p>
        <ul>
          <li>→ la commande sera automatiquement annulée</li>
          <li>→ les articles seront remis en disponibilité sur notre site</li>
        </ul>
        
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
          </ul>
        </div>
        
        <p style="margin-top: 30px;">Nous restons à votre disposition pour toute information complémentaire.</p>
        
        <p>Cordialement,<br>
        <strong>Service Client – SHOPBATI.FR</strong></p>
        
        <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-top: 3px solid #FFD700;">
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
