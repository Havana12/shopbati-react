'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import AppwriteService from '@/lib/appwrite'
import { useCart } from '@/contexts/CartContext'

// Product and Category interfaces
interface Product {
  $id: string
  name: string
  description: string
  price: number
  image_url?: string
  slug: string
  status: string
  category_id: string
  category_name?: string
  featured?: boolean
  stock?: number
  brand?: string
  $createdAt: string
  $updatedAt: string
}

interface Category {
  $id: string
  name: string
  slug: string
  status: string
}

export default function ProduitsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProductsInDb, setTotalProductsInDb] = useState(0) // Nouveau state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20
  const { addItem, openCart, state, updateQuantity, removeItem } = useCart()

  // Initialize search term from URL parameters
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      setSearchTerm(searchQuery)
    }
  }, [searchParams])

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const appwrite = AppwriteService.getInstance()
        const result = await appwrite.getAllProducts() // Utiliser la nouvelle méthode
        
        console.log('🔍 Produits récupérés:', result?.total || 0, 'sur', result?.documents?.length || 0)
        
        if (result && result.documents && result.documents.length > 0) {
          const realProducts = (result.documents as unknown as Product[]) || []
          setProducts(realProducts)
          setTotalProductsInDb(result.total) // Stocker le total de la DB
          
          // Set price range based on actual products
          const maxPrice = Math.max(...realProducts.map(p => p.price))
          setPriceRange(prev => ({ ...prev, max: Math.ceil(maxPrice / 100) * 100 }))
          
          console.log('✅ Produits chargés:', realProducts.length, '/', result.total)
        } else {
          console.log('No products found in database')
          setProducts([])
          setTotalProductsInDb(0)
        }

        // Load categories
        try {
          const categoriesResult = await appwrite.getCategories()
          if (categoriesResult?.documents) {
            setCategories(categoriesResult.documents as unknown as Category[])
          } else {
            console.log('No categories found in database')
            setCategories([])
          }
        } catch (catError) {
          console.error('Failed to load categories:', catError)
          setCategories([])
        }
      } catch (error) {
        console.error('Initial data load failed:', error)
        setProducts([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, selectedCategory, sortBy, priceRange])

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Enhanced search - works letter by letter with partial matches (minimum 1 character)
    if (searchTerm && searchTerm.trim().length >= 1) {
      const searchTerms = searchTerm.toLowerCase().trim().split(' ').filter(term => term.length > 0)
      
      filtered = filtered.filter(product => {
        const productName = product.name.toLowerCase()
        const productDescription = product.description.toLowerCase()
        const productBrand = product.brand?.toLowerCase() || ''
        const productCategory = product.category_name?.toLowerCase() || ''
        
        // Check if any search term matches any product field
        return searchTerms.some(term => 
          productName.includes(term) ||
          productDescription.includes(term) ||
          productBrand.includes(term) ||
          productCategory.includes(term) ||
          // Also check for exact word starts (better relevance)
          productName.startsWith(term) ||
          productDescription.startsWith(term) ||
          productBrand.startsWith(term)
        )
      })
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_name === selectedCategory)
    }

    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    )

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        break
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSortBy('name')
    setPriceRange({ min: 0, max: Math.max(...products.map(p => p.price)) })
  }

  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const handleAddToCart = (product: Product) => {
    addItem({
      $id: product.$id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      brand: product.brand,
      category_name: product.category_name,
      description: product.description
    })
  }

  const getProductQuantityInCart = (productId: string) => {
    const item = state.items.find(item => item.$id === productId)
    return item?.quantity || 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      {/* Modern Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              Nos Produits
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8 leading-relaxed">
              Découvrez notre gamme complète de matériaux de construction professionnels
            </p>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
              <span className="text-lg font-semibold">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                {totalProductsInDb > 0 && (
                  <span className="ml-2 text-orange-200 text-sm">
                    ({products.length}/{totalProductsInDb} chargés)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" fill="none" className="w-full h-12 text-gray-50">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
      </section>

      {/* Modern Filters & Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-[1400px]">
          {/* Advanced Filter Bar */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 backdrop-blur-sm">
            <div className="flex flex-col xl:flex-row gap-6 items-center">
              
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 pr-12 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 min-w-[200px]"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((category) => (
                    <option key={category.$id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 pr-12 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 min-w-[200px]"
                >
                  <option value="name">Trier par nom</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="featured">Produits vedettes</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-6 py-4 border border-gray-200">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Prix: €{priceRange.min} - €{priceRange.max}</span>
                <input
                  type="range"
                  min="0"
                  max={Math.max(...products.map(p => p.price)) || 1000}
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-24 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl transition-all duration-200 whitespace-nowrap font-medium"
              >
                Effacer filtres
              </button>
            </div>
          </div>

          {/* Modern Products Grid - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {loading ? (
              [...Array(15)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <div key={product.$id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image_url || '/images/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.featured && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ⭐ Vedette
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        {product.category_name || 'Catégorie'}
                      </span>
                      {product.stock && product.stock < 10 && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          Stock faible
                        </span>
                      )}
                    </div>
                    
                    <Link 
                      href={`/product/${product.slug || product.$id}`}
                      className="block"
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        €{product.price.toFixed(2)}
                      </div>
                      {product.brand && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {getProductQuantityInCart(product.$id) > 0 ? (
                        /* Product already in cart - show quantity controls */
                        <div className="flex-1 flex items-center bg-orange-50 border-2 border-orange-500 rounded-xl overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(product.$id, getProductQuantityInCart(product.$id) - 1)}
                            className="px-3 py-3 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <div className="flex-1 text-center py-3 font-bold text-orange-700">
                            {getProductQuantityInCart(product.$id)}
                          </div>
                          
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="px-3 py-3 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        /* Product not in cart - show add button */
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          </svg>
                          Ajouter au panier
                        </button>
                      )}
                      
                      <Link 
                        href={`/product/${product.slug || product.$id}`}
                        className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-colors group/view"
                      >
                        <svg className="w-5 h-5 text-gray-600 group-hover/view:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
                  <p className="text-gray-600 mb-6">Essayez de modifier vos filtres ou votre recherche</p>
                  <button
                    onClick={clearFilters}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Effacer les filtres
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modern Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center space-x-2 bg-white rounded-2xl shadow-lg p-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                          currentPage === page
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
