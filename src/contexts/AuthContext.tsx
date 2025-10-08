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
  register: (email: string, password: string, name: string) => Promise<void>
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

  const register = async (email: string, password: string, name: string) => {
    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.register(email, password, name)
      const currentUser = await appwrite.getCurrentUser()
      setUser(currentUser as User)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
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
