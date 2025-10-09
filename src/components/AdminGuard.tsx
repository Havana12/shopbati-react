'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AdminUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      
      if (!token) {
        router.push('/admin-login')
        return
      }

      // Vérifier le token avec l'API
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
      } else {
        // Token invalide, supprimer et rediriger
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        router.push('/admin-login')
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/admin-login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des autorisations...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Redirection en cours
  }

  return <>{children}</>
}

// Hook pour utiliser les données admin dans les composants
export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('admin_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin-login'
  }

  return { user, logout }
}
