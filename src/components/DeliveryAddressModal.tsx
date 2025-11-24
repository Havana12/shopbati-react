'use client'

import { useState, useEffect } from 'react'
import { AppwriteService } from '@/lib/appwrite'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'

interface DeliveryAddressModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DatabaseUser {
  $id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  account_type: string
  raison_sociale?: string
  siret?: string
  tva_number?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  delivery_address?: string
  delivery_city?: string
  delivery_postal_code?: string
}

export default function DeliveryAddressModal({ isOpen, onClose }: DeliveryAddressModalProps) {
  const { state, clearCart, closeCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<DatabaseUser | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: 'France'
  })

  useEffect(() => {
    if (isOpen) {
      loadUserData()
    }
  }, [isOpen])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const currentUser = await appwrite.getCurrentUser()
      
      if (currentUser) {
        // Get user from database
        const dbUser = await appwrite.getCustomerByEmail(currentUser.email)
        if (dbUser) {
          setUser(dbUser as unknown as DatabaseUser)
          
          // If user has saved delivery address, pre-fill it
          // User can change it if needed
          if (dbUser.delivery_address && dbUser.delivery_city && dbUser.delivery_postal_code) {
            setDeliveryAddress({
              street: dbUser.delivery_address,
              city: dbUser.delivery_city,
              postalCode: dbUser.delivery_postal_code,
              country: 'France'
            })
          } else {
            // No saved address, leave empty
            setDeliveryAddress({
              street: '',
              city: '',
              postalCode: '',
              country: 'France'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      // Validate delivery address
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode) {
        alert('Veuillez remplir tous les champs de l\'adresse de livraison')
        setIsSubmitting(false)
        return
      }

      const appwrite = AppwriteService.getInstance()

      // 1. Update user's delivery address in database
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        user.$id,
        {
          delivery_address: deliveryAddress.street,
          delivery_city: deliveryAddress.city,
          delivery_postal_code: deliveryAddress.postalCode
        }
      )
      console.log('✅ Delivery address saved to user account')

      // 2. Generate order number (same format as PDF invoice)
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
      const orderNumber = `SB-${year}${month}${day}-${random}`

      // 3. Create order in database
      const orderDataForDB = {
        order_number: orderNumber,
        user_id: user.$id,
        customer_email: user.email,
        customer_name: user.account_type === 'professional' 
          ? user.raison_sociale || `${user.first_name} ${user.last_name}`
          : `${user.first_name} ${user.last_name}`,
        customer_phone: user.phone || '',
        customer_type: user.account_type === 'professional' ? 'professionnel' : 'particulier',
        items: JSON.stringify(state.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image_url || '',
          reference: item.reference || ''
        }))),
        subtotal: state.total,
        shipping_cost: 0,
        total_amount: state.total,
        shipping_address: JSON.stringify(deliveryAddress),
        billing_address: JSON.stringify({
          street: user.address || deliveryAddress.street,
          city: user.city || deliveryAddress.city,
          postalCode: user.postalCode || deliveryAddress.postalCode,
          country: 'France'
        }),
        payment_method: 'transfer',
        special_instructions: '',
        status: 'en_attente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const createdOrder = await appwrite.createOrder(orderDataForDB)
      console.log('✅ Order created:', createdOrder.$id)

      // 4. Send confirmation email with PDF
      const invoiceOrderData = {
        orderId: orderNumber,
        customerName: user.account_type === 'professional' 
          ? user.raison_sociale || `${user.first_name} ${user.last_name}`
          : `${user.first_name} ${user.last_name}`,
        customerEmail: user.email,
        timestamp: new Date().toISOString(),
        items: state.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          reference: item.reference || ''
        })),
        total: state.total,
        shippingAddress: deliveryAddress,
        customerInfo: {
          accountType: user.account_type,
          firstName: user.account_type === 'individual' ? user.first_name : '',
          lastName: user.account_type === 'individual' ? user.last_name : '',
          raisonSociale: user.account_type === 'professional' ? user.raison_sociale || '' : '',
          siret: user.account_type === 'professional' ? user.siret || '' : '',
          tvaNumber: user.account_type === 'professional' ? user.tva_number || '' : '',
          phone: user.phone || '',
          address: user.address || deliveryAddress.street,
          city: user.city || deliveryAddress.city,
          postalCode: user.postalCode || deliveryAddress.postalCode,
          country: 'France'
        }
      }

      const response = await fetch('/api/send-order-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceOrderData)
      })

      const confirmationResult = await response.json()

      if (!confirmationResult.success) {
        console.error('❌ Email send failed:', confirmationResult.message)
        alert('Commande créée mais l\'email n\'a pas pu être envoyé')
      } else {
        console.log('✅ Email sent successfully')
      }

      // 5. Store order number FIRST before any redirects
      localStorage.setItem('last_order_number', orderNumber)
      console.log('✅ Order number saved to localStorage:', orderNumber)
      
      // 6. Clear cart
      clearCart()
      closeCart()

      // 7. Close modal
      onClose()
      
      // 8. Redirect to success page
      router.push('/checkout/success')

    } catch (error) {
      console.error('❌ Error processing order:', error)
      alert(`Erreur lors de la commande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Adresse de livraison</h2>
                <p className="text-orange-100 text-sm mt-1">
                  Confirmez votre adresse de livraison
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {/* Show message if address exists */}
              {user?.delivery_address && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Adresse de livraison enregistrée</p>
                      <p className="text-blue-700">
                        Vous pouvez utiliser cette adresse ou la modifier ci-dessous
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Numéro et nom de rue"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Ville"
                  />
                </div>

                {/* Postal Code & Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="75001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.country}
                      onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{state.itemCount} article{state.itemCount !== 1 ? 's' : ''}</span>
                    <span>{state.total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 pt-2 border-t">
                    <span>Total</span>
                    <span className="text-orange-600">{state.total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Après confirmation :</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Votre commande sera créée</li>
                      <li>Vous recevrez un email avec le bon de commande</li>
                      <li>L'adresse sera enregistrée pour vos prochaines commandes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmer la commande
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
