'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'

interface Order {
  $id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  status: string
  payment_status: string
  payment_method?: string
  shipping_address: string
  billing_address?: string
  items: OrderItem[]
  notes?: string
  created_at: string
  updated_at: string
}

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  total: number
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orderStats, setOrderStats] = useState({
    delivered: 0,
    cancelled: 0,
    monthlyRevenue: 0
  })

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const ordersPerPage = 10

  // Helper function for status labels
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': '⏳ En attente',
      'processing': '⚙️ En cours', 
      'delivered': '📦 Livré',
      'livré': '📦 Livré', // Add French version
      'cancelled': '❌ Annulé'
    }
    return labels[status] || status
  }

  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter, paymentFilter, dateFilter, debouncedSearchTerm, sortBy])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const queries = [
        appwrite.Query.orderDesc('$createdAt'),
        appwrite.Query.limit(ordersPerPage),
        appwrite.Query.offset((currentPage - 1) * ordersPerPage)
      ]

      if (statusFilter !== 'all') {
        queries.push(appwrite.Query.equal('status', statusFilter))
      }

      if (paymentFilter !== 'all') {
        queries.push(appwrite.Query.equal('payment_status', paymentFilter))
      }

      if (dateFilter !== 'all') {
        const today = new Date()
        let startDate = new Date()
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'week':
            startDate.setDate(today.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(today.getMonth() - 1)
            break
          case 'quarter':
            startDate.setMonth(today.getMonth() - 3)
            break
        }
        
        queries.push(appwrite.Query.greaterThanEqual('$createdAt', startDate.toISOString()))
      }

      if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
        queries.push(appwrite.Query.or([
          appwrite.Query.contains('order_number', debouncedSearchTerm),
          appwrite.Query.contains('customer_name', debouncedSearchTerm),
          appwrite.Query.contains('customer_email', debouncedSearchTerm)
        ]))
      }

      const result = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        queries
      )
      
      setOrders(result.documents as unknown as Order[])
      setTotalPages(Math.ceil(result.total / ordersPerPage))

      // Fetch stats for all orders
      const allOrdersResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        [appwrite.Query.limit(1000)]
      )

      const allOrders = allOrdersResult.documents as unknown as Order[]
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      setOrderStats({
        delivered: allOrders.filter(order => order.status === 'delivered' || order.status === 'livré').length,
        cancelled: allOrders.filter(order => order.status === 'cancelled').length,
        monthlyRevenue: allOrders
          .filter(order => {
            const orderDate = new Date(order.created_at)
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
          })
          .reduce((sum, order) => sum + (order.total_amount || 0), 0)
      })

    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Préparer les données de mise à jour
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // Si le statut devient "livré", mettre automatiquement payment_status à "payé"
      if (newStatus === 'livré') {
        updateData.payment_status = 'payé'
      }
      
      // Si le statut devient "cancelled", mettre automatiquement payment_status à "cancelled"
      if (newStatus === 'cancelled') {
        updateData.payment_status = 'cancelled'
      }
      
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        orderId,
        updateData
      )
      
      fetchOrders()
      if (selectedOrder && selectedOrder.$id === orderId) {
        setSelectedOrder(prev => prev ? { 
          ...prev, 
          status: newStatus,
          payment_status: newStatus === 'livré' ? 'payé' : newStatus === 'cancelled' ? 'cancelled' : prev.payment_status
        } : null)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
      case 'livré': // Add French version
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'payé': // Add French version
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des commandes</h1>
          <p className="text-gray-600 mt-2">Suivez et gérez toutes vos commandes</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-check text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Livrés</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="fas fa-times text-red-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Annulés</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-check text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Livrées</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-euro-sign text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CA du mois</p>
              <p className="text-2xl font-bold text-gray-900">€{orderStats.monthlyRevenue.toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-filter mr-2 text-green-500"></i>
            Filtres avancés
          </h3>
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setPaymentFilter('all')
              setDateFilter('all')
              setCurrentPage(1)
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
          >
            <i className="fas fa-times mr-1"></i>
            Effacer tout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Input - Enhanced */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-search mr-1 text-gray-400"></i>
              Recherche
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="N° commande, client, email... (min 2 caractères)"
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <i className="fas fa-times text-gray-400 hover:text-gray-600"></i>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-clipboard-list mr-1 text-gray-400"></i>
              Statut
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Tous</option>
                <option value="livré">📦 Livré</option>
                <option value="cancelled">❌ Annulé</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-credit-card mr-1 text-gray-400"></i>
              Paiement
            </label>
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Tous</option>
                <option value="payé">💳 Payé</option>
                <option value="failed">❌ Échoué</option>
                <option value="cancelled">🚫 Annulé</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-calendar mr-1 text-gray-400"></i>
              Période
            </label>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Toutes</option>
                <option value="today">📅 Aujourd'hui</option>
                <option value="week">📅 Cette semaine</option>
                <option value="month">📅 Ce mois</option>
                <option value="quarter">📅 Ce trimestre</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('livré')}
            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-green-200"
          >
            <i className="fas fa-check mr-1"></i>
            Livrés ({orderStats.delivered})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
          >
            <i className="fas fa-times mr-1"></i>
            Annulés ({orderStats.cancelled})
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-green-200"
          >
            <i className="fas fa-calendar-day mr-1"></i>
            Aujourd'hui
          </button>
          <button
            onClick={() => setPaymentFilter('failed')}
            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
          >
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Paiements échoués
          </button>
          <button
            onClick={() => setPaymentFilter('cancelled')}
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
          >
            <i className="fas fa-ban mr-1"></i>
            Paiements annulés
          </button>
        </div>

        {/* Filter Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Recherche: "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="ml-2 text-blue-600 hover:text-blue-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Statut: {getStatusLabel(statusFilter)}
              <button onClick={() => setStatusFilter('all')} className="ml-2 text-green-600 hover:text-green-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {paymentFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Paiement: {paymentFilter === 'paid' ? 'Payé' : paymentFilter === 'pending' ? 'En attente' : 'Échoué'}
              <button onClick={() => setPaymentFilter('all')} className="ml-2 text-purple-600 hover:text-purple-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {dateFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              Période: {dateFilter === 'today' ? 'Aujourd\'hui' : dateFilter === 'week' ? 'Cette semaine' : dateFilter === 'month' ? 'Ce mois' : 'Ce trimestre'}
              <button onClick={() => setDateFilter('all')} className="ml-2 text-yellow-600 hover:text-yellow-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              <i className="fas fa-info-circle mr-1"></i>
              {loading ? 'Chargement...' : `${orders.length} commande(s) affichée(s)`}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-xs">Trier par:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1"
              >
                <option value="created_at">Date récente</option>
                <option value="total_amount">Montant élevé</option>
                <option value="customer_name">Nom client</option>
                <option value="status">Statut</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des commandes...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-12">
            <i className="fas fa-shopping-cart text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-500">Les commandes de vos clients apparaîtront ici</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paiement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.$id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.order_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items?.length || 0} article(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{(order.total_amount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status === 'paid' || order.payment_status === 'payé' ? 'Payé' : 
                           order.payment_status === 'pending' ? 'En attente' : 
                           order.payment_status === 'cancelled' ? 'Annulé' : 'Échoué'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.$id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="livré">Livré</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> sur{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Détails de la commande #{selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations client</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {selectedOrder.customer_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                    {selectedOrder.customer_phone && (
                      <p><span className="font-medium">Téléphone:</span> {selectedOrder.customer_phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Adresse de livraison</h3>
                  <p className="text-gray-600">{selectedOrder.shipping_address}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Articles commandés</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Produit</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Prix</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Quantité</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">€{item.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">€{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total:</td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900">€{(selectedOrder.total_amount || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
