'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import { AppwriteService } from '@/lib/appwrite'

interface Product {
  $id: string
  name: string
  description?: string
  price: number
  image_url?: string
  slug?: string
  status: string
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const { state: cartState, toggleCart } = useCart()
  const { user, isAuthenticated, logout } = useAuth()

  const cartItemsCount = cartState.itemCount

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    }, []);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search functionality
  const searchProducts = async (query: string) => {
    console.log('🔍 Starting search for:', query)
    
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      const appwrite = AppwriteService.getInstance()
      let result = null
      
      console.log('📊 Trying search approach 1: Query.search')
      // First try: search by name using Query.search
      try {
        result = await appwrite.getProducts([
          appwrite.Query.search('name', query),
          appwrite.Query.limit(8)
        ])
        console.log('✅ Search query successful:', result)
      } catch (searchError) {
        console.log('❌ Search query failed, trying contains approach:', searchError)
        
        console.log('📊 Trying search approach 2: Query.contains')
        // Second try: search using contains (more reliable)
        try {
          result = await appwrite.getProducts([
            appwrite.Query.contains('name', query),
            appwrite.Query.limit(8)
          ])
          console.log('✅ Contains query successful:', result)
        } catch (containsError) {
          console.log('❌ Contains query failed, trying all products approach:', containsError)
          
          console.log('📊 Trying search approach 3: Client-side filtering')
          // Third try: get all products and filter client-side
          result = await appwrite.getProducts([
            appwrite.Query.limit(50)  // Get more products to filter
          ])
          
          console.log('📊 All products fetched:', result?.documents?.length || 0)
          
          // Filter client-side
          if (result && result.documents) {
            const filteredProducts = result.documents.filter((product: any) => 
              product.name?.toLowerCase().includes(query.toLowerCase()) ||
              product.description?.toLowerCase().includes(query.toLowerCase())
            )
            console.log('✅ Client-side filtering found:', filteredProducts.length, 'products')
            result.documents = filteredProducts.slice(0, 8)
          }
        }
      }

      if (result && result.documents) {
        setSearchResults(result.documents as unknown as Product[])
        console.log(`✅ Final result: Found ${result.documents.length} products for query: "${query}"`)
      } else {
        setSearchResults([])
        console.log(`❌ No products found for query: "${query}"`)
      }
    } catch (error) {
      console.error('❌ Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
    setIsUserDropdownOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsUserDropdownOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Orange Banner */}
      <div className="bg-orange-600 text-white text-center py-2 text-sm font-medium">
        <div className="container mx-auto px-4">
          <span className="font-bold">100% PRO</span> RÉSERVÉ EXCLUSIVEMENT AUX PROFESSIONNELS DU BÂTIMENT
          <div className="float-right">
            <button className="bg-black text-white px-3 py-1 text-xs rounded">
              🇫🇷 SÉLECTIONNER UNE LANGUE ▼
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/logo_shopbat.jpg" 
                alt="SHOPBATI Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="hidden text-2xl font-bold text-black tracking-wide">
                SHOPBATI<span className="text-orange-500">.FR</span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-4xl mx-8" ref={searchDropdownRef}>
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Rechercher un produit, une marque..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-l-lg focus:outline-none focus:border-orange-500"
              />
              <button className="absolute right-0 top-0 h-full px-8 bg-gray-600 hover:bg-gray-700 text-white rounded-r-lg transition-colors">
                <i className="fas fa-search text-lg"></i>
              </button>
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-0 border-gray-300 rounded-b-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Recherche en cours...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((product) => (
                        <Link
                          key={product.$id}
                          href={product.slug && product.slug !== '' ? `/product/${product.slug}` : `/product/${product.$id}`}
                          className="block p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-cube text-gray-400"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-500 truncate">{product.description}</p>
                              <p className="text-lg font-bold text-orange-600">{product.price?.toFixed(2)}€</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <div className="p-3 bg-gray-50 text-center">
                        <Link 
                          href={`/produits?search=${encodeURIComponent(searchQuery)}`}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                          onClick={() => setShowSearchResults(false)}
                        >
                          Voir tous les résultats ({searchResults.length})
                        </Link>
                      </div>
                    </>
                  ) : searchQuery && (
                    <div className="p-4 text-center text-gray-500">
                      Aucun produit trouvé pour "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer">
              <i className="fas fa-warehouse text-xl mb-1"></i>
              <div className="text-xs text-center">
                <div className="font-medium">MON DÉPÔT</div>
                <div className="text-orange-500">Se connecter</div>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer relative" ref={userDropdownRef}>
              <div 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex flex-col items-center"
              >
                <i className="fas fa-user text-xl mb-1"></i>
                <div className="text-xs text-center">
                  <div className="font-medium">MON COMPTE</div>
                  <div className="text-orange-500 flex items-center">
                    {isAuthenticated ? (
                      <span className="truncate max-w-20">{user?.name?.split(' ')[0] || 'Connecté'}</span>
                    ) : (
                      <span>Se connecter</span>
                    )}
                    <i className={`fas fa-chevron-${isUserDropdownOpen ? 'up' : 'down'} ml-1 text-xs`}></i>
                  </div>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link 
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <i className="fas fa-tachometer-alt mr-3 text-blue-500"></i>
                          Tableau de bord
                        </Link>
                        <Link 
                          href="/admin/orders"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <i className="fas fa-shopping-bag mr-3 text-green-500"></i>
                          Mes commandes
                        </Link>
                        <Link 
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <i className="fas fa-user-edit mr-3 text-purple-500"></i>
                          Mon profil
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <i className="fas fa-sign-out-alt mr-3"></i>
                          Déconnexion
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-1">
                      <button 
                        onClick={() => handleAuthClick('login')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <i className="fas fa-sign-in-alt mr-3 text-orange-500"></i>
                        Se connecter
                      </button>
                      <button 
                        onClick={() => handleAuthClick('register')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <i className="fas fa-user-plus mr-3 text-blue-500"></i>
                        Créer un compte
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="px-4 py-2">
                        <p className="text-xs text-gray-500 text-center">
                          <i className="fas fa-info-circle mr-1"></i>
                          Accédez à vos commandes et profitez d'avantages exclusifs
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={toggleCart}
              className="flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer relative"
            >
              <i className="fas fa-shopping-cart text-xl mb-1"></i>
              <div className="text-xs text-center">
                <div className="font-medium">MON PANIER</div>
                <div className="text-orange-500">▼</div>
              </div>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden ml-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className="fas fa-bars text-2xl text-gray-700"></i>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-gray-200 bg-white shadow-sm">
          <div className="hidden md:flex items-center justify-center py-4">
            <div className="flex items-center space-x-2">
              <Link
                href="/"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                ACCUEIL
              </Link>
              <Link
                href="/categories/macon"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                MAÇON
              </Link>
              <Link
                href="/categories/menuisier-serrurerie"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                <div className="text-center leading-tight">
                  <div>MENUISIER</div>
                  <div>SERRURERIE</div>
                </div>
              </Link>
              <Link
                href="/categories/peintre"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                PEINTRE
              </Link>
              <Link
                href="/categories/carreleur"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                CARRELEUR
              </Link>
              <Link
                href="/categories/plomberie"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                PLOMBERIE
              </Link>
              <Link
                href="/categories/chauffage-eau-chaude"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                <div className="text-center leading-tight">
                  <div>CHAUFFAGE EAU</div>
                  <div>CHAUDE</div>
                </div>
              </Link>
              <Link
                href="/categories/sanitaire"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                SANITAIRE
              </Link>
              <Link
                href="/categories/electricien"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                ÉLECTRICIEN
              </Link>
              <Link
                href="/categories/outillage-protection"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                <div className="text-center leading-tight">
                  <div>OUTILLAGE &</div>
                  <div>PROTECTION</div>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex flex-col space-y-2">
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Rechercher un produit, une marque..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <i className="fas fa-search"></i>
                  </button>
                  
                  {/* Mobile Search Results Dropdown */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-0 border-gray-300 rounded-b-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Recherche en cours...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          {searchResults.map((product) => (
                            <Link
                              key={product.$id}
                              href={product.slug && product.slug !== '' ? `/product/${product.slug}` : `/product/${product.$id}`}
                              className="block p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setShowSearchResults(false);
                                setIsMenuOpen(false);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <i className="fas fa-cube text-gray-400 text-sm"></i>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                                  <p className="text-xs text-gray-500 truncate">{product.description}</p>
                                  <p className="text-sm font-bold text-orange-600">{product.price?.toFixed(2)}€</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                          <div className="p-3 bg-gray-50 text-center">
                            <Link 
                              href={`/produits?search=${encodeURIComponent(searchQuery)}`}
                              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                              onClick={() => {
                                setShowSearchResults(false);
                                setIsMenuOpen(false);
                              }}
                            >
                              Voir tous les résultats ({searchResults.length})
                            </Link>
                          </div>
                        </>
                      ) : searchQuery && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Aucun produit trouvé pour "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Mobile Auth Section */}
                {!isAuthenticated ? (
                  <div className="flex space-x-2 mb-4">
                    <button 
                      onClick={() => handleAuthClick('login')}
                      className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      Se connecter
                    </button>
                    <button 
                      onClick={() => handleAuthClick('register')}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      S'inscrire
                    </button>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Connecté</p>
                        <p className="text-xs text-green-600">{user?.name}</p>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="text-red-500 text-sm hover:text-red-600"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
                
                <Link href="/" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  ACCUEIL
                </Link>
                <Link href="/categories/macon" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  MAÇON
                </Link>
                <Link href="/categories/menuisier-serrurerie" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  MENUISIER SERRURERIE
                </Link>
                <Link href="/categories/peintre" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  PEINTRE
                </Link>
                <Link href="/categories/carreleur" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  CARRELEUR
                </Link>
                <Link href="/categories/plomberie" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  PLOMBERIE
                </Link>
                <Link href="/categories/chauffage-eau-chaude" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  CHAUFFAGE EAU CHAUDE
                </Link>
                <Link href="/categories/sanitaire" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  SANITAIRE
                </Link>
                <Link href="/categories/electricien" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  ÉLECTRICIEN
                </Link>
                <Link href="/categories/outillage-protection" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  OUTILLAGE & PROTECTION
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </header>
  )
}
