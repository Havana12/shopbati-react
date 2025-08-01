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
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  private static formatNumber(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
        const margin = 15
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
              console.log('Erreur lecture fichier logo:', fsError)
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
              console.log('Erreur fetch logo:', fetchError)
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
          console.log('Erreur logo générale:', error)
          // Fallback simple
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          doc.text('SHOPBATI', margin, yPosition + 15)
        }

        // Titre facture au centre
        const invoiceNumber = this.generateInvoiceNumber()
        
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text(`FACTURE N° ${invoiceNumber.replace('SB-', '')} DUPLICATA`, pageWidth/2, yPosition + 8, { align: 'center' })
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Ticket 063-000967-067-1729 / Date de vente : ${this.formatDate(orderData.timestamp)}`, pageWidth/2, yPosition + 15, { align: 'center' })
        doc.text(`Exemplaire client / Date d'émission : ${this.formatDate(orderData.timestamp)}`, pageWidth/2, yPosition + 19, { align: 'center' })

        yPosition += 28

        // 3. CODE BARRES CENTRAL
        doc.setFontSize(28)
        doc.setFont('helvetica', 'normal')
        doc.text('||||| |||| ||||| |||| ||||| ||||', pageWidth/2, yPosition + 8, { align: 'center' })
        doc.setFontSize(8)
        doc.text(invoiceNumber.replace(/-/g, ''), pageWidth/2, yPosition + 14, { align: 'center' })

        yPosition += 25

        // 4. SECTION INFORMATIONS (2 colonnes comme Leroy Merlin)
        const infoHeight = 50
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
        doc.text('123 Rue du Bâtiment', margin + 3, yPosition + 15)
        doc.text('75001 PARIS FRANCE', margin + 3, yPosition + 20)
        doc.text('Tél : 01 23 45 67 89', margin + 3, yPosition + 25)
        doc.text('Email: contact@shopbati.fr', margin + 3, yPosition + 30)

        // Colonne droite - Client
        const rightColX = margin + leftColWidth + spacing
        doc.setDrawColor(100, 100, 100)
        doc.rect(rightColX, yPosition, rightColWidth, infoHeight)

        const customerName = orderData.customerName || 'Client'
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(customerName, rightColX + 3, yPosition + 8)
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        if (orderData.shippingAddress && orderData.shippingAddress.street) {
          doc.text(orderData.shippingAddress.street, rightColX + 3, yPosition + 15)
          doc.text(`${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}`, rightColX + 3, yPosition + 20)
          doc.text(orderData.shippingAddress.country || 'France', rightColX + 3, yPosition + 25)
        } else {
          doc.text('9 Rue Parrot', rightColX + 3, yPosition + 15)
          doc.text('75012 Paris', rightColX + 3, yPosition + 20)
        }
        
        // SIRET uniquement pour les factures professionnelles
        // Vérifier via isProfessional ou customerInfo.accountType
        const isProfessional = orderData.isProfessional || orderData.customerInfo?.accountType === 'professional'
        if (isProfessional) {
          doc.text('SIRET : 123 456 789 00012', rightColX + 3, yPosition + 30)
        }

        yPosition += infoHeight + 10

        // 5. INFORMATIONS LÉGALES (comme Leroy Merlin)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('Tél : 0155546990', margin, yPosition)
        doc.text('Conditions de règlement : prix comptant sans escompte', margin, yPosition + 4)
        doc.text('Pénalité retard : trois fois le taux de l\'intérêt légal en vigueur majoré de 40 points de base', margin, yPosition + 8)
        doc.text('Conditions de vente : prix départ magasin (ou franco domicile après règlt des frais de transport)', margin, yPosition + 12)
        
        doc.text('Page 1 / 1', pageWidth - margin, yPosition + 4, { align: 'right' })

        yPosition += 20

        // 6. TABLEAU EXACT STYLE LEROY MERLIN
        const tableStartY = yPosition
        const headerHeight = 15
        const rowHeight = 12

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
        
        doc.text('N°', colN + 5, yPosition + 8, { align: 'center' })
        doc.text('Réf', colRef + 12, yPosition + 4, { align: 'center' })
        doc.text('article', colRef + 12, yPosition + 9, { align: 'center' })
        doc.text('Désignation article', colDesignation + 35, yPosition + 8, { align: 'center' })
        doc.text('Quantité', colQuantite + 9, yPosition + 8, { align: 'center' })
        doc.text('Prix unit.', colPrixUnit + 11, yPosition + 4, { align: 'center' })
        doc.text('TTC', colPrixUnit + 11, yPosition + 9, { align: 'center' })
        doc.text('Total TTC', colTotal + 11, yPosition + 8, { align: 'center' })

        yPosition += headerHeight

        // Lignes des articles EXACTEMENT comme Leroy Merlin
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        
        orderData.items.forEach((item, index) => {
          // Pas de fond alterné, comme Leroy Merlin
          doc.setDrawColor(150, 150, 150)
          doc.rect(margin, yPosition, contentWidth, rowHeight)

          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
          
          // Données compactes pour tenir entièrement dans la page
          doc.setFontSize(7)
          doc.text((index + 1).toString(), colN + 5, yPosition + 8, { align: 'center' })
          doc.text(`SB${(index + 1).toString().padStart(6, '0')}`, colRef + 12, yPosition + 8, { align: 'center' })
          
          // Nom produit (ajusté pour la largeur compacte)
          let productName = item.name.toUpperCase()
          if (productName.length > 35) {
            productName = productName.substring(0, 32) + '...'
          }
          doc.text(productName, colDesignation + 2, yPosition + 8)
          
          // Quantité, Prix unitaire, Total - compacts
          doc.text(item.quantity.toString(), colQuantite + 9, yPosition + 8, { align: 'center' })
          doc.text(this.formatCurrency(item.price), colPrixUnit + 11, yPosition + 8, { align: 'center' })
          doc.text(this.formatCurrency(item.price * item.quantity), colTotal + 11, yPosition + 8, { align: 'center' })
          
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
        const rightSectionX = pageWidth - margin - 70
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        // Calcul des montants
        const sousTotal = orderData.total / 1.20  // HT
        const tauxTVA = 20.00
        const montantTVA = orderData.total - sousTotal
        
        doc.text('Sous total :', rightSectionX, yPosition + 8)
        doc.text(this.formatNumber(sousTotal) + ' €', rightSectionX + 50, yPosition + 8, { align: 'right' })
        
        doc.text(`Taux de TVA : ${tauxTVA.toLocaleString('fr-FR')}%`, rightSectionX, yPosition + 15)
        doc.text(this.formatNumber(montantTVA) + ' €', rightSectionX + 50, yPosition + 15, { align: 'right' })
        
        doc.text('Total TTC :', rightSectionX, yPosition + 22)
        doc.text(this.formatNumber(orderData.total) + ' €', rightSectionX + 50, yPosition + 22, { align: 'right' })
        
        // SOMME FINALE avec fond jaune
        doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.rect(rightSectionX - 5, yPosition + 30, 75, 12, 'F')
        doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2])
        doc.rect(rightSectionX - 5, yPosition + 30, 75, 12)
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        doc.text('Somme finale à payer :', rightSectionX, yPosition + 38)
        doc.text(this.formatNumber(orderData.total) + ' €', rightSectionX + 50, yPosition + 38, { align: 'right' })

        yPosition += 60

        // FOOTER - Informations de pied de page - Position absolue tout en bas
        const footerY = pageHeight - 5 // Encore plus bas - 5mm du bord inférieur
        
        // Ligne de séparation
        doc.setDrawColor(yellowColor[0], yellowColor[1], yellowColor[2])
        doc.setLineWidth(1)
        doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20)
        
        // Informations entreprise en footer
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
        // Première ligne - Informations légales
        const footerLine1 = 'SHOPBATI.FR - SAS au capital de 50 000€ - RCS Paris B 123 456 789'
        doc.text(footerLine1, pageWidth/2, footerY - 14, { align: 'center' })
        
        // Deuxième ligne - Contact et website
        const footerLine2 = 'contact@shopbati.fr • www.shopbati.fr • Tél: 01 23 45 67 89'
        doc.text(footerLine2, pageWidth/2, footerY - 8, { align: 'center' })
        
        // Troisième ligne - Spécialités
        doc.setTextColor(100, 100, 100)
        const footerLine3 = 'Spécialiste en matériaux de construction, bricolage, décoration et jardinage'
        doc.text(footerLine3, pageWidth/2, footerY - 2, { align: 'center' })

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
