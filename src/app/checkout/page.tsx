'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

interface OrderData {
  items: CartItem[]
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  billingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
    sameAsShipping: boolean
  }
  paymentMethod: string
  specialInstructions: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderData, setOrderData] = useState<OrderData>({
    items: [],
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    },
    billingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France',
      sameAsShipping: true
    },
    paymentMethod: 'card',
    specialInstructions: ''
  })

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('shopbati_cart')
    if (savedCart) {
      const items = JSON.parse(savedCart)
      setCartItems(items)
      setOrderData(prev => ({ ...prev, items }))
    }
    setLoading(false)
  }

  const handleInputChange = (section: string, field: string, value: string | boolean) => {
    setOrderData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof OrderData] as object),
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear cart
      localStorage.removeItem('shopbati_cart')
      window.dispatchEvent(new Event('cartUpdated'))
      
      // Redirect to success page
      router.push('/checkout/success')
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Erreur lors de la commande. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getShippingCost = () => {
    const total = getTotalPrice()
    return total >= 100 ? 0 : 15 // Free shipping over 100€
  }

  const getFinalTotal = () => {
    return getTotalPrice() + getShippingCost()
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-shopping-cart text-6xl text-gray-400 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-700 mb-2">Votre panier est vide</h1>
            <p className="text-gray-500 mb-6">Ajoutez des produits à votre panier pour procéder au paiement.</p>
            <button 
              onClick={() => router.push('/shop')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <i className="fas fa-store mr-2"></i>Continuer mes achats
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              <i className="fas fa-credit-card mr-3 text-green-600"></i>
              Finaliser ma commande
            </h1>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-600">
                <i className="fas fa-check-circle mr-2"></i>
                <span>Panier</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
              <div className="flex items-center text-blue-600 font-semibold">
                <i className="fas fa-credit-card mr-2"></i>
                <span>Paiement</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
              <div className="flex items-center text-gray-400">
                <i className="fas fa-check mr-2"></i>
                <span>Confirmation</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    <i className="fas fa-user mr-2 text-blue-600"></i>
                    Informations personnelles
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderData.customerInfo.firstName}
                        onChange={(e) => handleInputChange('customerInfo', 'firstName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderData.customerInfo.lastName}
                        onChange={(e) => handleInputChange('customerInfo', 'lastName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={orderData.customerInfo.email}
                        onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={orderData.customerInfo.phone}
                        onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    <i className="fas fa-truck mr-2 text-green-600"></i>
                    Adresse de livraison
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderData.shippingAddress.street}
                        onChange={(e) => handleInputChange('shippingAddress', 'street', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Numéro et nom de rue"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code postal *
                        </label>
                        <input
                          type="text"
                          required
                          value={orderData.shippingAddress.postalCode}
                          onChange={(e) => handleInputChange('shippingAddress', 'postalCode', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="75001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ville *
                        </label>
                        <input
                          type="text"
                          required
                          value={orderData.shippingAddress.city}
                          onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Paris"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pays *
                        </label>
                        <select
                          required
                          value={orderData.shippingAddress.country}
                          onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="France">France</option>
                          <option value="Belgique">Belgique</option>
                          <option value="Suisse">Suisse</option>
                          <option value="Luxembourg">Luxembourg</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    <i className="fas fa-credit-card mr-2 text-purple-600"></i>
                    Mode de paiement
                  </h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={orderData.paymentMethod === 'card'}
                        onChange={(e) => setOrderData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <i className="fas fa-credit-card mr-3 text-blue-600"></i>
                        <div>
                          <div className="font-semibold">Carte bancaire</div>
                          <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={orderData.paymentMethod === 'paypal'}
                        onChange={(e) => setOrderData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <i className="fab fa-paypal mr-3 text-blue-500"></i>
                        <div>
                          <div className="font-semibold">PayPal</div>
                          <div className="text-sm text-gray-500">Paiement sécurisé avec PayPal</div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={orderData.paymentMethod === 'transfer'}
                        onChange={(e) => setOrderData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <i className="fas fa-university mr-3 text-green-600"></i>
                        <div>
                          <div className="font-semibold">Virement bancaire</div>
                          <div className="text-sm text-gray-500">Paiement par virement (délai 2-3 jours)</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    <i className="fas fa-sticky-note mr-2 text-yellow-600"></i>
                    Instructions spéciales
                  </h2>
                  
                  <textarea
                    value={orderData.specialInstructions}
                    onChange={(e) => setOrderData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Instructions de livraison, commentaires..."
                  ></textarea>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    <i className="fas fa-receipt mr-2"></i>Récapitulatif
                  </h3>

                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                          {item.image_url ? (
                            <Image 
                              src={item.image_url} 
                              alt={item.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <i className="fas fa-box text-gray-400 text-sm"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                          {(item.price * item.quantity).toFixed(2)}€
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2 mb-6 border-t pt-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Sous-total ({getTotalItems()} articles)</span>
                      <span>{getTotalPrice().toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Livraison</span>
                      <span className={getShippingCost() === 0 ? 'text-green-600 font-medium' : ''}>
                        {getShippingCost() === 0 ? 'Gratuite' : `${getShippingCost().toFixed(2)}€`}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total TTC</span>
                        <span className="text-green-600">{getFinalTotal().toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-4"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-lock mr-2"></i>
                        Confirmer la commande
                      </>
                    )}
                  </button>

                  {/* Security Info */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-2">Paiement 100% sécurisé</div>
                    <div className="flex justify-center space-x-2">
                      <i className="fab fa-cc-visa text-blue-600"></i>
                      <i className="fab fa-cc-mastercard text-red-500"></i>
                      <i className="fab fa-paypal text-blue-500"></i>
                      <i className="fas fa-shield-alt text-green-600"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </>
  )
}
