'use client'

import { useEffect, useState } from 'react'
import Invoice from '@/components/Invoice'
import { useInvoiceGenerator } from '@/hooks/useInvoiceGenerator'

interface OrderData {
  id: string
  customer: {
    name: string
    email: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  taxRate: number
  total: number
  createdAt: string
}

interface OrderInvoiceProps {
  orderData: OrderData
  onInvoiceGenerated?: (invoiceNumber: string) => void
  autoDownload?: boolean
}

export default function OrderInvoice({ 
  orderData, 
  onInvoiceGenerated,
  autoDownload = false 
}: OrderInvoiceProps) {
  const { invoiceRef, downloadAsPDF, generateInvoiceNumber } = useInvoiceGenerator()
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Convertir les données de commande en format facture
    const convertOrderToInvoice = () => {
      const invoiceNumber = generateInvoiceNumber()
      const taxAmount = orderData.subtotal * orderData.taxRate
      
      const convertedData = {
        invoiceNumber,
        date: orderData.createdAt,
        dueDate: new Date(new Date(orderData.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
        customer: orderData.customer,
        items: orderData.items.map(item => ({
          ...item,
          total: item.quantity * item.price
        })),
        subtotal: orderData.subtotal,
        taxRate: orderData.taxRate,
        taxAmount,
        total: orderData.total,
        notes: `Facture générée automatiquement pour la commande #${orderData.id}. Merci pour votre confiance !`
      }

      setInvoiceData(convertedData)
      
      // Notifier la génération de la facture
      onInvoiceGenerated?.(invoiceNumber)
      
      // Téléchargement automatique si demandé
      if (autoDownload) {
        setTimeout(() => {
          handleDownload(invoiceNumber)
        }, 1000) // Délai pour laisser le rendu se faire
      }
    }

    convertOrderToInvoice()
  }, [orderData, generateInvoiceNumber, onInvoiceGenerated, autoDownload])

  const handleDownload = async (filename?: string) => {
    if (!invoiceData) return
    
    setIsGenerating(true)
    const success = await downloadAsPDF(filename ? `facture_${filename}.pdf` : undefined)
    setIsGenerating(false)
    
    return success
  }

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Génération de la facture...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Actions rapides */}
      <div className="flex justify-end space-x-3 print:hidden">
        <button
          onClick={() => handleDownload()}
          disabled={isGenerating}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Génération...
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Télécharger PDF
            </>
          )}
        </button>
      </div>

      {/* Facture */}
      <Invoice 
        ref={invoiceRef}
        data={invoiceData}
        className="print:shadow-none"
      />
    </div>
  )
}
