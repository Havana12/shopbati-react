import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/invoiceGenerator'
import { Client, Databases } from 'node-appwrite'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId

    // Setup Appwrite client
    const client = new Client()
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '')

    const databases = new Databases(client)

    // Fetch order details
    const order = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'orders',
      orderId
    )

    // Check if payment is confirmed (accept both French and English values)
    const validStatuses = ['paid', 'payé', 'confirmed', 'confirmé']
    if (!validStatuses.includes(order.payment_status)) {
      return NextResponse.json(
        { error: 'La facture n\'est disponible qu\'après confirmation du paiement' },
        { status: 403 }
      )
    }

    // Parse order items if they're stored as string
    let items = order.items
    if (typeof items === 'string') {
      items = JSON.parse(items)
    }

    // Fetch product details to get references for each item
    const itemsWithReferences = await Promise.all(
      items.map(async (item: any) => {
        try {
          // If item already has a non-empty reference, use it
          if (item.reference && item.reference.trim() !== '') {
            return item
          }
          
          // Try to fetch product by name to get the reference
          const { Query } = await import('node-appwrite')
          const products = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'products',
            [Query.equal('name', item.name), Query.limit(1)]
          )
          
          if (products.documents.length > 0) {
            return {
              ...item,
              reference: products.documents[0].reference || products.documents[0].sku || undefined
            }
          }
          
          return item
        } catch (error) {
          console.log('Could not fetch product reference:', error)
          return item
        }
      })
    )

    // Fetch user data to get address information
    let userData = null
    let shippingAddress = null
    let billingAddress = null
    
    // Try fetching user by user_id first
    if (order.user_id && order.user_id.trim() !== '') {
      try {
        userData = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          order.user_id
        )
      } catch (error) {
        // Could not fetch user by user_id
      }
    }
    
    // If no userData yet, try fetching by email
    if (!userData && order.customer_email) {
      try {
        const { Query } = await import('node-appwrite')
        const users = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          [Query.equal('email', order.customer_email)]
        )
        
        if (users.documents.length > 0) {
          userData = users.documents[0]
        }
      } catch (error) {
        // Could not fetch user by email
      }
    }
    
    // Get address from user data
    if (userData) {
      if (userData.address || userData.city) {
        shippingAddress = {
          street: userData.address || '',
          city: userData.city || '',
          postalCode: userData.postalCode || userData.postal_code || '',
          country: userData.country || 'France'
        }
        billingAddress = shippingAddress
      }
    }
    
    // Override with order-specific addresses if they exist
    if (order.shipping_address) {
      const parsed = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address)
        : order.shipping_address
      
      if (parsed.street || parsed.city) {
        shippingAddress = parsed
      }
    }

    if (order.billing_address) {
      const parsed = typeof order.billing_address === 'string'
        ? JSON.parse(order.billing_address)
        : order.billing_address
      
      if (parsed.street || parsed.city) {
        billingAddress = parsed
      }
    }

    // Prepare invoice data EXACTLY like admin panel does
    const invoiceData = {
      orderId: order.order_number || orderId,
      customerName: userData?.full_name || order.customer_name || 'Client',
      customerEmail: userData?.email || order.customer_email || '',
      timestamp: order.created_at || new Date().toISOString(),
      items: itemsWithReferences.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        reference: item.reference || item.sku || undefined,
        $id: item.$id || item.productId || undefined
      })),
      total: order.total_amount || 0,
      shippingAddress: shippingAddress,
      // Include customerInfo with address from users table - EXACTLY like admin panel
      customerInfo: userData ? {
        accountType: userData.account_type || 'individual',
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        raisonSociale: userData.raison_sociale || '',
        siret: userData.siret || '',
        tvaNumber: userData.tva_number || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        country: userData.country || 'France'
      } : undefined
    }

    // Generate PDF using the SAME function as email - this returns Buffer directly from generateInvoiceWithQRCode
    const { InputFile } = await import('node-appwrite/file')
    const invoiceResult = await import('@/lib/invoiceGenerator').then(m => m.generateInvoiceWithQRCode(invoiceData))
    const pdfBuffer = invoiceResult.pdfBuffer

    // Return PDF as response
    const orderNumber = order.order_number || orderId.substring(0, 8).toUpperCase()
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Facture-${orderNumber}.pdf"`,
      },
    })

  } catch (error: any) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la facture', details: error.message },
      { status: 500 }
    )
  }
}
