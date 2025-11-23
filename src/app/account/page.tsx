'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AppwriteService } from '@/lib/appwrite'
import Link from 'next/link'
import Header from '@/components/Header'

interface Order {
  $id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  items: any[]
  shipping_address: any
}

interface UserProfile {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  account_type: string
  raison_sociale?: string
  siret?: string
  tva_number?: string
}

function AccountContent() {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [activeTab, setActiveTab] = useState('commandes')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    // Set tab from URL parameter
    const tab = searchParams.get('tab')
    if (tab === 'profile') {
      setActiveTab('profile')
    } else {
      setActiveTab('commandes')
    }
  }, [searchParams])

  useEffect(() => {
    if (user && activeTab === 'commandes') {
      loadOrders()
    } else if (user && activeTab === 'profile' && !userProfile) {
      loadUserProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, userProfile])

  const loadUserProfile = async () => {
    if (!user?.email) return
    
    setLoadingProfile(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const dbUser = await appwrite.getCustomerByEmail(user.email)
      if (dbUser) {
        setUserProfile(dbUser as any)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const loadOrders = async () => {
    if (!user?.email) return
    
    setLoadingOrders(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Try "orders" collection first
      try {
        const userOrders = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'orders',
          [
            appwrite.Query.equal('customer_email', user.email),
            appwrite.Query.orderDesc('created_at'),
            appwrite.Query.limit(50)
          ]
        )
        setOrders(userOrders.documents as any)
      } catch (error) {
        // Fallback to "ordres" collection
        const userOrders = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'ordres',
          [
            appwrite.Query.equal('customer_email', user.email),
            appwrite.Query.orderDesc('created_at'),
            appwrite.Query.limit(50)
          ]
        )
        setOrders(userOrders.documents as any)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      'payé': { label: 'Payé', color: 'bg-blue-100 text-blue-800' },
      'expédié': { label: 'Expédié', color: 'bg-green-100 text-green-800' },
      'livré': { label: 'Livré', color: 'bg-green-200 text-green-900' },
      'annulé': { label: 'Annulé', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-user text-orange-600 text-2xl"></i>
                </div>
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('commandes')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'commandes'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-shopping-bag mr-3"></i>
                  Mes Commandes
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-user mr-3"></i>
                  Mon Profil
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {activeTab === 'commandes' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Mes Commandes</h2>
                  
                  {loadingOrders ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement des commandes...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="fas fa-shopping-bag text-6xl text-gray-400 mb-4"></i>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune commande</h3>
                      <p className="text-gray-500 mb-6">Vous n'avez pas encore passé de commande</p>
                      <Link
                        href="/produits"
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
                      >
                        Découvrir nos produits
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.$id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Commande #{order.order_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          
                          <div className="border-t border-gray-200 pt-4">
                            <div className="space-y-2">
                              {order.items && Array.isArray(order.items) ? order.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-700">
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {(item.price * item.quantity).toFixed(2)} €
                                  </span>
                                </div>
                              )) : (
                                typeof order.items === 'string' ? JSON.parse(order.items).map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                      {(item.price * item.quantity).toFixed(2)} €
                                    </span>
                                  </div>
                                )) : null
                              )}
                            </div>
                            
                            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-900">Total</span>
                              <span className="text-lg font-bold text-orange-600">
                                {order.total_amount.toFixed(2)} €
                              </span>
                            </div>
                            
                            {order.shipping_address && (() => {
                              try {
                                const addr = typeof order.shipping_address === 'string' 
                                  ? JSON.parse(order.shipping_address) 
                                  : order.shipping_address
                                
                                const street = addr.street || addr.address || ''
                                const postalCode = addr.postalCode || addr.postal_code || ''
                                const city = addr.city || ''
                                const country = addr.country || ''
                                
                                // Only display if we have at least city or street
                                if (!street && !city) return null
                                
                                const parts = [street, `${postalCode} ${city}`.trim(), country].filter(Boolean)
                                return parts.length > 0 ? (
                                  <div className="mt-4 text-sm text-gray-600">
                                    <i className="fas fa-map-marker-alt mr-2"></i>
                                    {parts.join(', ')}
                                  </div>
                                ) : null
                              } catch {
                                return null
                              }
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Mon Profil</h2>
                  
                  {loadingProfile ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement du profil...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {userProfile?.account_type === 'professional' ? 'Informations Professionnelles' : 'Informations Personnelles'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {userProfile?.account_type === 'professional' && userProfile?.raison_sociale && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Raison Sociale
                              </label>
                              <input
                                type="text"
                                value={userProfile.raison_sociale}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                readOnly
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Prénom
                            </label>
                            <input
                              type="text"
                              value={userProfile?.first_name || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nom
                            </label>
                            <input
                              type="text"
                              value={userProfile?.last_name || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={userProfile?.email || user?.email || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Téléphone
                            </label>
                            <input
                              type="text"
                              value={userProfile?.phone || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          {userProfile?.account_type === 'professional' && (
                            <>
                              {userProfile?.siret && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SIRET
                                  </label>
                                  <input
                                    type="text"
                                    value={userProfile.siret}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    readOnly
                                  />
                                </div>
                              )}
                              {userProfile?.tva_number && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Numéro TVA
                                  </label>
                                  <input
                                    type="text"
                                    value={userProfile.tva_number}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    readOnly
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adresse
                            </label>
                            <input
                              type="text"
                              value={userProfile?.address || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Code Postal
                            </label>
                            <input
                              type="text"
                              value={userProfile?.postalCode || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ville
                            </label>
                            <input
                              type="text"
                              value={userProfile?.city || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pays
                            </label>
                            <input
                              type="text"
                              value={userProfile?.country || 'France'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <i className="fas fa-info-circle mr-2"></i>
                          Pour modifier vos informations, veuillez contacter notre service client.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  )
}
