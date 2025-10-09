'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'

// Types
export interface CartItem {
  $id: string
  name: string
  price: number
  image_url?: string
  quantity: number
  brand?: string
  category_name?: string
  description: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false
}

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.$id === action.payload.$id)
      let newItems: CartItem[]
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.$id === action.payload.$id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }]
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: newItems, total, itemCount }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.$id !== action.payload)
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: newItems, total, itemCount }
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id })
      }
      
      const newItems = state.items.map(item =>
        item.$id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: newItems, total, itemCount }
    }
    
    case 'CLEAR_CART':
      return { ...state, items: [], total: 0, itemCount: 0 }
    
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }
    
    case 'OPEN_CART':
      return { ...state, isOpen: true }
    
    case 'CLOSE_CART':
      return { ...state, isOpen: false }
    
    case 'LOAD_CART': {
      const total = action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: action.payload, total, itemCount }
    }
    
    default:
      return state
  }
}

// Context
const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
} | null>(null)

// Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { showToast, ToastContainer } = useToast()
  
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopbati-cart')
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart) as CartItem[]
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopbati-cart', JSON.stringify(state.items))
  }, [state.items])
  
  // Helper functions
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const existingItem = state.items.find(cartItem => cartItem.$id === item.$id)
    dispatch({ type: 'ADD_ITEM', payload: item })
    
    // Toast notifications removed as requested
  }
  
  const removeItem = (id: string) => {
    const item = state.items.find(cartItem => cartItem.$id === id)
    dispatch({ type: 'REMOVE_ITEM', payload: id })
    if (item) {
      showToast(`"${item.name}" retiré du panier`, 'info')
    }
  }
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    showToast('Panier vidé', 'info')
  }
  
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' })
  }
  
  const openCart = () => {
    dispatch({ type: 'OPEN_CART' })
  }
  
  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' })
  }
  
  return (
    <CartContext.Provider 
      value={{
        state,
        dispatch,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart
      }}
    >
      {children}
      <ToastContainer />
    </CartContext.Provider>
  )
}

// Hook
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
