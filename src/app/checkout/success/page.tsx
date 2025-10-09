'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CheckoutSuccessPage() {
  const [invoiceSent, setInvoiceSent] = useState(false)
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    // Clear any remaining cart data
    localStorage.removeItem('shopbati_cart')
    window.dispatchEvent(new Event('cartUpdated'))
    
    // Get order number
    const storedOrderNumber = localStorage.getItem('last_order_number')
    if (storedOrderNumber) {
      setOrderNumber(storedOrderNumber)
      localStorage.removeItem('last_order_number')
    } else {
      // Fallback to generated order number
      setOrderNumber(`SHOP-${Date.now().toString().slice(-6)}`)
    }
    
    // Check if invoice was sent
    const invoiceStatus = localStorage.getItem('invoice_sent')
    const email = localStorage.getItem('invoice_email')
    
    if (invoiceStatus === 'true' && email) {
      setInvoiceSent(true)
      setInvoiceEmail(email)
      
      // Clean up localStorage
      localStorage.removeItem('invoice_sent')
      localStorage.removeItem('invoice_email')
    }
  }, [])

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-8">
                <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-check text-green-600 text-4xl"></i>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Commande confirmée !
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Merci pour votre commande. Nous avons bien reçu votre demande et nous la traitons actuellement.
                </p>
                
                {/* Order Number */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Numéro de commande
                  </h2>
                  <p className="text-2xl font-bold text-blue-600">{orderNumber}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Conservez ce numéro pour suivre votre commande
                  </p>
                </div>

                {/* Invoice Sent Message */}
                {invoiceSent && (
                  <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                        <i className="fas fa-envelope text-green-600 text-xl"></i>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 text-center mb-2">
                      Facture envoyée !
                    </h3>
                    <p className="text-green-700 text-center">
                      Votre facture a été automatiquement envoyée à votre boîte email :<br />
                      <span className="font-semibold">{invoiceEmail}</span>
                    </p>
                    <p className="text-sm text-green-600 text-center mt-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Vérifiez également votre dossier spam si vous ne la trouvez pas
                    </p>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div className="border-t pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Prochaines étapes</h3>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Confirmation par email</h4>
                      <p className="text-gray-600 text-sm">
                        Vous recevrez un email de confirmation avec les détails de votre commande dans les prochaines minutes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Préparation de la commande</h4>
                      <p className="text-gray-600 text-sm">
                        Notre équipe prépare votre commande avec soin. Vous recevrez un email lors de l'expédition.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Livraison</h4>
                      <p className="text-gray-600 text-sm">
                        Livraison sous 24-48h pour les articles en stock. Service drive disponible pour les professionnels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-8 mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/produits"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
                  >
                    <i className="fas fa-store mr-2"></i>
                    Continuer mes achats
                  </Link>
                  <Link 
                    href="/contact"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-bold transition-colors"
                  >
                    <i className="fas fa-envelope mr-2"></i>
                    Nous contacter
                  </Link>
                </div>
              </div>
            </div>

            {/* Customer Service */}
            <div className="mt-8 bg-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                <i className="fas fa-headset mr-2 text-blue-600"></i>
                Besoin d'aide ?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <i className="fas fa-phone text-blue-600 text-xl mb-2"></i>
                  <p className="font-semibold text-gray-800">Téléphone</p>
                  <p className="text-gray-600 text-sm">+33 1 23 45 67 89</p>
                </div>
                <div>
                  <i className="fas fa-envelope text-blue-600 text-xl mb-2"></i>
                  <p className="font-semibold text-gray-800">Email</p>
                  <p className="text-gray-600 text-sm">contact@shopbati.fr</p>
                </div>
                <div>
                  <i className="fas fa-clock text-blue-600 text-xl mb-2"></i>
                  <p className="font-semibold text-gray-800">Horaires</p>
                  <p className="text-gray-600 text-sm">Lun-Ven: 8h-18h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
