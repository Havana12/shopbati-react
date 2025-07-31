import jsPDF from 'jspdf'

interface OrderData {
  orderId: string
  customerName?: string
  customerEmail: string
  timestamp: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

export class InvoiceGenerator {
  private static generateInvoiceNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `SB-${year}${month}${day}-${random}`
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  static async generatePDFFromOrder(orderData: OrderData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = 210
        const pageHeight = 297
        const margin = 20
        const contentWidth = pageWidth - 2 * margin
        
        let yPosition = margin

        // Couleurs SHOPBATI
        const yellowColor: [number, number, number] = [255, 215, 0] // #FFD700
        const darkGray: [number, number, number] = [33, 33, 33] // #212121
        const lightGray: [number, number, number] = [245, 245, 245] // #F5F5F5

        // Fonction pour charger l'image en base64 avec plusieurs tentatives
        const loadImageAsBase64 = async (): Promise<string | null> => {
          try {
            // Tentative 1: chemin absolu depuis public
            let response = await fetch('/images/logo_shopbat.jpg')
            if (!response.ok) {
              // Tentative 2: avec un autre chemin
              response = await fetch('/public/images/logo_shopbat.jpg')
            }
            
            if (!response.ok) {
              return null
            }
            
            const blob = await response.blob()
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                resolve(result)
              }
              reader.onerror = () => {
                resolve(null)
              }
              reader.readAsDataURL(blob)
            })
          } catch (error) {
            // Fallback: créer un logo de base en base64 (simple rectangle avec texte)
            return createFallbackLogo()
          }
        }

        // Logo de fallback simple
        const createFallbackLogo = (): string => {
          // Créer un canvas simple avec le texte SHOPBATI
          const canvas = document.createElement('canvas')
          canvas.width = 240
          canvas.height = 60
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            // Fond jaune
            ctx.fillStyle = '#FFD700'
            ctx.fillRect(0, 0, 240, 60)
            
            // Texte noir
            ctx.fillStyle = '#212121'
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('SHOPBATI.FR', 120, 35)
            
            return canvas.toDataURL('image/png')
          }
          
          return ''
        }

        // Charger le logo - utiliser une approche serveur-side compatible
        let logoBase64: string | null = null
        
        try {
          // En environnement Next.js, utiliser le chemin absolu complet
          const logoPath = process.cwd() + '/public/images/logo_shopbat.jpg'
          
          // Vérifier si on est côté serveur ou client
          if (typeof window === 'undefined') {
            // Côté serveur: utiliser fs
            const fs = require('fs')
            const path = require('path')
            
            if (fs.existsSync(logoPath)) {
              const imageBuffer = fs.readFileSync(logoPath)
              logoBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
            } else {
              logoBase64 = null
            }
          } else {
            // Côté client: utiliser fetch
            logoBase64 = await loadImageAsBase64()
          }
        } catch (error) {
          logoBase64 = null
        }

        // En-tête avec logo uniquement (le texte est déjà dans l'image)
        if (logoBase64) {
          try {
            // Dimensions du logo avec ratio correct (logo horizontal)
            const logoWidth = 60  // Plus large pour respecter le ratio
            const logoHeight = 15 // Hauteur réduite pour éviter la déformation
            
            // Ajouter le logo centré à gauche
            doc.addImage(logoBase64, 'JPEG', margin, yPosition, logoWidth, logoHeight)
            
            yPosition += logoHeight + 15
            
            // Logo added successfully
          } catch (imageError) {
            // Fallback sans logo - utiliser le texte de l'image
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
            doc.text('SHOPBATI.FR', margin, yPosition + 15)
            yPosition += 10
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(185, 140, 0)
            doc.text('BÂTISSANT L\'AVENIR', margin, yPosition + 15)
            yPosition += 25
          }
        } else {
          // Fallback sans logo - utiliser le texte de l'image
          doc.setFontSize(24)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          doc.text('SHOPBATI.FR', margin, yPosition + 15)
          yPosition += 10
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(185, 140, 0)
          doc.text('BÂTISSANT L\'AVENIR', margin, yPosition + 15)
          yPosition += 25
        }

        // Informations entreprise
        doc.setFontSize(9)
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('123 Rue du Bâtiment', margin, yPosition)
        yPosition += 4
        doc.text('75001 Paris, France', margin, yPosition)
        yPosition += 4
        doc.text('Tel: +33 1 23 45 67 89', margin, yPosition)
        yPosition += 4
        doc.text('Email: shopbati@gmail.com', margin, yPosition)
        yPosition += 15

        // Titre FACTURE avec fond jaune
        const invoiceNumber = this.generateInvoiceNumber()
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(pageWidth - margin - 60, margin, 60, 15, 'F')
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('FACTURE', pageWidth - margin - 30, margin + 10, { align: 'center' })

        // Informations facture
        yPosition = margin + 20
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Numéro : ${invoiceNumber}`, pageWidth - margin - 55, yPosition)
        yPosition += 5
        doc.text(`Date : ${this.formatDate(orderData.timestamp)}`, pageWidth - margin - 55, yPosition)
        yPosition += 5
        const dueDate = new Date(new Date(orderData.timestamp).getTime() + 30 * 24 * 60 * 60 * 1000)
        doc.text(`Échéance : ${this.formatDate(dueDate.toISOString())}`, pageWidth - margin - 55, yPosition)

        // Reset yPosition for customer info
        yPosition = margin + 50

        // Section client avec deux colonnes : Facturé à + Expédié à
        const sectionHeight = 35
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
        doc.rect(margin, yPosition, contentWidth, sectionHeight, 'F')
        
        // Bordure gauche jaune
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(margin, yPosition, 3, sectionHeight, 'F')

        // Colonne 1: Facturé à (gauche)
        let leftColX = margin + 8
        let rightColX = margin + (contentWidth / 2) + 5
        
        yPosition += 8
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('Facturé à :', leftColX, yPosition)
        
        // Colonne 2: Expédié à (droite)
        doc.text('Expédié à :', rightColX, yPosition)
        yPosition += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        // Informations de facturation (gauche)
        const customerName = orderData.customerName || 'Client'
        doc.text(customerName, leftColX, yPosition)
        doc.text(orderData.customerEmail, leftColX, yPosition + 3)
        
        // Adresse de facturation - utiliser l'adresse de livraison
        if (orderData.shippingAddress && orderData.shippingAddress.street && orderData.shippingAddress.street.trim() !== '') {
          doc.text(orderData.shippingAddress.street, leftColX, yPosition + 6)
          doc.text(`${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}`, leftColX, yPosition + 9)
          doc.text(orderData.shippingAddress.country, leftColX, yPosition + 12)
        } else {
          doc.text('Adresse non spécifiée', leftColX, yPosition + 6)
          doc.text('Veuillez nous contacter', leftColX, yPosition + 9)
          doc.text('pour la livraison', leftColX, yPosition + 12)
        }
        
        // Informations d'expédition (droite) - identique à la facturation
        doc.text(customerName, rightColX, yPosition)
        if (orderData.shippingAddress && orderData.shippingAddress.street && orderData.shippingAddress.street.trim() !== '') {
          doc.text(orderData.shippingAddress.street, rightColX, yPosition + 3)
          doc.text(`${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}`, rightColX, yPosition + 6)
          doc.text(orderData.shippingAddress.country, rightColX, yPosition + 9)
        } else {
          doc.text('Adresse non spécifiée', rightColX, yPosition + 3)
          doc.text('Veuillez nous contacter', rightColX, yPosition + 6)
          doc.text('pour la livraison', rightColX, yPosition + 9)
        }

        yPosition += 25 // Espacement après la section client (augmenté pour l'adresse)

        // Tableau des articles
        const tableStartY = yPosition
        const rowHeight = 8
        
        // En-tête du tableau avec fond jaune
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(margin, yPosition, contentWidth, rowHeight, 'F')
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('Article', margin + 5, yPosition + 5)
        doc.text('Qté', margin + contentWidth * 0.625, yPosition + 5, { align: 'center' })
        doc.text('Prix unitaire', margin + contentWidth * 0.775, yPosition + 5, { align: 'center' })
        doc.text('Total', margin + contentWidth * 0.925, yPosition + 5, { align: 'center' })
        
        yPosition += rowHeight

        // Lignes des articles
        doc.setFont('helvetica', 'normal')
        orderData.items.forEach((item, index) => {
          const bgColor: [number, number, number] = index % 2 === 0 ? [255, 255, 255] : lightGray
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
          doc.rect(margin, yPosition, contentWidth, rowHeight, 'F')
          
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          
          // Nom du produit (tronqué si trop long)
          let productName = item.name
          if (productName.length > 32) {
            productName = productName.substring(0, 29) + '...'
          }
          doc.text(productName, margin + 5, yPosition + 5)
          
          // Quantité
          doc.text(item.quantity.toString(), margin + contentWidth * 0.625, yPosition + 5, { align: 'center' })
          
          // Prix unitaire
          doc.text(this.formatCurrency(item.price), margin + contentWidth * 0.775, yPosition + 5, { align: 'center' })
          
          // Total
          doc.text(this.formatCurrency(item.price * item.quantity), margin + contentWidth * 0.925, yPosition + 5, { align: 'center' })
          
          yPosition += rowHeight
        })

        // Bordure du tableau avec lignes de séparation
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(margin, tableStartY, contentWidth, yPosition - tableStartY)
        
        // Lignes verticales de séparation
        const quantityX = margin + contentWidth * 0.55
        const priceX = margin + contentWidth * 0.7
        const totalX = margin + contentWidth * 0.85
        
        doc.line(quantityX, tableStartY, quantityX, yPosition)
        doc.line(priceX, tableStartY, priceX, yPosition)
        doc.line(totalX, tableStartY, totalX, yPosition)

        yPosition += 10

        // Totaux
        const totalBoxWidth = 60
        const subtotal = orderData.total / 1.20
        const taxAmount = orderData.total - subtotal

        // Sous-total
        doc.setFontSize(10)
        doc.text('Sous-total :', pageWidth - margin - totalBoxWidth, yPosition)
        doc.text(this.formatCurrency(subtotal), pageWidth - margin - 5, yPosition, { align: 'right' })
        yPosition += 6

        // TVA
        doc.text('TVA (20.0%) :', pageWidth - margin - totalBoxWidth, yPosition)
        doc.text(this.formatCurrency(taxAmount), pageWidth - margin - 5, yPosition, { align: 'right' })
        yPosition += 8

        // Total avec fond jaune
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(pageWidth - margin - totalBoxWidth, yPosition - 2, totalBoxWidth, 10, 'F')
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('TOTAL :', pageWidth - margin - totalBoxWidth + 5, yPosition + 5)
        doc.text(this.formatCurrency(orderData.total), pageWidth - margin - 5, yPosition + 5, { align: 'right' })

        yPosition += 20

        // Notes (seulement si on a assez de place)
        if (yPosition < pageHeight - 80) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text('Notes :', margin, yPosition)
          yPosition += 6
          
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          const noteText = `Facture générée automatiquement pour la commande #${orderData.orderId}. Merci pour votre confiance !`
          const splitNote = doc.splitTextToSize(noteText, contentWidth)
          doc.text(splitNote, margin, yPosition)
          yPosition += splitNote.length * 4 + 10
        }

        // Pied de page TOUJOURS en bas de la page
        const footerY = pageHeight - 15 // Position plus basse (15mm du bas au lieu de 30mm)
        
        // Ligne de séparation
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8)

        // Informations légales en bas
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text('SHOPBATI - Plateforme du bâtiment | shopbati@gmail.com | +33 1 23 45 67 89', pageWidth / 2, footerY, { align: 'center' })
        doc.text('SIRET : 123 456 789 00012 | TVA : FR12 345678901 | Capital social : 10 000€', pageWidth / 2, footerY + 4, { align: 'center' })

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
