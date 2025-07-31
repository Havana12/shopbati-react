'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../components/Header'
import { AppwriteService } from '../../../lib/appwrite'
import { useCart } from '../../../contexts/CartContext'

// Product interface
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
  description?: string
  status: string
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category>({ name: '', description: '', $id: '', slug: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20
  const { addItem, openCart, state, updateQuantity, removeItem } = useCart()

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [categorySlug])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, sortBy, priceRange])

  // Test Appwrite connection
  const testAppwriteConnection = async () => {
    try {
      console.log('🧪 Testing Appwrite connection...')
      const appwrite = AppwriteService.getInstance()
      const testResult = await appwrite.getProducts([appwrite.Query.limit(1)])
      console.log('✅ Appwrite connection successful:', testResult)
      return true
    } catch (error) {
      console.error('❌ Appwrite connection failed:', error)
      return false
    }
  }

  // Run connection test on mount
  useEffect(() => {
    testAppwriteConnection()
  }, [])

  const fetchCategoryAndProducts = async () => {
    setLoading(true)
    try {
      // Debug: Check if environment variables are available
      console.log('🌍 Environment check:', {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        hasApiKey: !!process.env.APPWRITE_API_KEY
      })
      
      const appwrite = AppwriteService.getInstance()
      
      // Debug: Log the slug we're searching for
      console.log('🔍 Searching for category slug:', categorySlug)
      
      // Find category by slug
      const categoriesResult = await appwrite.getCategories([
        appwrite.Query.equal('slug', categorySlug)
      ])
      
      console.log('📁 Categories found:', categoriesResult.documents.length)
      console.log('📁 Categories data:', categoriesResult.documents)
      
      if (categoriesResult.documents.length > 0) {
        const foundCategory = categoriesResult.documents[0] as any
        setCategory(foundCategory)
        
        console.log('✅ Found category:', foundCategory)
        console.log('🆔 Category ID:', foundCategory.$id)
        
        // Get products for this category
        const productsResult = await appwrite.getProducts([
          appwrite.Query.equal('category_id', foundCategory.$id),
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.limit(100)
        ])
        
        console.log('🛍️ Products found for category:', productsResult.documents.length)
        console.log('🛍️ Products data:', productsResult.documents)
        
        const categoryProducts = productsResult.documents as unknown as Product[]
        setProducts(categoryProducts)
        
        if (categoryProducts.length > 0) {
          const maxPrice = Math.max(...categoryProducts.map(p => p.price))
          setPriceRange(prev => ({ ...prev, max: Math.ceil(maxPrice / 100) * 100 }))
        }
      } else {
        console.log('❌ No category found by slug, trying by name...')
        
        // Fallback: try to find category by name (case-insensitive)
        const categoryName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
        const categoriesResultByName = await appwrite.getCategories([
          appwrite.Query.equal('name', categoryName)
        ])
        
        console.log('📁 Categories found by name:', categoriesResultByName.documents.length)
        
        if (categoriesResultByName.documents.length > 0) {
          const foundCategory = categoriesResultByName.documents[0] as any
          setCategory(foundCategory)
          
          console.log('✅ Found category by name:', foundCategory)
          
          // Get products for this category
          const productsResult = await appwrite.getProducts([
            appwrite.Query.equal('category_id', foundCategory.$id),
            appwrite.Query.equal('status', 'active'),
            appwrite.Query.limit(100)
          ])
          
          console.log('🛍️ Products found for category (by name):', productsResult.documents.length)
          
          const categoryProducts = productsResult.documents as unknown as Product[]
          setProducts(categoryProducts)
          
          if (categoryProducts.length > 0) {
            const maxPrice = Math.max(...categoryProducts.map(p => p.price))
            setPriceRange(prev => ({ ...prev, max: Math.ceil(maxPrice / 100) * 100 }))
          }
        } else {
          console.log('❌ No category found by name either. Let\'s try to find products by category_name field...')
          
          // Last fallback: search products directly by category_name field
          const productsResult = await appwrite.getProducts([
            appwrite.Query.contains('category_name', categorySlug),
            appwrite.Query.equal('status', 'active'),
            appwrite.Query.limit(100)
          ])
          
          console.log('🛍️ Products found by category_name:', productsResult.documents.length)
          
          if (productsResult.documents.length > 0) {
            const categoryProducts = productsResult.documents as unknown as Product[]
            setProducts(categoryProducts)
            
            if (categoryProducts.length > 0) {
              const maxPrice = Math.max(...categoryProducts.map(p => p.price))
              setPriceRange(prev => ({ ...prev, max: Math.ceil(maxPrice / 100) * 100 }))
            }
          }
          
          // Set fallback category info
          setCategory({ 
            name: categoryName, 
            description: `Produits de ${categoryName}`,
            $id: '',
            slug: categorySlug,
            status: 'active'
          })
        }
      }
    } catch (error) {
      console.error('❌ Error fetching category and products:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error,
        error: error
      })
      
      // Check if it's a network connectivity issue
      if (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      )) {
        console.error('🌐 Network connectivity issue detected')
      }
      
      // Final fallback
      setCategory({ 
        name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1), 
        description: `Produits de ${categorySlug}`,
        $id: '',
        slug: categorySlug,
        status: 'active'
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Enhanced search
    if (searchTerm && searchTerm.trim().length >= 1) {
      const searchTerms = searchTerm.toLowerCase().trim().split(' ').filter(term => term.length > 0)
      
      filtered = filtered.filter(product => {
        const productName = product.name.toLowerCase()
        const productDescription = product.description.toLowerCase()
        const productBrand = product.brand?.toLowerCase() || ''
        
        return searchTerms.some(term => 
          productName.includes(term) ||
          productDescription.includes(term) ||
          productBrand.includes(term) ||
          productName.startsWith(term) ||
          productDescription.startsWith(term) ||
          productBrand.startsWith(term)
        )
      })
    }

    // Price filter
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    )

    // Sort
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
    setSortBy('name')
    setPriceRange({ min: 0, max: Math.max(...products.map(p => p.price)) || 1000 })
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
              {category.name}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8 leading-relaxed">
              {category.description || `Découvrez notre sélection de produits ${category.name.toLowerCase()}`}
            </p>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
              <span className="text-lg font-semibold">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Breadcrumb */}
            <div className="flex items-center justify-center text-orange-200 mt-6">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span className="mx-2">›</span>
              <Link href="/categories" className="hover:text-white transition-colors">Catégories</Link>
              <span className="mx-2">›</span>
              <span className="text-white">{category.name}</span>
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
                        {category.name}
                      </span>
                      {product.stock && product.stock < 10 && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          Stock faible
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                    
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
                        href={`/product/${product.$id}`}
                        className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-colors inline-flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-gray-600 mb-6">
                    {products.length === 0 
                      ? `Aucun produit disponible dans la catégorie "${category.name}"` 
                      : "Essayez de modifier vos critères de recherche"
                    }
                  </p>
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