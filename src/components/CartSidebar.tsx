'use client'

import { useCart } from '@/contexts/CartContext'
import { useState, useEffect } from 'react'
import { useOrder } from '@/hooks/useOrder'
import EmailForm from './EmailForm'
import OrderProcessInfo from './OrderProcessInfo'

export default function CartSidebar() {
  const { state, removeItem, updateQuantity, clearCart, closeCart } = useCart()
  const [isAnimating, setIsAnimating] = useState(false)
  const [showOrderInfo, setShowOrderInfo] = useState(false)
  const { processOrder, isProcessing, showEmailForm, setShowEmailForm } = useOrder()

  useEffect(() => {
    if (state.isOpen) {
      setIsAnimating(true)
    }
  }, [state.isOpen])

  if (!state.isOpen && !isAnimating) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          state.isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          state.isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTransitionEnd={() => {
          if (!state.isOpen) setIsAnimating(false)
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mon Panier</h2>
              <p className="text-orange-100">
                {state.itemCount} article{state.itemCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button 
              onClick={closeCart}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-full">
          {state.items.length === 0 ? (
            /* Empty Cart */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Votre panier est vide</h3>
                <p className="text-gray-500 mb-6">Ajoutez des produits pour commencer vos achats</p>
                <button 
                  onClick={closeCart}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Continuer les achats
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-280px)]">
                {state.items.map((item) => (
                  <div key={item.$id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                          {item.name}
                        </h4>
                        
                        {/* Price */}
                        <div className="mb-2">
                          <p className="font-bold text-gray-900 text-sm">
                            €{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            €{item.price.toFixed(2)} / unité
                          </p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateQuantity(item.$id, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-100 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="font-semibold text-gray-900 text-sm min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <button 
                              onClick={() => updateQuantity(item.$id, item.quantity + 1)}
                              className="w-6 h-6 bg-gray-100 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button 
                            onClick={() => removeItem(item.$id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 bg-white">
                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-700">Total</span>
                    <button
                      onClick={() => setShowOrderInfo(true)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Comment ça marche ?"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    €{state.total.toFixed(2)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    onClick={() => processOrder()}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                        Passer la commande
                      </>
                    )}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={closeCart}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold transition-colors text-sm"
                    >
                      Continuer
                    </button>
                    <button 
                      onClick={clearCart}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-semibold transition-colors text-sm"
                    >
                      Vider
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Email Form Modal */}
      {showEmailForm && (
        <EmailForm
          onSubmit={(email, name, address) => processOrder(email, name, address)}
          onCancel={() => setShowEmailForm(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Order Process Info Modal */}
      {showOrderInfo && (
        <OrderProcessInfo
          isVisible={showOrderInfo}
          onClose={() => setShowOrderInfo(false)}
        />
      )}
    </>
  )
}
