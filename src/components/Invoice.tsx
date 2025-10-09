'use client'

import { forwardRef } from 'react'

interface InvoiceItem {
  id: string
  name: string
  quantity: number
  price: number
  total: number
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate?: string
  customer: {
    name: string
    email: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
}

interface InvoiceProps {
  data: InvoiceData
  className?: string
}

const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ data, className = '' }, ref) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div ref={ref} className={`bg-white min-h-[auto] p-6 font-sans ${className}`}>
      {/* En-tête de la facture */}
      <div className="flex justify-between items-start mb-6">
        {/* Informations entreprise sans logo */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">SHOPBATI</h1>
          <p className="text-yellow-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Plateforme du bâtiment
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>123 Rue du Bâtiment</p>
            <p>75001 Paris, France</p>
            <p>📞 +33 1 23 45 67 89</p>
            <p>✉️ shopbati@gmail.com</p>
          </div>
        </div>

        {/* Informations facture */}
        <div className="text-right">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-lg mb-3">
            <h2 className="text-2xl font-bold">FACTURE</h2>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Numéro :</span>
              <span className="font-mono">{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Date :</span>
              <span>{formatDate(data.date)}</span>
            </div>
            {data.dueDate && (
              <div className="flex justify-between">
                <span className="font-semibold">Échéance :</span>
                <span>{formatDate(data.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations client */}
      <div className="mb-6">
        <div className="bg-gray-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Facturé à :</h3>
          <div className="text-gray-700">
            <p className="font-semibold text-lg">{data.customer.name}</p>
            <p>{data.customer.email}</p>
            <p>{data.customer.address}</p>
            <p>{data.customer.postalCode} {data.customer.city}</p>
            <p>{data.customer.country}</p>
          </div>
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="mb-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* En-tête du tableau */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-5">Article</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-2 text-right">Prix unitaire</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
          </div>

          {/* Lignes du tableau */}
          <div className="divide-y divide-gray-200">
            {data.items.map((item, index) => (
              <div key={item.id} className={`grid grid-cols-12 gap-4 px-6 py-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="col-span-5">
                  <p className="font-medium text-gray-900">{item.name}</p>
                </div>
                <div className="col-span-2 text-center text-gray-700">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right text-gray-700">
                  {formatCurrency(item.price)}
                </div>
                <div className="col-span-3 text-right font-semibold text-gray-900">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totaux */}
      <div className="flex justify-end mb-6">
        <div className="w-80">
          <div className="space-y-2">
            {/* Sous-total */}
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Sous-total :</span>
              <span className="font-semibold">{formatCurrency(data.subtotal)}</span>
            </div>

            {/* TVA */}
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">TVA ({(data.taxRate * 100).toFixed(1)}%) :</span>
              <span className="font-semibold">{formatCurrency(data.taxAmount)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 rounded-lg">
              <span className="text-xl font-bold text-gray-900">TOTAL :</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Notes :</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-gray-700 text-sm">{data.notes}</p>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Informations de paiement</h4>
            <p>Paiement par virement bancaire</p>
            <p>IBAN : FR76 XXXX XXXX XXXX XXXX</p>
            <p>BIC : XXXXXXXX</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Conditions</h4>
            <p>Paiement à 30 jours</p>
            <p>Pénalités de retard : 3%</p>
            <p>Indemnité forfaitaire : 40€</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Informations légales</h4>
            <p>SIRET : 123 456 789 00012</p>
            <p>TVA : FR12 345678901</p>
            <p>Capital social : 10 000€</p>
          </div>
        </div>
        
        <div className="text-center mt-4 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            SHOPBATI - Plateforme du bâtiment | shopbati@gmail.com | +33 1 23 45 67 89
          </p>
        </div>
      </div>
    </div>
  )
})

Invoice.displayName = 'Invoice'

export default Invoice
