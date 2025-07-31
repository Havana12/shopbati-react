'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { createOrder, CustomerInfo } from '@/lib/orderService'
import { useToast } from '@/hooks/useToast'
import { AppwriteService } from '@/lib/appwrite'

export function useOrder() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const { state, clearCart, closeCart } = useCart()
  const { showToast } = useToast()

  // Check if user is authenticated using Appwrite
  const checkAuthentication = async (): Promise<CustomerInfo | null> => {
    try {
      const appwrite = AppwriteService.getInstance()
      const currentUser = await appwrite.getCurrentUser()
      
      if (currentUser) {
        // Try to get additional user details from database
        try {
          const dbUser = await appwrite.getCustomerByEmail(currentUser.email)
          return {
            email: currentUser.email,
            name: dbUser ? `${(dbUser as any).first_name} ${(dbUser as any).last_name}`.trim() : currentUser.name,
            isAuthenticated: true
          }
        } catch (dbError) {
          // If can't get DB user, just use auth user
          return {
            email: currentUser.email,
            name: currentUser.name,
            isAuthenticated: true
          }
        }
      }
    } catch (error) {
      console.log('No authenticated user:', error)
    }
    
    return null
  }

  const processOrder = async (email?: string, name?: string, address?: { street: string; city: string; postalCode: string }) => {
    if (state.items.length === 0) {
      showToast('Votre panier est vide', 'error')
      return
    }

    // Check authentication
    const authUser = await checkAuthentication()
    
    if (!authUser && !email) {
      // If not authenticated and no email provided, show the form
      setShowEmailForm(true)
      return
    }

    setIsProcessing(true)

    try {
      let customerInfo: CustomerInfo & { address?: { street: string; city: string; postalCode: string; country: string } }

      if (authUser) {
        customerInfo = authUser
      } else {
        customerInfo = {
          email: email!,
          name,
          isAuthenticated: false,
          // Add address data if provided
          address: address ? {
            street: address.street,
            city: address.city,
            postalCode: address.postalCode,
            country: 'France'
          } : undefined
        }
      }

      // Create the order
      const result = await createOrder(state.items, state.total, customerInfo)

      if (result.success) {
        showToast(
          `Commande ${result.orderId} confirmée ! Un email de confirmation a été envoyé à ${customerInfo.email}`,
          'success'
        )
        clearCart()
        closeCart()
        setShowEmailForm(false)
      } else {
        showToast(result.error || 'Erreur lors de la création de la commande', 'error')
      }
    } catch (error) {
      showToast('Erreur inattendue lors de la commande', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    processOrder,
    isProcessing,
    showEmailForm,
    setShowEmailForm,
    checkAuthentication
  }
}
