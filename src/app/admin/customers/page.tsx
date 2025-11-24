'use client'

import { useEffect, useState, useMemo } from 'react'
import { AppwriteService } from '@/lib/appwrite'

interface Customer {
  $id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  total_orders: number
  total_spent: number
  last_order_date?: string
  status: string
  created_at: string
  updated_at: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [spendingFilter, setSpendingFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    averageOrder: 0
  })

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const customersPerPage = 10

  // Calculate additional customer metrics
  const customerMetrics = useMemo(() => {
    if (!customers.length) return { highValue: 0, recent: 0, locations: [] }
    
    const highValue = customers.filter(c => (c.total_spent || 0) > 500).length
    const recent = customers.filter(c => {
      if (!c.created_at) return false
      const createdDate = new Date(c.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdDate > thirtyDaysAgo
    }).length
    
    const locations = Array.from(new Set(customers.map(c => c.city).filter(Boolean)))
    
    return { highValue, recent, locations }
  }, [customers])

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, statusFilter, locationFilter, spendingFilter, debouncedSearchTerm, sortBy])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Fetch all orders first
      const ordersResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        [appwrite.Query.limit(5000)]
      )

      let queries = [
        appwrite.Query.limit(customersPerPage),
        appwrite.Query.offset((currentPage - 1) * customersPerPage)
      ]

      // Apply sorting (only for non-calculated fields)
      if (sortBy === 'created_at') {
        queries.push(appwrite.Query.orderDesc('$createdAt'))
      } else if (sortBy === 'last_name') {
        queries.push(appwrite.Query.orderAsc('last_name'))
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        queries.push(appwrite.Query.equal('status', statusFilter))
      }

      // Apply search filter
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
        queries.push(appwrite.Query.or([
          appwrite.Query.contains('first_name', debouncedSearchTerm),
          appwrite.Query.contains('last_name', debouncedSearchTerm),
          appwrite.Query.contains('email', debouncedSearchTerm)
        ]))
      }

      let filteredResults = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        queries
      )

      let customers = filteredResults.documents.map((user: any) => {
        // Calculate stats from orders
        const userOrders = ordersResult.documents.filter((order: any) => 
          order.customer_email === user.email
        )
        
        const paidOrders = userOrders.filter((order: any) => 
          order.status === 'payé' || order.payment_status === 'payé'
        )
        
        const total_orders = paidOrders.length
        const total_spent = paidOrders.reduce((sum: number, order: any) => 
          sum + (order.total_amount || 0), 0
        )
        
        let last_order_date = null
        if (paidOrders.length > 0) {
          const sortedOrders = [...paidOrders].sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || a.$createdAt || 0).getTime()
            const dateB = new Date(b.created_at || b.$createdAt || 0).getTime()
            return dateB - dateA
          })
          last_order_date = sortedOrders[0].created_at || sortedOrders[0].$createdAt
        }
        
        return {
          ...user,
          total_orders,
          total_spent,
          last_order_date
        } as Customer
      })

      // Client-side filtering for spending
      if (spendingFilter !== 'all') {
        customers = customers.filter(customer => {
          const spent = customer.total_spent || 0
          switch (spendingFilter) {
            case 'high': return spent > 500
            case 'medium': return spent >= 100 && spent <= 500
            case 'low': return spent < 100 && spent > 0
            case 'none': return spent === 0
            default: return true
          }
        })
      }

      if (locationFilter !== 'all') {
        customers = customers.filter(customer => customer.city === locationFilter)
      }
      
      // Client-side sorting for calculated fields
      if (sortBy === 'total_spent') {
        customers.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      } else if (sortBy === 'total_orders') {
        customers.sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0))
      }
      
      setCustomers(customers)
      setTotalPages(Math.ceil(filteredResults.total / customersPerPage))

      // Fetch stats for all customers
      const allCustomersResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [appwrite.Query.limit(1000)]
      )

      const allCustomers = allCustomersResult.documents.map((user: any) => {
        const userOrders = ordersResult.documents.filter((order: any) => 
          order.customer_email === user.email
        )
        const paidOrders = userOrders.filter((order: any) => 
          order.status === 'payé' || order.payment_status === 'payé'
        )
        return {
          ...user,
          total_orders: paidOrders.length,
          total_spent: paidOrders.reduce((sum: number, order: any) => 
            sum + (order.total_amount || 0), 0
          )
        }
      })
      
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const newThisMonth = allCustomers.filter((customer: any) => {
        if (!customer.created_at) return false
        const createdDate = new Date(customer.created_at)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      const totalSpent = allCustomers.reduce((sum: number, customer: any) => 
        sum + (customer.total_spent || 0), 0
      )
      const totalOrders = allCustomers.reduce((sum: number, customer: any) => 
        sum + (customer.total_orders || 0), 0
      )

      setCustomerStats({
        total: allCustomers.length,
        active: allCustomers.filter((customer: any) => (customer.status || 'active') === 'active').length,
        newThisMonth: newThisMonth,
        averageOrder: totalOrders > 0 ? totalSpent / totalOrders : 0
      })

    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return
    }
    
    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        customerId
      )
      
      alert('✅ Client supprimé avec succès')
      fetchCustomers()
      if (selectedCustomer && selectedCustomer.$id === customerId) {
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('❌ Erreur lors de la suppression du client')
    }
  }

  const updateCustomerStatus = async (customerId: string, newStatus: string) => {
    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        customerId,
        { 
          status: newStatus,
          updated_at: new Date().toISOString()
        }
      )
      fetchCustomers()
    } catch (error) {
      console.error('Error updating customer status:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const recalculateAllStats = async () => {
    if (!confirm('Voulez-vous recalculer les statistiques de tous les clients basées sur leurs commandes existantes ? Cela peut prendre quelques secondes.')) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/recalculate-customer-stats', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Statistiques recalculées avec succès!\n\n${result.details.usersWithOrders} clients mis à jour sur ${result.details.totalUsers} au total.`)
        fetchCustomers() // Refresh the list
      } else {
        alert('❌ Erreur: ' + result.message)
      }
    } catch (error) {
      console.error('Error recalculating stats:', error)
      alert('❌ Erreur lors du recalcul des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'blocked':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'inactive':
        return 'Inactif'
      case 'blocked':
        return 'Bloqué'
      default:
        return status
    }
  }

  const getCustomerDisplayName = (customer: Customer) => {
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    }
    return 'Nom non disponible'
  }

  const getCustomerInitials = (customer: Customer) => {
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase()
    }
    if (customer.first_name) {
      return customer.first_name[0].toUpperCase()
    }
    if (customer.last_name) {
      return customer.last_name[0].toUpperCase()
    }
    return 'N/A'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-gray-600 mt-2">Gérez votre base de clients SHOPBATI</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporter
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i className="fas fa-envelope mr-2"></i>
            Newsletter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total clients</p>
              <p className="text-2xl font-bold text-gray-900">{customerStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-user-check text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clients actifs</p>
              <p className="text-2xl font-bold text-gray-900">{customerStats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-user-plus text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ce mois</p>
              <p className="text-2xl font-bold text-gray-900">+{customerStats.newThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-euro-sign text-yellow-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">€{customerStats.averageOrder.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-filter mr-2 text-blue-500"></i>
            Filtres avancés
          </h3>
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setLocationFilter('all')
              setSpendingFilter('all')
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
                placeholder="Nom, email, téléphone... (min 2 caractères)"
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
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
              <i className="fas fa-user-check mr-1 text-gray-400"></i>
              Statut
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Tous</option>
                <option value="active">✅ Actif</option>
                <option value="inactive">⏸️ Inactif</option>
                <option value="blocked">🚫 Bloqué</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Spending Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-euro-sign mr-1 text-gray-400"></i>
              Dépenses
            </label>
            <div className="relative">
              <select
                value={spendingFilter}
                onChange={(e) => setSpendingFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Tous</option>
                <option value="high">💎 {'>'}500€</option>
                <option value="medium">💰 100-500€</option>
                <option value="low">💸 {'<'}100€</option>
                <option value="none">🆕 Aucune</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-map-marker-alt mr-1 text-gray-400"></i>
              Ville
            </label>
            <div className="relative">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Toutes</option>
                {customerMetrics.locations.slice(0, 10).map(city => (
                  <option key={city} value={city}>📍 {city}</option>
                ))}
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
            onClick={() => setStatusFilter('active')}
            className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-green-200"
          >
            <i className="fas fa-user-check mr-1"></i>
            Actifs ({customerStats.active})
          </button>
          <button
            onClick={() => setSpendingFilter('high')}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-purple-200"
          >
            <i className="fas fa-gem mr-1"></i>
            VIP ({customerMetrics.highValue})
          </button>
          <button
            onClick={() => {
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              setSearchTerm('')
              setStatusFilter('all')
            }}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-200"
          >
            <i className="fas fa-user-plus mr-1"></i>
            Nouveaux ({customerMetrics.recent})
          </button>
          <button
            onClick={() => setSpendingFilter('none')}
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-yellow-200"
          >
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Sans commande
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
          {spendingFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Dépenses: {spendingFilter === 'high' ? '>500€' : spendingFilter === 'medium' ? '100-500€' : spendingFilter === 'low' ? '<100€' : 'Aucune'}
              <button onClick={() => setSpendingFilter('all')} className="ml-2 text-purple-600 hover:text-purple-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {locationFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              Ville: {locationFilter}
              <button onClick={() => setLocationFilter('all')} className="ml-2 text-yellow-600 hover:text-yellow-800">
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
              {loading ? 'Chargement...' : `${customers.length} client(s) affiché(s)`}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-xs">Trier par:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1"
              >
                <option value="created_at">Date récente</option>
                <option value="total_spent">Plus dépensé</option>
                <option value="total_orders">Plus commandes</option>
                <option value="last_name">Nom A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des clients...</p>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center p-12">
            <i className="fas fa-users text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun client trouvé</h3>
            <p className="text-gray-500">Les clients apparaîtront ici après leurs premières commandes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commandes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total dépensé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière commande
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.$id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {getCustomerInitials(customer)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getCustomerDisplayName(customer)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Client depuis {customer.created_at ? new Date(customer.created_at).getFullYear() : 'Date inconnue'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email || 'Email non disponible'}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.total_orders || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{(customer.total_spent || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status || 'active')}`}>
                          {getStatusLabel(customer.status || 'active')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.last_order_date 
                          ? new Date(customer.last_order_date).toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-blue-600 hover:text-blue-900 p-2"
                            title="Voir détails"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 p-2"
                            title="Envoyer email"
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.$id)}
                            className="text-red-600 hover:text-red-900 p-2"
                            title="Supprimer le client"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
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
                      onClick={() => {
                        setCurrentPage(Math.max(1, currentPage - 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Détails client - {getCustomerDisplayName(selectedCustomer)}
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations personnelles</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {getCustomerDisplayName(selectedCustomer)}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <p><span className="font-medium">Téléphone:</span> {selectedCustomer.phone}</p>
                    )}
                    <p><span className="font-medium">Statut:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.status || 'active')}`}>
                        {getStatusLabel(selectedCustomer.status || 'active')}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Adresse</h3>
                  {selectedCustomer.address ? (
                    <div className="text-gray-600">
                      <p>{selectedCustomer.address}</p>
                      <p>{selectedCustomer.postal_code} {selectedCustomer.city}</p>
                      <p>{selectedCustomer.country}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Aucune adresse renseignée</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistiques</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCustomer.total_orders || 0}</p>
                    <p className="text-sm text-blue-600">Commandes</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">€{(selectedCustomer.total_spent || 0).toFixed(2)}</p>
                    <p className="text-sm text-green-600">Total dépensé</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      €{(selectedCustomer.total_orders || 0) > 0 ? ((selectedCustomer.total_spent || 0) / (selectedCustomer.total_orders || 1)).toFixed(2) : '0'}
                    </p>
                    <p className="text-sm text-purple-600">Panier moyen</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates importantes</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Client depuis:</span> {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
                  {selectedCustomer.last_order_date && (
                    <p><span className="font-medium">Dernière commande:</span> {new Date(selectedCustomer.last_order_date).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <i className="fas fa-envelope mr-2"></i>
                  Envoyer un email
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Voir commandes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
