'use client'

import { useEffect, useState } from 'react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    averageOrder: 0
  })

  const customersPerPage = 10

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, statusFilter, searchTerm])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const queries = [
        appwrite.Query.orderDesc('$createdAt'),
        appwrite.Query.limit(customersPerPage),
        appwrite.Query.offset((currentPage - 1) * customersPerPage)
      ]

      if (statusFilter !== 'all') {
        queries.push(appwrite.Query.equal('status', statusFilter))
      }

      if (searchTerm) {
        queries.push(appwrite.Query.or([
          appwrite.Query.search('first_name', searchTerm),
          appwrite.Query.search('last_name', searchTerm),
          appwrite.Query.search('email', searchTerm)
        ]))
      }

      const result = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        queries
      )
      
      setCustomers(result.documents as unknown as Customer[])
      setTotalPages(Math.ceil(result.total / customersPerPage))

      // Fetch stats for all customers
      const allCustomersResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [appwrite.Query.limit(1000)]
      )

      const allCustomers = allCustomersResult.documents as unknown as Customer[]
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const newThisMonth = allCustomers.filter(customer => {
        if (!customer.created_at) return false
        const createdDate = new Date(customer.created_at)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      const totalSpent = allCustomers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0)
      const totalOrders = allCustomers.reduce((sum, customer) => sum + (customer.total_orders || 0), 0)

      setCustomerStats({
        total: allCustomers.length,
        active: allCustomers.filter(customer => (customer.status || 'active') === 'active').length,
        newThisMonth: newThisMonth,
        averageOrder: totalOrders > 0 ? totalSpent / totalOrders : 0
      })

    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="blocked">Bloqué</option>
            </select>
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
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            title="Envoyer email"
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                          <select
                            value={customer.status || 'active'}
                            onChange={(e) => updateCustomerStatus(customer.$id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-1 py-1"
                          >
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="blocked">Bloqué</option>
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
