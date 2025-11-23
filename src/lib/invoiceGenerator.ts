import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { Client, Databases, Storage, ID } from 'node-appwrite'

interface OrderData {
  orderId: string
  customerName?: string
  customerEmail: string
  timestamp: string
  items: Array<{
    name: string
    quantity: number
    price: number
    reference?: string  // Product reference from database
    $id?: string        // Product ID from database
  }>
  total: number
  isProfessional?: boolean
  customerInfo?: {
    accountType?: string
    firstName?: string
    lastName?: string
    raisonSociale?: string
    siret?: string
    tvaNumber?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

interface InvoiceWithQR {
  pdfBuffer: Buffer
  invoiceUrl: string
  fileId: string
  qrCodeDataUrl: string
}

export class InvoiceGenerator {
  // Bucket ID for invoices storage
  private static readonly INVOICES_BUCKET_ID = '691b2d0200137a0256b7'
  
  // Create server-side Appwrite client with API key
  private static getServerClient() {
    const client = new Client()
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '')
    
    return client
  }
  
  private static getStorage() {
    return new Storage(this.getServerClient())
  }
  
  /**
   * Generate invoice with QR code and upload to Appwrite Storage
   * The QR code on the invoice links to the stored invoice URL
   */
  static async generateInvoiceWithQR(orderData: OrderData): Promise<InvoiceWithQR> {
    try {
      // Import InputFile once for the entire function
      const { InputFile } = await import('node-appwrite/file')
      
      // 1. Generate invoice PDF first (without QR)
      const tempInvoiceBuffer = await this.generatePDFFromOrder(orderData)
      
      // 2. Upload to Appwrite Storage
      const invoiceNumber = this.generateInvoiceNumber()
      const fileName = `facture-${invoiceNumber}-${Date.now()}.pdf`
      
      // Upload file to Appwrite using server-side SDK with Buffer directly
      const storage = this.getStorage()
      const fileId = ID.unique()
      
      // Create InputFile from Buffer for server-side upload
      const inputFile = InputFile.fromBuffer(tempInvoiceBuffer, fileName)
      
      const uploadedFile = await storage.createFile(
        this.INVOICES_BUCKET_ID,
        fileId,
        inputFile
      )
      
      // 3. Get the file URL
      const client = this.getServerClient()
      const invoiceUrl = `${client.config.endpoint}/storage/buckets/${this.INVOICES_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${client.config.project}`
      
      // 4. Generate QR code with the invoice URL
      const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#212121',
          light: '#FFFFFF'
        }
      })
      
      // 5. Generate final invoice PDF with QR code
      const finalInvoiceBuffer = await this.generatePDFFromOrderWithQR(
        orderData,
        qrCodeDataUrl,
        invoiceNumber
      )
      
      // 6. Update the file in storage with the final version (with QR)
      await storage.deleteFile(this.INVOICES_BUCKET_ID, uploadedFile.$id)
      
      // Create final InputFile from Buffer for server-side upload
      const finalInputFile = InputFile.fromBuffer(finalInvoiceBuffer, fileName)
      
      const finalUploadedFile = await storage.createFile(
        this.INVOICES_BUCKET_ID,
        uploadedFile.$id, // Use same ID
        finalInputFile
      )
      
      return {
        pdfBuffer: finalInvoiceBuffer,
        invoiceUrl,
        fileId: finalUploadedFile.$id,
        qrCodeDataUrl
      }
      
    } catch (error) {
      console.error('❌ Erreur génération facture avec QR:', error)
      throw error
    }
  }

  /**
   * Generate PDF with QR code embedded
   */
  private static async generatePDFFromOrderWithQR(
    orderData: OrderData,
    qrCodeDataUrl: string,
    invoiceNumber: string
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = 210
        const pageHeight = 297
        const margin = 10
        const contentWidth = pageWidth - 2 * margin
        
        let yPosition = margin

        // Couleurs SHOPBATI
        const yellowColor: [number, number, number] = [255, 215, 0]
        const darkGray: [number, number, number] = [33, 33, 33]
        const lightGray: [number, number, number] = [245, 245, 245]

        // 1. BANNIÈRE SUPÉRIEURE JAUNE
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(0, 0, pageWidth, 12, 'F')
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('BRICOLAGE • CONSTRUCTION • DÉCORATION • JARDINAGE', pageWidth/2, 7, { align: 'center' })

        yPosition = 18

        // 2. SECTION LOGO ET QR CODE (QR en haut à droite)
        // Logo à gauche
        try {
          let logoBase64: string | null = null
          
          if (typeof window === 'undefined') {
            try {
              const fs = require('fs')
              const path = require('path')
              const logoPath = path.join(process.cwd(), 'public', 'images', 'logo_shopbat.jpg')
              
              if (fs.existsSync(logoPath)) {
                const imageBuffer = fs.readFileSync(logoPath)
                logoBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              }
            } catch (fsError) {
            }
          } else {
            try {
              const response = await fetch('/images/logo_shopbat.jpg')
              if (response.ok) {
                const blob = await response.blob()
                logoBase64 = await new Promise((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })
              }
            } catch (fetchError) {
            }
          }
          
          if (logoBase64) {
            doc.addImage(logoBase64, 'JPEG', 5, yPosition - 15, 45, 14)
          } else {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
            doc.text('SHOPBATI', margin, yPosition + 15)
          }
        } catch (error) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          doc.text('SHOPBATI', margin, yPosition + 15)
        }

        // QR CODE EN HAUT À DROITE avec encadré
        const qrSize = 25
        const qrX = pageWidth - margin - qrSize - 5
        const qrY = yPosition - 15
        
        // Encadré pour le QR code
        doc.setDrawColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.setLineWidth(0.5)
        doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4)
        
        // QR Code
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
        
        // Texte sous le QR code
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('Scanner pour', qrX + qrSize/2, qrY + qrSize + 3, { align: 'center' })
        doc.text('voir la facture', qrX + qrSize/2, qrY + qrSize + 6, { align: 'center' })

        // Titre facture au centre
        const ticketNumber = this.generateTicketNumber(orderData)
        
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text(`FACTURE N° ${invoiceNumber.replace('SB-', '')} DUPLICATA`, pageWidth/2, yPosition + 8, { align: 'center' })
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Ticket ${ticketNumber} / Date de vente : ${this.formatDate(orderData.timestamp)}`, pageWidth/2, yPosition + 15, { align: 'center' })
        doc.text(`Exemplaire client / Date d'émission : ${this.formatDate(orderData.timestamp)}`, pageWidth/2, yPosition + 19, { align: 'center' })

        yPosition += 28
        yPosition += 10

        // 4. SECTION INFORMATIONS (2 colonnes)
        const infoHeight = 35
        const leftColWidth = contentWidth * 0.48
        const rightColWidth = contentWidth * 0.48
        const spacing = contentWidth * 0.04

        // Colonne gauche - SHOPBATI
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
        doc.rect(margin, yPosition, leftColWidth, infoHeight, 'F')
        doc.setDrawColor(100, 100, 100)
        doc.rect(margin, yPosition, leftColWidth, infoHeight)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('SHOPBATI', margin + 3, yPosition + 8)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('6 Rue des Bateliers', margin + 3, yPosition + 15)
        doc.text('92110 CLICHY FRANCE', margin + 3, yPosition + 20)
        doc.text('Tél : +33 6 52 35 40 15', margin + 3, yPosition + 25)
        doc.text('Email: contact@shopbati.fr', margin + 3, yPosition + 30)

        // Colonne droite - Client
        const rightColX = margin + leftColWidth + spacing
        doc.setDrawColor(100, 100, 100)
        doc.rect(rightColX, yPosition, rightColWidth, infoHeight)

        // Get customer name - prioritize customerInfo fields, then customerName
        let customerName = 'Client'
        if (orderData.customerInfo?.accountType === 'professional' && orderData.customerInfo.raisonSociale) {
          customerName = orderData.customerInfo.raisonSociale
        } else if (orderData.customerInfo?.firstName && orderData.customerInfo?.lastName) {
          customerName = `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`
        } else if (orderData.customerName) {
          customerName = orderData.customerName
        }
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(customerName, rightColX + 3, yPosition + 8)
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        // Get customer address - prioritize customerInfo, then shippingAddress
        if (orderData.customerInfo?.address && orderData.customerInfo?.city) {
          doc.text(orderData.customerInfo.address, rightColX + 3, yPosition + 15)
          doc.text(`${orderData.customerInfo.postalCode} ${orderData.customerInfo.city}`, rightColX + 3, yPosition + 20)
          doc.text(orderData.customerInfo.country || 'France', rightColX + 3, yPosition + 25)
        } else if (orderData.shippingAddress && orderData.shippingAddress.street) {
          doc.text(orderData.shippingAddress.street, rightColX + 3, yPosition + 15)
          doc.text(`${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}`, rightColX + 3, yPosition + 20)
          doc.text(orderData.shippingAddress.country || 'France', rightColX + 3, yPosition + 25)
        } else {
          doc.text('Adresse non fournie', rightColX + 3, yPosition + 15)
        }
        
        const isProfessional = orderData.isProfessional || orderData.customerInfo?.accountType === 'professional'
        if (isProfessional) {
          doc.text('SIRET : 123 456 789 00012', rightColX + 3, yPosition + 30)
        }

        yPosition += infoHeight + 10

        // 6. TABLEAU
        const tableStartY = yPosition
        const headerHeight = 15
        const baseRowHeight = 12

        // En-tête tableau
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(margin, yPosition, contentWidth, headerHeight, 'F')
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(margin, yPosition, contentWidth, headerHeight)

        const colN = margin + 2
        const colRef = margin + 15
        const colDesignation = margin + 42
        const colQuantite = margin + 115
        const colPrixUnit = margin + 135
        const colTotal = margin + 160

        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
        doc.text('N°', colN + 5, yPosition + 8, { align: 'center', charSpace: 0 })
        doc.text('Réf', colRef + 12, yPosition + 4, { align: 'center', charSpace: 0 })
        doc.text('article', colRef + 12, yPosition + 9, { align: 'center', charSpace: 0 })
        doc.text('Désignation article', colDesignation + 35, yPosition + 8, { align: 'center', charSpace: 0 })
        doc.text('Quantité', colQuantite + 9, yPosition + 8, { align: 'center', charSpace: 0 })
        doc.text('Prix unit.', colPrixUnit + 11, yPosition + 4, { align: 'center', charSpace: 0 })
        doc.text('TTC', colPrixUnit + 11, yPosition + 9, { align: 'center', charSpace: 0 })
        doc.text('Total TTC', colTotal + 11, yPosition + 8, { align: 'center', charSpace: 0 })

        yPosition += headerHeight

        // Lignes des articles
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        
        orderData.items.forEach((item, index) => {
          // Calculate dynamic row height based on product name length
          const productName = item.name.toUpperCase()
          const maxWidth = 70
          doc.setFontSize(7)
          const lines = doc.splitTextToSize(productName, maxWidth)
          const rowHeight = Math.max(baseRowHeight, lines.length * 4 + 4) // 4mm per line + padding
          
          doc.setDrawColor(150, 150, 150)
          doc.rect(margin, yPosition, contentWidth, rowHeight)

          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          
          // Calculate vertical center for single-line items
          const vCenter = yPosition + (rowHeight / 2) + 2
          
          doc.setFontSize(7)
          doc.text((index + 1).toString(), colN + 5, vCenter, { align: 'center', charSpace: 0 })
          
          const productRef = item.reference || `SB${(index + 1).toString().padStart(6, '0')}`
          doc.text(productRef, colRef + 12, vCenter, { align: 'center', charSpace: 0 })
          
          // Product name with wrapping
          doc.text(lines, colDesignation + 2, yPosition + 6, { charSpace: 0 })
          
          doc.text(item.quantity.toString(), colQuantite + 9, vCenter, { align: 'center', charSpace: 0 })
          doc.text(this.formatNumber(item.price) + ' €', colPrixUnit + 11, vCenter, { align: 'center', charSpace: 0 })
          doc.text(this.formatNumber(item.price * item.quantity) + ' €', colTotal + 11, vCenter, { align: 'center', charSpace: 0 })
          
          yPosition += rowHeight
        })

        // Lignes verticales
        const verticalLines = [colRef - 1, colDesignation - 1, colQuantite - 1, colPrixUnit - 1, colTotal - 1]
        verticalLines.forEach(x => {
          doc.line(x, tableStartY, x, yPosition)
        })

        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(margin, tableStartY, contentWidth, yPosition - tableStartY)

        yPosition += 10

        // Section totaux
        const rightSectionX = pageWidth - margin - 80
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        const sousTotal = orderData.total / 1.20
        const tauxTVA = 20.00
        const montantTVA = orderData.total - sousTotal
        
        doc.text('Sous total :', rightSectionX, yPosition + 8)
        doc.text(this.formatNumber(sousTotal) + ' €', rightSectionX + 60, yPosition + 8, { align: 'right', charSpace: 0 })
        
        doc.text(`Taux de TVA : ${tauxTVA.toLocaleString('fr-FR')}%`, rightSectionX, yPosition + 15)
        doc.text(this.formatNumber(montantTVA) + ' €', rightSectionX + 60, yPosition + 15, { align: 'right', charSpace: 0 })
        
        doc.text('Total TTC :', rightSectionX, yPosition + 22)
        doc.text(this.formatNumber(orderData.total) + ' €', rightSectionX + 60, yPosition + 22, { align: 'right', charSpace: 0 })
        
        // SOMME FINALE
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(rightSectionX - 5, yPosition + 30, 85, 12, 'F')
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(rightSectionX - 5, yPosition + 30, 85, 12)
        
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('Somme finale à payer :', rightSectionX, yPosition + 38)
        doc.text(this.formatNumber(orderData.total) + ' €', rightSectionX + 60, yPosition + 38, { align: 'right', charSpace: 0 })

        yPosition += 60

        // FOOTER
        const footerY = pageHeight - 5
        
        doc.setDrawColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.setLineWidth(1)
        doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20)
        
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
        const footerLine1 = 'SHOPBATI.FR – SASU au capital de 2 000€ – RCS Nanterre 993 797 075'
        doc.text(footerLine1, pageWidth/2, footerY - 15, { align: 'center' })
        
        const footerLine2 = 'SIREN : 993 797 075 • TVA : FR13993797075'
        doc.text(footerLine2, pageWidth/2, footerY - 11, { align: 'center' })
        
        const footerLine3 = 'contact@shopbati.fr • www.shopbati.fr • Tél : +33 6 52 35 40 15'
        doc.text(footerLine3, pageWidth/2, footerY - 7, { align: 'center' })
        
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(6.5)
        const footerLine4 = 'Achat & vente de matériels de bâtiment – Intermédiaire en matériaux de construction'
        doc.text(footerLine4, pageWidth/2, footerY - 2, { align: 'center' })

        // Convertir en Buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        resolve(pdfBuffer)

      } catch (error) {
        reject(error)
      }
    })
  }

  private static generateInvoiceNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `SB-${year}${month}${day}-${random}`
  }

  private static generateTicketNumber(orderData: OrderData): string {
    const date = new Date(orderData.timestamp)
    const year = date.getFullYear().toString().slice(-2) // Last 2 digits of year
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    // Extract numeric part from orderId or use timestamp
    let orderNumeric = ''
    if (orderData.orderId) {
      // Extract numbers from order ID
      const numbers = orderData.orderId.replace(/\D/g, '')
      orderNumeric = numbers.slice(-6).padStart(6, '0') // Last 6 digits, padded
    } else {
      // Use timestamp as fallback
      orderNumeric = date.getTime().toString().slice(-6)
    }
    
    // Format: XXX-XXXXXX-XXX-XXXX (similar to original but dynamic)
    // Example: 063-240802-125-1234 (store-date-time-order)
    const storeCode = '063' // Could be made configurable
    const dateCode = `${year}${month}${day}`
    const timeCode = `${hours}${minutes}`.slice(-3).padStart(3, '0')
    
    return `${storeCode}-${orderNumeric}-${timeCode}-${dateCode}`
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  private static formatNumber(amount: number): string {
    // Manual formatting to avoid jsPDF rendering issues with Intl.NumberFormat
    const fixed = amount.toFixed(2)
    const parts = fixed.split('.')
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${integerPart},${parts[1]}`
  }

  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  static async generatePDFFromOrder(orderData: OrderData, documentType: string = 'FACTURE'): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = 210
        const pageHeight = 297
        const margin = 10
        const contentWidth = pageWidth - 2 * margin
        
        let yPosition = margin

        // Couleurs SHOPBATI (même couleurs, structure Leroy Merlin)
        const yellowColor: [number, number, number] = [255, 215, 0] // #FFD700
        const darkGray: [number, number, number] = [33, 33, 33] // #212121
        const lightGray: [number, number, number] = [245, 245, 245] // #F5F5F5

        // ===== STRUCTURE LEROY MERLIN EXACTE =====
        
        // 1. BANNIÈRE SUPÉRIEURE JAUNE (comme Leroy Merlin mais jaune)
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(0, 0, pageWidth, 12, 'F')
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('BRICOLAGE • CONSTRUCTION • DÉCORATION • JARDINAGE', pageWidth/2, 7, { align: 'center' })

        yPosition = 18

        // 2. SECTION LOGO ET TITRE FACTURE
        // Logo à gauche - position plus basse et taille proportionnelle
        try {
          let logoBase64: string | null = null
          
          // Essayer de charger le logo
          if (typeof window === 'undefined') {
            // Server side - Node.js
            try {
              const fs = require('fs')
              const path = require('path')
              const logoPath = path.join(process.cwd(), 'public', 'images', 'logo_shopbat.jpg')
              
              if (fs.existsSync(logoPath)) {
                const imageBuffer = fs.readFileSync(logoPath)
                logoBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              }
            } catch (fsError) {
            }
          } else {
            // Client side - essayer de charger via fetch
            try {
              const response = await fetch('/images/logo_shopbat.jpg')
              if (response.ok) {
                const blob = await response.blob()
                logoBase64 = await new Promise((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })
              }
            } catch (fetchError) {
            }
          }
          
          if (logoBase64) {
            // Logo réel avec les bonnes proportions comme dans l'image
            // Format horizontal avec icône + texte SHOPBATI.FR + tagline
            // Positionné tout en haut à gauche, encore plus haut
            doc.addImage(logoBase64, 'JPEG', 5, yPosition - 15, 45, 14)
          } else {
            // Fallback - texte simple 
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
            doc.text('SHOPBATI', margin, yPosition + 15)
          }
        } catch (error) {
          // Fallback simple
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          doc.text('SHOPBATI', margin, yPosition + 15)
        }

        // Titre document au centre
        const invoiceNumber = this.generateInvoiceNumber()
        const ticketNumber = this.generateTicketNumber(orderData)
        
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        const documentTitle = documentType === 'Bon de Commande' ? `BON DE COMMANDE N° ${invoiceNumber.replace('SB-', '')}` : `FACTURE N° ${invoiceNumber.replace('SB-', '')} DUPLICATA`
        doc.text(documentTitle, pageWidth/2, yPosition + 8, { align: 'center' })
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Ticket ${ticketNumber} / Date de vente : ${this.formatDate(orderData.timestamp)}`, pageWidth/2, yPosition + 15, { align: 'center' })
        doc.text(`Exemplaire client / Date d'émission : ${this.formatDate(orderData.timestamp)}`, pageWidth/2, yPosition + 19, { align: 'center' })

        yPosition += 28

        yPosition += 10

        // 4. SECTION INFORMATIONS (2 colonnes comme Leroy Merlin)
        const infoHeight = 35
        const leftColWidth = contentWidth * 0.48
        const rightColWidth = contentWidth * 0.48
        const spacing = contentWidth * 0.04

        // Colonne gauche - SHOPBATI (fond gris comme Leroy Merlin)
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
        doc.rect(margin, yPosition, leftColWidth, infoHeight, 'F')
        doc.setDrawColor(100, 100, 100)
        doc.rect(margin, yPosition, leftColWidth, infoHeight)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('SHOPBATI', margin + 3, yPosition + 8)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('6 Rue des Bateliers', margin + 3, yPosition + 15)
        doc.text('92110 CLICHY FRANCE', margin + 3, yPosition + 20)
        doc.text('Tél : +33 6 52 35 40 15', margin + 3, yPosition + 25)
        doc.text('Email: contact@shopbati.fr', margin + 3, yPosition + 30)

        // Colonne droite - Client
        const rightColX = margin + leftColWidth + spacing
        doc.setDrawColor(100, 100, 100)
        doc.rect(rightColX, yPosition, rightColWidth, infoHeight)

        // Get customer name - prioritize customerInfo fields, then customerName
        let customerName = 'Client'
        if (orderData.customerInfo?.accountType === 'professional' && orderData.customerInfo.raisonSociale) {
          customerName = orderData.customerInfo.raisonSociale
        } else if (orderData.customerInfo?.firstName && orderData.customerInfo?.lastName) {
          customerName = `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`
        } else if (orderData.customerName) {
          customerName = orderData.customerName
        }
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(customerName, rightColX + 3, yPosition + 8)
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        // Get customer address - prioritize shippingAddress (livraison), then customerInfo (facturation)
        if (orderData.shippingAddress && orderData.shippingAddress.street) {
          doc.text(orderData.shippingAddress.street, rightColX + 3, yPosition + 15)
          doc.text(`${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}`, rightColX + 3, yPosition + 20)
          doc.text(orderData.shippingAddress.country || 'France', rightColX + 3, yPosition + 25)
        } else if (orderData.customerInfo?.address && orderData.customerInfo?.city) {
          doc.text(orderData.customerInfo.address, rightColX + 3, yPosition + 15)
          doc.text(`${orderData.customerInfo.postalCode} ${orderData.customerInfo.city}`, rightColX + 3, yPosition + 20)
          doc.text(orderData.customerInfo.country || 'France', rightColX + 3, yPosition + 25)
        } else {
          doc.text('Adresse non fournie', rightColX + 3, yPosition + 15)
        }
        
        // SIRET uniquement pour les factures professionnelles
        // Vérifier via isProfessional ou customerInfo.accountType
        const isProfessional = orderData.isProfessional || orderData.customerInfo?.accountType === 'professional'
        if (isProfessional) {
          doc.text('SIRET : 123 456 789 00012', rightColX + 3, yPosition + 30)
        }

        yPosition += infoHeight + 10

        // 6. TABLEAU EXACT STYLE LEROY MERLIN
        const tableStartY = yPosition
        const headerHeight = 15
        const baseRowHeight = 12

        // En-tête tableau avec fond jaune (comme Leroy Merlin mais jaune)
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(margin, yPosition, contentWidth, headerHeight, 'F')
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(margin, yPosition, contentWidth, headerHeight)

        // Colonnes compactes pour tenir entièrement dans la page
        const colN = margin + 2                    // N° (10mm)
        const colRef = margin + 15                 // Réf article (25mm)  
        const colDesignation = margin + 42         // Désignation (70mm)
        const colQuantite = margin + 115           // Quantité (18mm)
        const colPrixUnit = margin + 135           // Prix unit. TTC (22mm)
        const colTotal = margin + 160              // Total TTC (22mm)

        // Textes d'en-tête compacts pour tenir dans la page
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
        doc.text('N°', colN + 5, yPosition + 8, { align: 'center', charSpace: 0 })
        doc.text('Réf', colRef + 12, yPosition + 4, { align: 'center', charSpace: 0 })
        doc.text('article', colRef + 12, yPosition + 9, { align: 'center', charSpace: 0 })
        doc.text('Désignation article', colDesignation + 35, yPosition + 8, { align: 'center', charSpace: 0 })
        doc.text('Quantité', colQuantite + 9, yPosition + 8, { align: 'center', charSpace: 0 })
        doc.text('Prix unit.', colPrixUnit + 11, yPosition + 4, { align: 'center', charSpace: 0 })
        doc.text('TTC', colPrixUnit + 11, yPosition + 9, { align: 'center', charSpace: 0 })
        doc.text('Total TTC', colTotal + 11, yPosition + 8, { align: 'center', charSpace: 0 })

        yPosition += headerHeight

        // Lignes des articles EXACTEMENT comme Leroy Merlin
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        
        orderData.items.forEach((item, index) => {
          // Calculate dynamic row height based on product name length
          const productName = item.name.toUpperCase()
          const maxWidth = 70
          doc.setFontSize(7)
          const lines = doc.splitTextToSize(productName, maxWidth)
          const rowHeight = Math.max(baseRowHeight, lines.length * 4 + 4) // 4mm per line + padding
          
          doc.setDrawColor(150, 150, 150)
          doc.rect(margin, yPosition, contentWidth, rowHeight)

          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          
          // Calculate vertical center for single-line items
          const vCenter = yPosition + (rowHeight / 2) + 2
          
          doc.setFontSize(7)
          doc.text((index + 1).toString(), colN + 5, vCenter, { align: 'center', charSpace: 0 })
          
          // Use product reference from database or fallback to generated reference
          const productRef = item.reference || `SB${(index + 1).toString().padStart(6, '0')}`
          doc.text(productRef, colRef + 12, vCenter, { align: 'center', charSpace: 0 })
          
          // Product name with wrapping - display all lines
          doc.text(lines, colDesignation + 2, yPosition + 6, { charSpace: 0 })
          
          // Quantité, Prix unitaire, Total - use formatNumber instead of formatCurrency
          doc.text(item.quantity.toString(), colQuantite + 9, vCenter, { align: 'center', charSpace: 0 })
          doc.text(this.formatNumber(item.price) + ' €', colPrixUnit + 11, vCenter, { align: 'center', charSpace: 0 })
          doc.text(this.formatNumber(item.price * item.quantity) + ' €', colTotal + 11, vCenter, { align: 'center', charSpace: 0 })
          
          yPosition += rowHeight
        })

        // Lignes verticales pour layout compact
        const verticalLines = [
          colRef - 1,           // Après N°
          colDesignation - 1,   // Après Réf
          colQuantite - 1,      // Après Désignation, avant Quantité  
          colPrixUnit - 1,      // Après Quantité, avant Prix unit
          colTotal - 1          // Après Prix unit, avant Total
        ]
        
        verticalLines.forEach(x => {
          doc.line(x, tableStartY, x, yPosition)
        })

        // Bordure finale du tableau
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(margin, tableStartY, contentWidth, yPosition - tableStartY)

        yPosition += 10

        // Section droite - Totaux simplifiés
        const rightSectionX = pageWidth - margin - 80
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        // Calcul des montants
        const sousTotal = orderData.total / 1.20  // HT
        const tauxTVA = 20.00
        const montantTVA = orderData.total - sousTotal
        
        doc.text('Sous total :', rightSectionX, yPosition + 8)
        doc.text(this.formatNumber(sousTotal) + ' €', rightSectionX + 60, yPosition + 8, { align: 'right', charSpace: 0 })
        
        doc.text(`Taux de TVA : ${tauxTVA.toLocaleString('fr-FR')}%`, rightSectionX, yPosition + 15)
        doc.text(this.formatNumber(montantTVA) + ' €', rightSectionX + 60, yPosition + 15, { align: 'right', charSpace: 0 })
        
        doc.text('Total TTC :', rightSectionX, yPosition + 22)
        doc.text(this.formatNumber(orderData.total) + ' €', rightSectionX + 60, yPosition + 22, { align: 'right', charSpace: 0 })
        
        // SOMME FINALE avec fond jaune - repositionnée et redimensionnée
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(rightSectionX - 5, yPosition + 30, 85, 12, 'F')
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(rightSectionX - 5, yPosition + 30, 85, 12)
        
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('Somme finale à payer :', rightSectionX, yPosition + 38)
        doc.text(this.formatNumber(orderData.total) + ' €', rightSectionX + 60, yPosition + 38, { align: 'right', charSpace: 0 })

        yPosition += 60

        // FOOTER - Informations de pied de page - Position absolue tout en bas
        const footerY = pageHeight - 5 // Encore plus bas - 5mm du bord inférieur
        
        // Ligne de séparation
        doc.setDrawColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.setLineWidth(1)
        doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20)
        
        // Informations entreprise en footer
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
        // Première ligne - Informations légales
        const footerLine1 = 'SHOPBATI.FR – SASU au capital de 2 000€ – RCS Nanterre 993 797 075'
        doc.text(footerLine1, pageWidth/2, footerY - 15, { align: 'center' })
        
        // Deuxième ligne - SIREN et TVA
        const footerLine2 = 'SIREN : 993 797 075 • TVA : FR13993797075'
        doc.text(footerLine2, pageWidth/2, footerY - 11, { align: 'center' })
        
        // Troisième ligne - Contact et website
        const footerLine3 = 'contact@shopbati.fr • www.shopbati.fr • Tél : +33 6 52 35 40 15'
        doc.text(footerLine3, pageWidth/2, footerY - 7, { align: 'center' })
        
        // Quatrième ligne - Activité
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(6.5)
        const footerLine4 = 'Achat & vente de matériels de bâtiment – Intermédiaire en matériaux de construction'
        doc.text(footerLine4, pageWidth/2, footerY - 2, { align: 'center' })

        // Convertir en Buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        resolve(pdfBuffer)

      } catch (error) {
        reject(error)
      }
    })
  }
}

// Fonction d'export compatible avec l'ancienne interface
export async function generatePDFFromOrder(orderData: OrderData): Promise<Buffer> {
  return InvoiceGenerator.generatePDFFromOrder(orderData)
}

// Nouvelle fonction pour générer facture avec QR code
export async function generateInvoiceWithQRCode(orderData: OrderData): Promise<InvoiceWithQR> {
  return InvoiceGenerator.generateInvoiceWithQR(orderData)
}

// Function to generate PDF as base64 (for email attachments)
export async function generateInvoicePDF(orderData: OrderData, documentType: string = 'FACTURE'): Promise<string> {
  const buffer = await InvoiceGenerator.generatePDFFromOrder(orderData, documentType)
  return buffer.toString('base64')
}

// Export des types
export type { OrderData, InvoiceWithQR }
