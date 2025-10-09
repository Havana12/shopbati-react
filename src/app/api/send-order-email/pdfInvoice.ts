import PDFDocument from 'pdfkit'
import { OrderData } from '@/lib/orderService'
import fs from 'fs'
import path from 'path'

export async function generateInvoice(order: OrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })

    // Logo
    const logoPath = path.join(process.cwd(), 'public', 'logo-shopbati.png')
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 120 })
    }
    doc.fontSize(20).text('Facture ShopBati', 200, 40)
    doc.moveDown()

    // Infos client
    doc.fontSize(12).text(`Client: ${order.customerName || ''}`)
    doc.text(`Email: ${order.customerEmail}`)
    doc.text(`Date: ${new Date(order.timestamp).toLocaleString('fr-FR')}`)
    doc.text(`Commande: ${order.orderId}`)
    doc.moveDown()

    // Tableau produits
    doc.fontSize(14).text('Produits:', { underline: true })
    doc.moveDown(0.5)
    order.items.forEach(item => {
      doc.fontSize(12).text(
        `${item.name} x${item.quantity} - €${item.price.toFixed(2)} / unité - Total: €${(item.price * item.quantity).toFixed(2)}`
      )
    })
    doc.moveDown()
    doc.fontSize(16).text(`Total à payer: €${order.total.toFixed(2)}`, { align: 'right' })
    doc.moveDown(2)
    doc.fontSize(10).fillColor('gray').text('Merci pour votre commande !', { align: 'center' })
    doc.end()
  })
}
