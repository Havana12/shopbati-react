import { NextRequest, NextResponse } from 'next/server'
import { generateInvoiceWithQRCode, type OrderData } from '@/lib/invoiceGenerator'

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API /api/invoice-qrcode appelée')
    
    // Parse request body
    const orderData: OrderData = await request.json()
    
    console.log('📋 Données de commande reçues:', {
      orderId: orderData.orderId,
      customerEmail: orderData.customerEmail,
      itemsCount: orderData.items?.length,
      total: orderData.total
    })
    
    // Validate required fields
    if (!orderData.customerEmail) {
      return NextResponse.json(
        { error: 'Email du client requis' },
        { status: 400 }
      )
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'La commande doit contenir au moins un article' },
        { status: 400 }
      )
    }
    
    if (!orderData.total || orderData.total <= 0) {
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      )
    }
    
    // Generate invoice with QR code
    console.log('🔧 Génération de la facture avec QR code...')
    const result = await generateInvoiceWithQRCode(orderData)
    
    console.log('✅ Facture générée avec succès:', {
      fileId: result.fileId,
      invoiceUrl: result.invoiceUrl
    })
    
    // Return the result (without the PDF buffer to avoid large responses)
    return NextResponse.json({
      success: true,
      invoiceUrl: result.invoiceUrl,
      fileId: result.fileId,
      qrCodeDataUrl: result.qrCodeDataUrl,
      message: 'Facture générée avec succès'
    })
    
  } catch (error: any) {
    console.error('❌ Erreur API /api/invoice-qrcode:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération de la facture',
        details: error.message
      },
      { status: 500 }
    )
  }
}
