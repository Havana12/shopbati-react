'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AppwriteService } from '@/lib/appwrite'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

interface OrderData {
  items: CartItem[]
  customerType: 'particulier' | 'professionnel' | ''
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    // Professional fields
    company?: string
    siret?: string
    vatNumber?: string
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

interface User {
  $id: string
  email: string
  name: string
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
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null)
  const [invoiceStatus, setInvoiceStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [currentStep, setCurrentStep] = useState(1)
  const [orderData, setOrderData] = useState<OrderData>({
    items: [],
    customerType: '',
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      siret: '',
      vatNumber: ''
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
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const currentUser = await appwrite.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        // Skip customer type selection for logged users, go to step 2
        setCurrentStep(2)
        
        // Try to get user details from database
        try {
          const dbUserData = await appwrite.getCustomerByEmail(currentUser.email)
          if (dbUserData) {
            setDbUser(dbUserData as unknown as DatabaseUser)
            
            // Auto-fill form with user data including customer type
            setOrderData(prev => ({
              ...prev,
              customerType: dbUserData.account_type === 'professional' ? 'professionnel' : 'particulier',
              customerInfo: {
                firstName: dbUserData.first_name || '',
                lastName: dbUserData.last_name || '',
                email: dbUserData.email || currentUser.email,
                phone: dbUserData.phone || '',
                company: dbUserData.raison_sociale || '',
                siret: dbUserData.siret || '',
                vatNumber: dbUserData.tva_number || ''
              }
            }))
          }
        } catch (dbError) {
          // Just use auth user info
          setOrderData(prev => ({
            ...prev,
            customerType: 'particulier',
            customerInfo: {
              ...prev.customerInfo,
              email: currentUser.email
            }
          }))
        }
      } else {
        // No user logged in, start from step 1 (customer type selection)
        setCurrentStep(1)
      }
    } catch (error) {
      // No authenticated user, start from step 1
      setCurrentStep(1)
    }
  }

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
    setOrderData(prev => {
      const newData = {
        ...prev,
        [section]: {
          ...(prev[section as keyof OrderData] as object),
          [field]: value
        }
      }
      
      return newData
    })
  }

  const handleCustomerTypeSelect = (type: 'particulier' | 'professionnel') => {
    setOrderData(prev => ({
      ...prev,
      customerType: type
    }))
    setCurrentStep(2)
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log('🛒 Processing order...')
      
      // Debug: Vérifier les données du formulaire avant traitement
      console.log('📋 Données complètes du formulaire:', {
        customerInfo: orderData.customerInfo,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        cartItems: cartItems.length
      })
      
      // Validation des champs requis
      if (!orderData.customerInfo.firstName || !orderData.customerInfo.lastName || !orderData.customerInfo.email) {
        throw new Error('Informations client incomplètes')
      }
      
      if (!orderData.shippingAddress.street || !orderData.shippingAddress.city || !orderData.shippingAddress.postalCode) {
        throw new Error('Adresse de livraison incomplète')
      }
      
      // Generate order number
      const orderNumber = `SHOP-${Date.now().toString().slice(-6)}`
      
      // Prepare order data
      const processedOrder = {
        orderNumber,
        customerEmail: orderData.customerInfo.email,
        customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        customerPhone: orderData.customerInfo.phone,
        items: cartItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: getTotalPrice(),
        shipping: getShippingCost(),
        total: getFinalTotal(),
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress.sameAsShipping ? orderData.shippingAddress : orderData.billingAddress,
        paymentMethod: orderData.paymentMethod,
        specialInstructions: orderData.specialInstructions
      }
      
      console.log('💾 Creating order in database...')
      
      // Create order in database using Appwrite
      const appwrite = AppwriteService.getInstance()
      try {
        // You can implement order creation in Appwrite here if needed
        // For now, we'll proceed with the invoice sending
      } catch (error) {
        // Don't fail the whole process for this
      }
      
      // For authenticated users, automatically send invoice
      if (user && user.email) {
        setInvoiceStatus('sending')
        
        try {
          // Préparer les données pour la nouvelle API
          const invoiceOrderData = {
            orderId: orderNumber,
            customerName: dbUser?.account_type === 'professional' 
              ? dbUser.raison_sociale || `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`
              : `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
            customerEmail: orderData.customerInfo.email,
            timestamp: new Date().toISOString(),
            items: cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            total: getFinalTotal(),
            shippingAddress: orderData.shippingAddress,
            // Add customer account information for invoice generation
            customerInfo: {
              accountType: dbUser?.account_type || 'individual',
              firstName: dbUser?.account_type === 'individual' ? (dbUser?.first_name || orderData.customerInfo.firstName) : '',
              lastName: dbUser?.account_type === 'individual' ? (dbUser?.last_name || orderData.customerInfo.lastName) : '',
              raisonSociale: dbUser?.account_type === 'professional' ? (dbUser?.raison_sociale || '') : '',
              siret: dbUser?.account_type === 'professional' ? (dbUser?.siret || '') : '',
              tvaNumber: dbUser?.account_type === 'professional' ? (dbUser?.tva_number || '') : '',
              phone: dbUser?.phone || orderData.customerInfo.phone,
              address: dbUser?.address || orderData.shippingAddress.street,
              city: dbUser?.city || orderData.shippingAddress.city,
              postalCode: dbUser?.postalCode || orderData.shippingAddress.postalCode,
              country: dbUser?.country || orderData.shippingAddress.country
            }
          }
          
          // Debug: Log des données envoyées à l'API de génération de facture
          console.log('📧 Données envoyées pour génération de facture:', {
            customerName: invoiceOrderData.customerName,
            customerEmail: invoiceOrderData.customerEmail,
            shippingAddress: invoiceOrderData.shippingAddress
          })
          
          // Utiliser la nouvelle API de facture PDF
          const response = await fetch('/api/send-order-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceOrderData)
          })
          
          const invoiceResult = await response.json()
          
          if (invoiceResult.success) {
            setInvoiceStatus('sent')
            localStorage.setItem('invoice_sent', 'true')
            localStorage.setItem('invoice_email', user.email)
            console.log('✅ Invoice sent successfully!')
          } else {
            setInvoiceStatus('error')
            console.error('❌ Invoice sending failed:', invoiceResult.message)
          }
        } catch (error) {
          setInvoiceStatus('error')
        }
      } else {
        // User not authenticated, no automatic invoice
      }
      
      // Clear cart
      localStorage.removeItem('shopbati_cart')
      window.dispatchEvent(new Event('cartUpdated'))
      
      // Store order number for success page
      localStorage.setItem('last_order_number', orderNumber)
      
      // Redirect to success page
      
      // Redirect to success page
      router.push('/checkout/success')
    } catch (error) {
      setInvoiceStatus('error')
      alert(`Erreur lors de la commande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
              <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                <i className={`fas ${currentStep > 1 ? 'fa-check-circle' : 'fa-user-tag'} mr-2`}></i>
                <span>{user ? 'Connecté' : 'Type de client'}</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                <i className="fas fa-user mr-2"></i>
                <span>Informations</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
              <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
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
                
                {/* Step 1: Customer Type Selection (only for non-logged users) */}
                {!user && currentStep === 1 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                      <i className="fas fa-user-tag mr-2 text-blue-600"></i>
                      Quel type de client êtes-vous ?
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleCustomerTypeSelect('particulier')}
                        className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center mb-4">
                          <i className="fas fa-user text-3xl text-blue-600 mr-4"></i>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Particulier</h3>
                            <p className="text-sm text-gray-600">Achat personnel</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Vous achetez pour votre usage personnel ou familial.
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleCustomerTypeSelect('professionnel')}
                        className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center mb-4">
                          <i className="fas fa-building text-3xl text-green-600 mr-4"></i>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Professionnel</h3>
                            <p className="text-sm text-gray-600">Entreprise, artisan, etc.</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Vous représentez une entreprise ou exercez une activité professionnelle.
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Customer Information */}
                {currentStep >= 2 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-800">
                        <i className="fas fa-user mr-2 text-blue-600"></i>
                        Informations {orderData.customerType === 'professionnel' ? 'professionnelles' : 'personnelles'}
                      </h2>
                      {!user && currentStep > 2 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <i className="fas fa-arrow-left mr-1"></i>
                          Retour
                        </button>
                      )}
                    </div>
                    
                    {orderData.customerType === 'professionnel' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Raison sociale *
                          </label>
                          <input
                            type="text"
                            required
                            value={orderData.customerInfo.company || ''}
                            onChange={(e) => handleInputChange('customerInfo', 'company', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Nom de votre entreprise"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              SIRET
                            </label>
                            <input
                              type="text"
                              value={orderData.customerInfo.siret || ''}
                              onChange={(e) => handleInputChange('customerInfo', 'siret', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="Numéro SIRET"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Numéro de TVA
                            </label>
                            <input
                              type="text"
                              value={orderData.customerInfo.vatNumber || ''}
                              onChange={(e) => handleInputChange('customerInfo', 'vatNumber', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="FR12345678901"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
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
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        {user ? (
                          <div className="relative">
                            <input
                              type="email"
                              required
                              value={orderData.customerInfo.email}
                              disabled
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <i className="fas fa-check-circle text-green-500"></i>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              <i className="fas fa-info-circle mr-1"></i>
                              Facture sera automatiquement envoyée à cette adresse
                            </p>
                          </div>
                        ) : (
                          <input
                            type="email"
                            required
                            value={orderData.customerInfo.email}
                            onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="votre@email.com"
                          />
                        )}
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

                    {currentStep === 2 && (
                      <div className="flex justify-end mt-6">
                        <button
                          type="button"
                          onClick={nextStep}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Continuer
                          <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Shipping Address & Payment */}
                {currentStep >= 3 && (
                  <>
                    {/* Shipping Address */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                          <i className="fas fa-truck mr-2 text-green-600"></i>
                          Adresse de livraison
                        </h2>
                        {currentStep > 3 && (
                          <button
                            type="button"
                            onClick={prevStep}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <i className="fas fa-arrow-left mr-1"></i>
                            Retour
                          </button>
                        )}
                      </div>
                      
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
                  </>
                )}
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

                  {/* Progress Information for Non-Logged Users */}
                  {!user && currentStep < 3 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-blue-700 font-medium mb-2">
                          {currentStep === 1 && 'Choisissez votre type de client'}
                          {currentStep === 2 && 'Complétez vos informations'}
                        </div>
                        <div className="text-sm text-blue-600">
                          Étape {currentStep} sur 3
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Place Order Button - Only show on step 3 */}
                  {currentStep >= 3 && (
                    <>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-4"
                      >
                        {isSubmitting ? (
                          <>
                            {invoiceStatus === 'sending' ? (
                              <>
                                <i className="fas fa-envelope fa-spin mr-2"></i>
                                Envoi de la facture...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Traitement en cours...
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-lock mr-2"></i>
                            Confirmer la commande
                          </>
                        )}
                      </button>

                      {/* Invoice Status for Authenticated Users */}
                      {user && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center text-blue-700">
                            <i className="fas fa-file-invoice mr-2"></i>
                            <span className="text-sm font-medium">
                              La facture sera automatiquement envoyée à {user.email}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

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
