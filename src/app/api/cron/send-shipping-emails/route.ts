import { NextRequest, NextResponse } from 'next/server'
import { AppwriteService } from '@/lib/appwrite'
import { Resend } from 'resend'

/**
 * API Cron Job pour envoyer automatiquement les emails d'expédition
 * Après 3 jours pour les commandes payées
 * 
 * À configurer dans Vercel Cron Jobs:
 * - Fréquence: 0 9 * * * (tous les jours à 9h00)
 * - URL: /api/cron/send-shipping-emails
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation (optionnel mais recommandé)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appwrite = AppwriteService.getInstance()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Calculer la date il y a 3 jours
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoISO = threeDaysAgo.toISOString()

    // Trouver toutes les commandes payées depuis 3 jours et pas encore expédiées
    const orders = await appwrite.databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'orders',
      [
        appwrite.Query.equal('status', 'payé'),
        appwrite.Query.equal('shipping_sent', false),
        appwrite.Query.lessThanEqual('updated_at', threeDaysAgoISO)
      ]
    )

    const results = {
      total: orders.documents.length,
      sent: 0,
      failed: 0,
      errors: [] as any[]
    }

    // Envoyer un email pour chaque commande
    for (const order of orders.documents) {
      try {
        // Appeler l'API d'envoi d'email d'expédition
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-shipping-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.order_number,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            timestamp: order.created_at,
            items: order.items || [],
            total: order.total_amount || 0,
            shippingAddress: order.shipping_address
          })
        })

        if (emailResponse.ok) {
          results.sent++
        } else {
          results.failed++
          results.errors.push({
            orderId: order.order_number,
            error: await emailResponse.text()
          })
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          orderId: order.order_number,
          error: String(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron job terminé: ${results.sent} emails envoyés, ${results.failed} échecs`,
      results
    })

  } catch (error) {
    console.error('❌ Erreur cron job:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
