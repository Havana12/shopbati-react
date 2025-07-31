'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from 'appwrite'
import { AppwriteService } from '@/lib/appwrite'

interface Product {
  $id: string
  name: string
  price: number
  slug?: string
  status: string
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Mock products for search
  const mockProducts = [
    { $id: '1', name: 'Ciment Portland 25kg', price: 45.99, slug: 'ciment-portland-25kg', status: 'active' },
    { $id: '2', name: 'Briques Rouges', price: 2.50, slug: 'briques-rouges', status: 'active' },
    { $id: '3', name: 'Carrelage Céramique 60x60', price: 25.90, slug: 'carrelage-ceramique', status: 'active' },
    { $id: '4', name: 'Fer à Béton φ12', price: 85.00, slug: 'fer-a-beton', status: 'active' },
    { $id: '5', name: 'Isolant Thermique', price: 35.50, slug: 'isolant-thermique', status: 'active' },
    { $id: '6', name: 'Peinture Blanche 10L', price: 42.00, slug: 'peinture-blanche', status: 'active' }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await AppwriteService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    
    try {
      // Filter mock products based on search query
      const filtered = mockProducts.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) &&
        product.status === 'active'
      ).slice(0, 5)
      
      setSearchResults(filtered)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await AppwriteService.logout()
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">ShopBati</h1>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher des produits..."
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto z-50">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.$id}
                        href={`/product/${product.slug}`}
                        className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                          </div>
                          <div className="text-blue-600 font-semibold">
                            {product.price.toFixed(2)}€
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucun produit trouvé pour "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Accueil
            </Link>
            <Link href="/produits" className="text-gray-700 hover:text-blue-600 font-medium">
              Produits
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium">
              Catégories
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </Link>
            
            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/cart" className="text-gray-700 hover:text-blue-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                </Link>
                <span className="text-gray-700">Bonjour, {user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1">
                Accueil
              </Link>
              <Link href="/produits" className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1">
                Produits
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1">
                Catégories
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1">
                Contact
              </Link>
              
              <div className="border-t pt-3 mt-3">
                {user ? (
                  <div className="space-y-3">
                    <Link href="/cart" className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                      Panier
                    </Link>
                    <p className="text-gray-700 px-2 py-1">Bonjour, {user.name || user.email}</p>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded font-medium"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" className="block text-gray-700 hover:text-blue-600 font-medium px-2 py-1">
                      Connexion
                    </Link>
                    <Link href="/register" className="block bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded font-medium text-center">
                      Inscription
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
