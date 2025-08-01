'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { AppwriteService } from '@/lib/appwrite'

interface User {
  $id: string
  name: string
  email: string
  emailVerification: boolean
  prefs: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, additionalData?: {
    firstName?: string
    lastName?: string 
    phone?: string
    accountType?: string
    address?: string
    postalCode?: string
    city?: string
    country?: string
    raisonSociale?: string
    siret?: string
    tvaNumber?: string
  }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const currentUser = await appwrite.getCurrentUser()
      if (currentUser) {
        setUser(currentUser as User)
      }
    } catch (error) {
      console.log('No authenticated user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.login(email, password)
      const currentUser = await appwrite.getCurrentUser()
      setUser(currentUser as User)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, additionalData?: {
    firstName?: string
    lastName?: string 
    phone?: string
    accountType?: string
    address?: string
    postalCode?: string
    city?: string
    country?: string
    raisonSociale?: string
    siret?: string
    tvaNumber?: string
  }) => {
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Clear any existing session first
      try {
        await appwrite.logout()
      } catch (logoutError) {
        // Ignore logout errors (probably no session to logout)
        console.log('No existing session to logout')
      }
      
      // If additional data is provided, use enhanced registration
      if (additionalData) {
        const result = await appwrite.registerWithDetails(
          email, 
          password, 
          additionalData.firstName || '',
          additionalData.lastName || '',
          additionalData.phone || '',
          additionalData.accountType || 'individual',
          additionalData.address || '',
          additionalData.postalCode || '',
          additionalData.city || '',
          additionalData.country || 'France',
          additionalData.raisonSociale || '',
          additionalData.siret || '',
          additionalData.tvaNumber || ''
        )
        
        // Check if this is a successful account creation but requires manual login
        if (result && (result as any).requiresManualLogin) {
          throw new Error('ACCOUNT_CREATED_LOGIN_REQUIRED')
        }
      } else {
        const result = await appwrite.register(email, password, name)
        
        // Check if this is a successful account creation but requires manual login
        if (result && (result as any).requiresManualLogin) {
          throw new Error('ACCOUNT_CREATED_LOGIN_REQUIRED')
        }
      }
      
      const currentUser = await appwrite.getCurrentUser()
      setUser(currentUser as User)
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Erreur lors de la création du compte'
      
      if (error?.message) {
        // Special case: don't modify ACCOUNT_CREATED_LOGIN_REQUIRED message
        if (error.message === 'ACCOUNT_CREATED_LOGIN_REQUIRED') {
          throw error // Re-throw as-is for the UI to handle
        } else if (error.message.includes('user_already_exists') || 
            error.message.includes('A user with the same') || 
            error.message.includes('already exists')) {
          errorMessage = 'Cette adresse email existe déjà dans le système. Essayez de vous connecter ou contactez le support.'
        } else if (error.message.includes('mot de passe différent')) {
          errorMessage = error.message // Use the detailed message from Appwrite service
        } else if (error.message.includes('Invalid `userId` param') || 
                   error.message.includes('userId')) {
          errorMessage = 'Erreur de configuration du compte. Veuillez réessayer.'
        } else if (error.message.includes('password') && error.message.includes('length')) {
          errorMessage = 'Le mot de passe doit contenir au moins 8 caractères'
        } else if (error.message.includes('email') && error.message.includes('invalid')) {
          errorMessage = 'Format d\'email invalide'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet'
        } else if (error.message.includes('Rate limit') || error.message.includes('rate limit') || error.message.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.'
        } else {
          errorMessage = error.message // Don't add "Erreur:" prefix
        }
      }
      
      const customError = new Error(errorMessage)
      throw customError
    }
  }

  const logout = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
