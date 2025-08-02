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
      console.log('📧 Sending order confirmation to:', orderData.customerEmail)
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('📧 Order confirmation sent for order:', orderData.orderNumber)
      
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
      
      console.log('✅ Order created in database:', {
        orderId: result.$id,
        order_number: orderDocument.order_number,
        total_amount: orderDocument.total_amount,
        status: orderDocument.status,
        payment_status: orderDocument.payment_status,
        customer_email: orderDocument.customer_email
      })
      
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
      
      console.log('✅ Order status updated to delivered/paid after email sent:', orderId)
      
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
