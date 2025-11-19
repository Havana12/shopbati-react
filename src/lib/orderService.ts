import { CartItem } from '@/contexts/CartContext'

export interface OrderData {
  items: CartItem[]
  total: number
  customerEmail: string
  customerName?: string
  customerAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  timestamp: string
  orderId: string
  customerInfo?: {
    accountType: string
    firstName: string
    lastName: string
    raisonSociale: string
    siret: string
    tvaNumber: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
}

export interface CustomerInfo {
  email: string
  name?: string
  isAuthenticated: boolean
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  customerType?: 'particulier' | 'professionnel'
  professionalInfo?: {
    company?: string
    siret?: string
    vatNumber?: string
  }
}

// Générer un ID de commande unique
export function generateOrderId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `CMD-${timestamp}-${random.toUpperCase()}`
}

// Envoyer l'email de commande
export async function sendOrderEmail(orderData: OrderData): Promise<boolean> {
  try {
    // Utiliser la nouvelle API de confirmation de commande (SANS facture)
    const response = await fetch('/api/send-order-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending order email:', error)
    return false
  }
}

// Sauvegarder la commande dans la base de données
// NOTE: Cette fonction est obsolète. Utilisez AppwriteService.createOrder() directement à la place.
export async function saveOrder(orderData: OrderData): Promise<boolean> {
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { AppwriteService } = await import('./appwrite')
    const appwrite = AppwriteService.getInstance()
    
    // Prepare items as JSON string
    const itemsData = orderData.items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: (item as any).image || ''
    }))
    
    // Prepare addresses
    const shippingAddr = orderData.shippingAddress || orderData.customerAddress || {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    }
    
    const billingAddr = orderData.shippingAddress || orderData.customerAddress || {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    }
    
    const orderDataForDB = {
      order_number: orderData.orderId,
      user_id: '',  // Empty string for guest orders, will be filled if authenticated
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName || '',
      customer_phone: '',
      customer_type: orderData.customerInfo?.accountType || 'particulier',
      items: JSON.stringify(itemsData),  // Convert to JSON string
      subtotal: orderData.total,
      shipping_cost: 0,
      total_amount: orderData.total,
      shipping_address: JSON.stringify(shippingAddr),  // Convert to JSON string
      billing_address: JSON.stringify(billingAddr),    // Convert to JSON string
      payment_method: 'card',
      special_instructions: '',
      status: 'en_attente',
      invoice_sent: false,
      shipping_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await appwrite.createOrder(orderDataForDB)
    return true
  } catch (error) {
    console.error('Error saving order:', error)
    return false
  }
}

// Créer une commande complète
export async function createOrder(
  items: CartItem[],
  total: number,
  customerInfo: CustomerInfo
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const orderId = generateOrderId()
    
    const orderData: OrderData = {
      items,
      total,
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      customerAddress: customerInfo.address,
      timestamp: new Date().toISOString(),
      orderId,
    }

    // Sauvegarder la commande
    const orderSaved = await saveOrder(orderData)
    if (!orderSaved) {
      return { success: false, error: 'Erreur lors de la sauvegarde de la commande' }
    }

    // Envoyer l'email
    const emailSent = await sendOrderEmail(orderData)
    if (!emailSent) {
      return { success: false, error: 'Erreur lors de l\'envoi de l\'email de confirmation' }
    }

    return { success: true, orderId }
  } catch (error) {
    return { success: false, error: 'Erreur inattendue lors de la création de la commande' }
  }
}
