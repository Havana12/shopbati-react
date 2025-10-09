import { NextRequest, NextResponse } from 'next/server'
import { InvoiceGenerator } from '@/lib/invoiceGenerator'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    console.log('🧪 Génération de facture de test pour:', orderData.customerEmail)
    
    // Générer le PDF avec le logo
    const pdfBuffer = await InvoiceGenerator.generatePDFFromOrder(orderData)
    
    // Retourner le PDF en tant que réponse
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${orderData.orderId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la facture de test:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la facture' },
      { status: 500 }
    )
  }
}
