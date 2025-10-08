'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface User {
  $id: string
  name: string
  email: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Temporarily bypass auth for testing
    // checkAuth()
    setLoading(false)
    setUser({ $id: 'temp', name: 'Admin Test', email: 'admin@test.com' })
  }, [])

  const checkAuth = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const currentUser = await appwrite.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser as User)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.logout()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <div className="ml-4 flex items-center">
                <div className="bg-yellow-500 p-2 rounded-lg mr-3">
                  <i className="fas fa-hammer text-white"></i>
                </div>
                <h1 className="text-xl font-bold text-gray-900">SHOPBATI Admin</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                target="_blank"
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                Voir le site
              </Link>
              
              <div className="relative group">
                <button className="flex items-center text-gray-700 hover:text-gray-900">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <i className="fas fa-chevron-down ml-1 text-sm"></i>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-gray-500">{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 min-h-screen transition-all duration-300`}>
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              <Link
                href="/admin"
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <i className="fas fa-chart-bar text-lg"></i>
                {sidebarOpen && <span className="ml-3">Tableau de bord</span>}
              </Link>
              
              <Link
                href="/admin/products"
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <i className="fas fa-box text-lg"></i>
                {sidebarOpen && <span className="ml-3">Produits</span>}
              </Link>
              
              <Link
                href="/admin/categories"
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <i className="fas fa-tags text-lg"></i>
                {sidebarOpen && <span className="ml-3">Catégories</span>}
              </Link>
              
              <Link
                href="/admin/orders"
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <i className="fas fa-shopping-cart text-lg"></i>
                {sidebarOpen && <span className="ml-3">Commandes</span>}
              </Link>
              
              <Link
                href="/admin/customers"
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <i className="fas fa-users text-lg"></i>
                {sidebarOpen && <span className="ml-3">Clients</span>}
              </Link>
              
              <Link
                href="/admin/settings"
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <i className="fas fa-cog text-lg"></i>
                {sidebarOpen && <span className="ml-3">Paramètres</span>}
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
