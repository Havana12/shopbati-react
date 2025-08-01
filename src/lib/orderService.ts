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
    const response = await fetch('/api/send-email-gmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    return response.ok
  } catch (error) {
    return false
  }
}

// Sauvegarder la commande dans la base de données
export async function saveOrder(orderData: OrderData): Promise<boolean> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    return response.ok
  } catch (error) {
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
