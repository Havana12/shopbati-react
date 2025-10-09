'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
    setLoading(false)
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('shopbati_cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }

  const updateCart = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart)
    localStorage.setItem('shopbati_cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }

    const updatedCart = cartItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    )
    updateCart(updatedCart)
  }

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.productId !== productId)
    updateCart(updatedCart)
  }

  const clearCart = () => {
    updateCart([])
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Chargement du panier...</p>
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
              <i className="fas fa-shopping-cart mr-3 text-green-600"></i>
              Mon Panier
            </h1>
            <nav className="text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Accueil</Link>
              <span className="mx-2">/</span>
              <span>Panier</span>
            </nav>
          </div>

          {cartItems.length === 0 ? (
            // Empty Cart
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-lg p-12 max-w-md mx-auto">
                <i className="fas fa-shopping-cart text-6xl text-gray-400 mb-6"></i>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Votre panier est vide</h2>
                <p className="text-gray-500 mb-8">Découvrez nos produits et ajoutez-les à votre panier pour continuer vos achats.</p>
                <Link 
                  href="/produits"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors inline-block"
                >
                  <i className="fas fa-store mr-2"></i>Continuer mes achats
                </Link>
              </div>
            </div>
          ) : (
            // Cart with Items
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">
                        Articles ({getTotalItems()})
                      </h2>
                      <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        <i className="fas fa-trash mr-1"></i>Vider le panier
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                            {item.image_url ? (
                              <Image 
                                src={item.image_url} 
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <i className="fas fa-box text-gray-400"></i>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-grow min-w-0">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            <Link 
                              href={`/product/${item.productId}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {item.name}
                            </Link>
                          </h3>
                          <p className="text-lg font-bold text-green-600">
                            {item.price.toFixed(2)}€ <span className="text-sm text-gray-500">l'unité</span>
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-3 py-2 hover:bg-gray-100 transition-colors"
                            >
                              <i className="fas fa-minus text-sm"></i>
                            </button>
                            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-3 py-2 hover:bg-gray-100 transition-colors"
                            >
                              <i className="fas fa-plus text-sm"></i>
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="text-lg font-bold text-gray-800 min-w-[5rem] text-right">
                            {(item.price * item.quantity).toFixed(2)}€
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 hover:text-red-700 p-2"
                            title="Supprimer"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue Shopping */}
                <div className="mt-6">
                  <Link 
                    href="/produits"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>Continuer mes achats
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    <i className="fas fa-receipt mr-2"></i>Récapitulatif
                  </h3>

                  {/* Order Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Sous-total ({getTotalItems()} articles)</span>
                      <span>{getTotalPrice().toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Livraison</span>
                      <span className="text-green-600 font-medium">Gratuite</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total TTC</span>
                        <span className="text-green-600">{getTotalPrice().toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Link
                    href="/checkout"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-bold text-center transition-colors block mb-4"
                  >
                    <i className="fas fa-lock mr-2"></i>Procéder au paiement
                  </Link>

                  {/* Security Badges */}
                  <div className="border-t pt-4">
                    <div className="text-center text-sm text-gray-500 mb-2">Paiement 100% sécurisé</div>
                    <div className="flex justify-center space-x-2">
                      <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        <i className="fab fa-cc-visa"></i> VISA
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        <i className="fab fa-cc-mastercard"></i> MC
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        <i className="fab fa-paypal"></i> PayPal
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-truck text-blue-600 mt-1"></i>
                      <div>
                        <h4 className="font-semibold text-blue-800">Livraison express</h4>
                        <p className="text-sm text-blue-600">
                          Commandez avant 16h, livré demain pour les pros avec notre service drive gratuit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
