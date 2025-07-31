'use client'

import { useState } from 'react'
import Link from 'next/link'
import AdminGuard, { useAdminAuth } from '@/components/AdminGuard'

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAdminAuth()

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout()
    }
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
                  <span className="font-medium">{user?.name || 'Admin'}</span>
                  <i className="fas fa-chevron-down ml-1 text-sm"></i>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user?.name || 'Admin'}</div>
                    <div className="text-gray-500">{user?.email || ''}</div>
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

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminGuard>
  )
}