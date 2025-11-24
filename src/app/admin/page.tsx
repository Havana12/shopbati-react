'use client'

import { useEffect, useState } from 'react'
import { AppwriteService } from '@/lib/appwrite'

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalOrders: number
  last7DaysOrders: { date: string; count: number }[]
  popularProducts: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    last7DaysOrders: [],
    popularProducts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Get last 7 days dates
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date
      })

      // Fetch all data in parallel for faster loading
      const [productsResult, categoriesResult, ordersResult, allOrdersLast7Days] = await Promise.all([
        // Products count - only get count
        appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'products',
          [appwrite.Query.equal('status', 'active'), appwrite.Query.limit(1)]
        ).catch(() => ({ total: 0, documents: [] })),
        
        // Categories count - only get count
        appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          [appwrite.Query.equal('status', 'active'), appwrite.Query.limit(1)]
        ).catch(() => ({ total: 0, documents: [] })),
        
        // Orders count - only get count, no documents
        appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'orders',
          [appwrite.Query.limit(1)]
        ).catch(() => ({ total: 0, documents: [] })),
        
        // Get orders from last 7 days
        appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'orders',
          [
            appwrite.Query.greaterThanEqual('$createdAt', last7Days[0].toISOString()),
            appwrite.Query.limit(500)
          ]
        ).catch(() => ({ documents: [] }))
      ])

      // Get popular products (only top 5)
      const popularProductsResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        [appwrite.Query.equal('status', 'active'), appwrite.Query.limit(5)]
      ).catch(() => ({ documents: [] }))

      // Count orders per day
      const ordersPerDay = last7Days.map(date => {
        const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        
        const count = (allOrdersLast7Days.documents || []).filter((order: any) => {
          const orderDate = new Date(order.$createdAt || order.created_at)
          return orderDate >= startOfDay && orderDate <= endOfDay
        }).length
        
        return { date: dateStr, count }
      })

      setStats({
        totalProducts: productsResult.total || 0,
        totalCategories: categoriesResult.total || 0,
        totalOrders: ordersResult.total || 0,
        last7DaysOrders: ordersPerDay,
        popularProducts: popularProductsResult.documents?.slice(0, 5) || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats({
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        last7DaysOrders: [],
        popularProducts: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre boutique SHOPBATI</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Produits</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="fas fa-box text-blue-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">
            <i className="fas fa-arrow-up mr-1"></i>
            +12% ce mois
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Catégories</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <i className="fas fa-tags text-green-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">
            <i className="fas fa-arrow-up mr-1"></i>
            +2 nouvelles
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <i className="fas fa-shopping-cart text-purple-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">
            <i className="fas fa-arrow-up mr-1"></i>
            +8% cette semaine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders Chart - Last 7 Days */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Commandes des 7 derniers jours</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.last7DaysOrders.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">{day.date}</div>
                  <div className="flex-1 ml-4">
                    <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${day.count > 0 ? (day.count / Math.max(...stats.last7DaysOrders.map(d => d.count))) * 100 : 0}%` }}
                      >
                        {day.count > 0 && (
                          <span className="text-white font-semibold text-sm">{day.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="/admin/orders" className="text-blue-600 hover:text-blue-800 font-medium">
                Voir toutes les commandes →
              </a>
            </div>
          </div>
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Produits populaires</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.popularProducts.map((product: any, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <i className="fas fa-box text-gray-500"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.price}€</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">45 ventes</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="/admin/products" className="text-blue-600 hover:text-blue-800 font-medium">
                Voir tous les produits →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/products/new"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="bg-blue-500 p-2 rounded-lg mr-3">
              <i className="fas fa-plus text-white"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900">Ajouter un produit</p>
              <p className="text-sm text-gray-600">Créer un nouveau produit</p>
            </div>
          </a>

          <a
            href="/admin/categories/new"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="bg-green-500 p-2 rounded-lg mr-3">
              <i className="fas fa-tag text-white"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900">Nouvelle catégorie</p>
              <p className="text-sm text-gray-600">Organiser les produits</p>
            </div>
          </a>

          <a
            href="/admin/orders"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="bg-purple-500 p-2 rounded-lg mr-3">
              <i className="fas fa-list text-white"></i>
            </div>
            <div>
              <p className="font-medium text-gray-900">Gérer les commandes</p>
              <p className="text-sm text-gray-600">Traiter les commandes</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
