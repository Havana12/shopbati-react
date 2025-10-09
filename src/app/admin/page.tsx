'use client'

import { useEffect, useState } from 'react'
import { AppwriteService } from '@/lib/appwrite'

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalOrders: number
  totalRevenue: number
  recentOrders: any[]
  popularProducts: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    popularProducts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Fetch products count
      const productsResult = await appwrite.getProducts([
        appwrite.Query.equal('status', 'active')
      ])
      
      // Fetch categories count
      const categoriesResult = await appwrite.getCategories([
        appwrite.Query.equal('status', 'active')
      ])

      // Try to fetch orders and customers (will use fallback if collections don't exist)
      let ordersCount = 0
      let totalRevenue = 0
      let recentOrdersList = []
      
      try {
        const ordersResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'orders',
          [appwrite.Query.limit(100)]
        )
        ordersCount = ordersResult.total
        totalRevenue = ordersResult.documents.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
        recentOrdersList = ordersResult.documents.slice(0, 3).map((order: any) => ({
          id: order.order_number || order.$id,
          customer: order.customer_name || 'Client inconnu',
          amount: order.total_amount || 0,
          status: order.status || 'pending'
        }))
      } catch (error) {
        console.log('Orders collection not available, using fallback data')
      }

      setStats({
        totalProducts: productsResult.total || 0,
        totalCategories: categoriesResult.total || 0,
        totalOrders: ordersCount,
        totalRevenue: totalRevenue,
        recentOrders: recentOrdersList.length > 0 ? recentOrdersList : [
          { id: 'Demo-001', customer: 'Commande de démonstration', amount: 234.50, status: 'completed' },
          { id: 'Demo-002', customer: 'Exemple de commande', amount: 156.00, status: 'pending' }
        ],
        popularProducts: productsResult.documents?.slice(0, 5) || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback data if everything fails
      setStats({
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: [],
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <i className="fas fa-euro-sign text-yellow-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">
            <i className="fas fa-arrow-up mr-1"></i>
            +15% ce mois
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Commandes récentes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{order.amount}€</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'completed' ? 'Terminée' :
                       order.status === 'pending' ? 'En attente' : 'En cours'}
                    </span>
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
