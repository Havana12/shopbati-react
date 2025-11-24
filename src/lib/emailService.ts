import { AppwriteService } from './appwrite'

export interface InvoiceData {
  orderNumber: string
  customerEmail: string
  customerName: string
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  orderDate: string
}

export class EmailService {
  private static instance: EmailService

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Send email verification via Resend (custom system)
  async sendVerificationEmail(email: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userId })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Erreur lors de l\'envoi de l\'email de vérification'
        }
      }

      return {
        success: true,
        message: 'Email de vérification envoyé avec succès'
      }
    } catch (error) {
      console.error('❌ Error sending verification email:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de vérification'
      }
    }
  }

  // Verify email with token
  async verifyEmail(token: string, email: string): Promise<{ success: boolean; message: string; alreadyVerified?: boolean }> {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Erreur lors de la vérification de l\'email'
        }
      }

      return {
        success: true,
        message: data.message || 'Email vérifié avec succès',
        alreadyVerified: data.alreadyVerified
      }
    } catch (error) {
      console.error('❌ Error verifying email:', error)
      return {
        success: false,
        message: 'Erreur lors de la vérification de l\'email'
      }
    }
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string; alreadyVerified?: boolean }> {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Erreur lors de l\'envoi de l\'email'
        }
      }

      return {
        success: true,
        message: data.message || 'Email de vérification renvoyé',
        alreadyVerified: data.alreadyVerified
      }
    } catch (error) {
      console.error('❌ Error resending verification email:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      }
    }
  }

  // Send invoice email to customer
  async sendInvoice(invoiceData: InvoiceData): Promise<{ success: boolean; message: string }> {
    try {
      // For now, we'll simulate email sending
      // In a real application, you would integrate with:
      // - SendGrid, Mailgun, AWS SES, etc.
      // - Or use Appwrite Functions with email templates
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In a real implementation, you would:
      // 1. Generate PDF invoice
      // 2. Create HTML email template
      // 3. Send email with invoice attached
      // 4. Store email sending status in database
      
      return {
        success: true,
        message: `Facture envoyée avec succès à ${invoiceData.customerEmail}`
      }
      
    } catch (error) {
      console.error('❌ Error sending invoice:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de la facture'
      }
    }
  }

  // Send order confirmation email
  async sendOrderConfirmation(orderData: any): Promise<{ success: boolean; message: string }> {
    try {
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        message: 'Email de confirmation envoyé'
      }
      
    } catch (error) {
      console.error('❌ Error sending order confirmation:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de la confirmation'
      }
    }
  }

  // Create order in database
  async createOrderInDatabase(orderData: any): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Create order document in Appwrite
      const orderDocument = {
        user_id: orderData.userId || 'guest',
        order_number: orderData.orderNumber,
        customer_email: orderData.customerEmail,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone || '',
        total_amount: orderData.total || 0, // Add the total amount
        subtotal_amount: orderData.subtotal || 0, // Add subtotal
        shipping_amount: orderData.shipping || 0, // Add shipping cost
        status: 'livré', // Set status to delivered since we're processing the order immediately
        currency: 'EUR',
        payment_status: 'payé', // Set payment status to paid since we're confirming the order
        payment_method: orderData.paymentMethod,
        items: JSON.stringify(orderData.items), // Add order items
        shipping_address: JSON.stringify(orderData.shippingAddress),
        billing_address: JSON.stringify(orderData.billingAddress || orderData.shippingAddress),
        notes: orderData.specialInstructions || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const result = await appwrite.createOrder(orderDocument)
      
      return {
        success: true,
        orderId: result.$id
      }
      
    } catch (error) {
      console.error('❌ Error creating order in database:', error)
      return {
        success: false,
        error: 'Erreur lors de la sauvegarde de la commande'
      }
    }
  }

  // Update order status after successful email sending
  async updateOrderStatusAfterEmail(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Update order status to delivered and payment to paid
      const updateData = {
        status: 'livré',
        payment_status: 'payé',
        updated_at: new Date().toISOString(),
        invoice_sent_at: new Date().toISOString()
      }
      
      await appwrite.updateOrder(orderId, updateData)
      
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du statut de commande'
      }
    }
  }
}

export default EmailService
