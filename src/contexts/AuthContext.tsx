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
  resendVerificationEmail: () => Promise<boolean>
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
      
      // First check if user exists in database and if email is verified
      const dbUser = await appwrite.getCustomerByEmail(email)
      
      if (dbUser && !dbUser.email_verified) {
        throw new Error('EMAIL_NOT_VERIFIED|Votre email n\'est pas encore vérifié. Veuillez vérifier votre boîte de réception.')
      }
      
      // If email is verified in database, create Auth session
      // First try to login with Appwrite Auth
      try {
        await appwrite.login(email, password)
      } catch (authError: any) {
        // If user doesn't exist in Auth but exists in DB with verified email, create Auth user
        if (authError.message && authError.message.includes('Invalid credentials') && dbUser && dbUser.email_verified) {
          console.log('Creating Auth user from verified DB user...')
          try {
            await appwrite.createAuthFromDbUser(email, password)
            // Now try login again
            await appwrite.login(email, password)
          } catch (createError) {
            console.error('Failed to create Auth user:', createError)
            throw authError // Throw original auth error
          }
        } else {
          throw authError
        }
      }
      
      const currentUser = await appwrite.getCurrentUser()
      setUser(currentUser as User)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const resendVerificationEmail = async () => {
    try {
      if (!user?.email) {
        throw new Error('Aucun email trouvé')
      }
      
      const emailService = (await import('@/lib/emailService')).EmailService.getInstance()
      const result = await emailService.resendVerificationEmail(user.email)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      return true
    } catch (error) {
      console.error('Resend verification error:', error)
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
      
      // Create user in database first (don't create in Appwrite Auth yet)
      let dbUserId: string
      
      if (additionalData) {
        // Use registerWithDetails but modified to not create Auth user
        const nameParts = name.trim().split(' ')
        const firstName = additionalData.firstName || nameParts[0] || 'Utilisateur'
        const lastName = additionalData.lastName || nameParts.slice(1).join(' ') || 'Inconnu'
        
        const generatePasswordHash = (email: string, password: string) => {
          const salt = Math.random().toString(36).substring(2, 15)
          const hash = btoa(`${email}:${password}:${salt}`).substring(0, 60)
          return `$2y$10$${hash}`
        }
        
        const passwordHash = generatePasswordHash(email, password)
        
        const userProfileData = {
          first_name: (additionalData.accountType === 'individual' && firstName && firstName.trim()) ? firstName.trim() : '',
          last_name: (additionalData.accountType === 'individual' && lastName && lastName.trim()) ? lastName.trim() : '',
          email: email,
          phone: additionalData.phone || '',
          password_hash: passwordHash,
          email_verified: false,
          email_verification_token: '',
          password_reset_token: '',
          password_reset_expires: '',
          last_login: '',
          login_attempts: 0,
          locked_until: '',
          newsletter_subscribed: false,
          account_type: additionalData.accountType || 'individual',
          status: 'active',
          address: additionalData.address || '',
          postalCode: additionalData.postalCode || '',
          city: additionalData.city || '',
          country: additionalData.country || 'France',
          raison_sociale: (additionalData.accountType === 'professional' && additionalData.raisonSociale && additionalData.raisonSociale.trim()) ? additionalData.raisonSociale.trim() : '',
          siret: (additionalData.accountType === 'professional' && additionalData.siret && additionalData.siret.trim()) ? additionalData.siret.trim() : '',
          tva_number: (additionalData.accountType === 'professional' && additionalData.tvaNumber && additionalData.tvaNumber.trim()) ? additionalData.tvaNumber.trim() : '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const dbUser = await appwrite.createCustomer(userProfileData)
        dbUserId = dbUser.$id
      } else {
        // Simple registration
        const nameParts = name.trim().split(' ')
        const firstName = nameParts[0] || 'Utilisateur'
        const lastName = nameParts.slice(1).join(' ') || 'Inconnu'
        
        const generatePasswordHash = (email: string, password: string) => {
          const salt = Math.random().toString(36).substring(2, 15)
          const hash = btoa(`${email}:${password}:${salt}`).substring(0, 60)
          return `$2y$10$${hash}`
        }
        
        const passwordHash = generatePasswordHash(email, password)
        
        const userProfileData = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: '',
          password_hash: passwordHash,
          email_verified: false,
          email_verification_token: '',
          password_reset_token: '',
          password_reset_expires: '',
          last_login: '',
          login_attempts: 0,
          locked_until: '',
          newsletter_subscribed: false,
          account_type: 'individual',
          status: 'active',
          address: '',
          postalCode: '',
          city: '',
          country: 'France',
          raison_sociale: '',
          siret: '',
          tva_number: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const dbUser = await appwrite.createCustomer(userProfileData)
        dbUserId = dbUser.$id
      }
      
      // Send verification email via Resend
      const emailService = (await import('@/lib/emailService')).EmailService.getInstance()
      const emailResult = await emailService.sendVerificationEmail(email, dbUserId)
      
      if (!emailResult.success) {
        console.error('⚠️ Failed to send verification email:', emailResult.message)
      }
      
      // Throw special error to inform user about email verification
      throw new Error('EMAIL_VERIFICATION_REQUIRED|Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception avant de vous connecter.')
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Erreur lors de la création du compte'
      
      if (error?.message) {
        // Special case: EMAIL_VERIFICATION_REQUIRED is not an error, it's expected
        if (error.message.includes('EMAIL_VERIFICATION_REQUIRED')) {
          throw error // Re-throw as-is for the UI to handle
        } else if (error.message === 'ACCOUNT_CREATED_LOGIN_REQUIRED') {
          throw error // Re-throw as-is for the UI to handle
        } else if (error.message.includes('user_already_exists') || 
            error.message.includes('A user with the same') || 
            error.message.includes('already exists') ||
            error.message.includes('Document with the requested ID already exists')) {
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
    resendVerificationEmail,
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
