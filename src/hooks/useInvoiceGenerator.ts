'use client'

import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const useInvoiceGenerator = () => {
  const invoiceRef = useRef<HTMLDivElement>(null)

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `SB-${year}${month}${day}-${random}`
  }

  const downloadAsPDF = async (filename?: string) => {
    if (!invoiceRef.current) {
      console.error('Invoice ref not found')
      return
    }

    try {
      // Créer un canvas de l'élément facture
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 1.5, // Qualité réduite pour optimiser la taille
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: invoiceRef.current.scrollHeight,
        width: invoiceRef.current.scrollWidth
      })

      // Dimensions A4 en mm
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4')

      // Si le contenu tient sur une page, on l'ajoute directement
      if (imgHeight <= pageHeight) {
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          imgWidth,
          imgHeight
        )
      } else {
        // Si trop grand, on ajuste pour tenir sur une page
        const scaledHeight = pageHeight - 20 // Marge de sécurité
        const scaledWidth = (canvas.width * scaledHeight) / imgHeight * (imgWidth / canvas.width)
        
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          (imgWidth - scaledWidth) / 2, // Centrer horizontalement
          10, // Marge du haut
          scaledWidth,
          scaledHeight
        )
      }

      // Télécharger le PDF
      const fileName = filename || `facture_${generateInvoiceNumber()}.pdf`
      pdf.save(fileName)

      return true
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      return false
    }
  }

  const printInvoice = () => {
    if (!invoiceRef.current) {
      console.error('Invoice ref not found')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      console.error('Impossible d\'ouvrir la fenêtre d\'impression')
      return
    }

    const invoiceHTML = invoiceRef.current.outerHTML
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture SHOPBATI</title>
          <style>
            body { 
              margin: 0; 
              font-family: 'Inter', sans-serif; 
              background: white;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${invoiceHTML}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Attendre que le contenu soit chargé avant d'imprimer
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return {
    invoiceRef,
    downloadAsPDF,
    printInvoice,
    generateInvoiceNumber
  }
}
