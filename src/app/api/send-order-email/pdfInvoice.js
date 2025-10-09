import jsPDF from 'jspdf'

export function generateInvoiceBuffer(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('Facture ShopBati', 105, 30, { align: 'center' })
      
      // Order details
      doc.setFontSize(12)
      doc.text(`Commande: ${orderData.orderId}`, 20, 50)
      doc.text(`Client: ${orderData.customerName || ''}`, 20, 60)
      doc.text(`Email: ${orderData.customerEmail}`, 20, 70)
      doc.text(`Date: ${new Date(orderData.timestamp).toLocaleString('fr-FR')}`, 20, 80)
      
      // Products header
      doc.setFontSize(14)
      doc.text('Produits:', 20, 100)
      
      // Products list
      doc.setFontSize(10)
      let yPosition = 115
      orderData.items.forEach(item => {
        const line = `${item.name} x${item.quantity} - €${item.price.toFixed(2)} (Total: €${(item.price * item.quantity).toFixed(2)})`
        doc.text(line, 20, yPosition)
        yPosition += 10
      })
      
      // Total
      doc.setFontSize(14)
      doc.text(`Total: €${orderData.total.toFixed(2)}`, 150, yPosition + 20)
      
      // Footer
      doc.setFontSize(10)
      doc.text('Merci pour votre commande !', 105, yPosition + 40, { align: 'center' })
      
      // Get PDF as buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      resolve(pdfBuffer)
      
    } catch (err) {
      reject(err)
    }
  })
}
