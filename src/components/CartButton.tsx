'use client'

import { useCart } from '@/contexts/CartContext'

export default function CartButton() {
  const { state, toggleCart } = useCart()

  return (
    <button 
      onClick={toggleCart}
      className="flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer relative group transition-all duration-200"
    >
      {/* Cart Icon */}
      <div className="relative mb-1">
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
        
        {/* Badge */}
        {state.itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold min-w-[1.25rem] h-5 rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
            {state.itemCount > 99 ? '99+' : state.itemCount}
          </span>
        )}
      </div>
      
      {/* Text */}
      <div className="text-xs text-center">
        <div className="font-medium">MON PANIER</div>
        <div className="text-orange-500 flex items-center justify-center">
          {state.itemCount > 0 ? (
            <span className="font-bold">{state.itemCount} article{state.itemCount > 1 ? 's' : ''}</span>
          ) : (
            <span>Vide</span>
          )}
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
