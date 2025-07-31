'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { AppwriteService } from '../../../lib/appwrite'

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  
  const [products, setProducts] = useState<any[]>([])
  const [category, setCategory] = useState<any>({ name: '', description: '', $id: '' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [allProducts, setAllProducts] = useState<any[]>([])

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [categorySlug])

  const fetchCategoryAndProducts = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Find category by slug
      const categoriesResult = await appwrite.getCategories([
        appwrite.Query.equal('slug', categorySlug)
      ])
      
      if (categoriesResult.documents.length > 0) {
        const foundCategory = categoriesResult.documents[0] as any
        setCategory(foundCategory)
        
        // Get products for this category
        const productsResult = await appwrite.getProducts([
          appwrite.Query.equal('category_id', foundCategory.$id),
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.limit(100)
        ])
        
        setProducts(productsResult.documents)
        setAllProducts(productsResult.documents)
        
        // Calculate price range from actual products
        if (productsResult.documents.length > 0) {
          const prices = productsResult.documents.map((p: any) => p.price)
          setPriceRange({
            min: Math.floor(Math.min(...prices)),
            max: Math.ceil(Math.max(...prices))
          })
        }
      } else {
        // Fallback: create category from slug
        setCategory({ 
          name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1), 
          description: `Produits de ${categorySlug}`,
          $id: ''
        })
        loadDemoProducts()
      }
    } catch (error) {
      console.error('Error fetching category and products:', error)
      // Fallback to demo products if database fails
      loadDemoProducts()
    } finally {
      setLoading(false)
    }
  }

  const loadDemoProducts = () => {
    // Fallback demo products if database fails
    const demoProducts: any = {
      'macon': [
        {
          $id: '1',
          name: 'Ciment Portland CEM II/A-L 42.5 R - 25kg',
          description: 'Ciment de haute qualité pour béton armé et précontraint.',
          price: 8.95,
          image_url: '',
          status: 'active',
          brand: 'LAFARGE'
        }
      ],
      'menuisier': [
        {
          $id: '2',
          name: 'Vis à bois 4x50mm - Boîte de 200',
          description: 'Vis à tête fraisée pour assemblage bois.',
          price: 12.90,
          image_url: '',
          status: 'active',
          brand: 'SPAX'
        }
      ],
      'carreleur': [
        {
          $id: '3',
          name: 'Carrelage Grès Cérame 60x60cm',
          description: 'Carrelage moderne en grès cérame.',
          price: 25.50,
          image_url: '',
          status: 'active',
          brand: 'PORCELANOSA'
        }
      ]
    }
    
    const categoryProducts = demoProducts[categorySlug] || []
    setProducts(categoryProducts)
    setAllProducts(categoryProducts)
    
    setCategory({ 
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1), 
      description: `Produits de ${categorySlug}`,
      $id: ''
    })
  }

  // Filter and sort products
  useEffect(() => {
    let filtered = [...allProducts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => product.brand === selectedBrand)
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    )

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setProducts(filtered)
  }, [allProducts, searchTerm, selectedBrand, priceRange, sortBy])

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('name')
    setSelectedBrand('all')
    if (allProducts.length > 0) {
      const prices = allProducts.map(p => p.price)
      setPriceRange({
        min: Math.floor(Math.min(...prices)),
        max: Math.ceil(Math.max(...prices))
      })
    }
  }

  const uniqueBrands = [...new Set(allProducts.map(product => product.brand))].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {category.name}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              {category.description || `Découvrez notre sélection de produits ${category.name.toLowerCase()}`}
            </p>
            <div className="flex items-center justify-center text-blue-200">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span className="mx-2">›</span>
              <Link href="/categories" className="hover:text-white transition-colors">Catégories</Link>
              <span className="mx-2">›</span>
              <span className="text-white">{category.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom du produit..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Nom A-Z</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
            </div>

            {/* Brand Filter */}
            {uniqueBrands.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les marques</option>
                  {uniqueBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <i className="fas fa-times mr-2"></i>
                Effacer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des produits...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-box-open text-6xl text-gray-400 mb-6"></i>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">Aucun produit trouvé</h3>
              <p className="text-gray-500 mb-8">
                {allProducts.length === 0 
                  ? `Aucun produit disponible dans la catégorie "${category.name}"` 
                  : "Essayez de modifier vos critères de recherche"
                }
              </p>
              {allProducts.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between mb-8">
                <p className="text-gray-600">
                  {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <div key={product.$id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <i className="fas fa-image text-gray-400 text-3xl"></i>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-blue-600">
                          €{product.price.toFixed(2)}
                        </span>
                        {product.brand && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          <i className="fas fa-cart-plus mr-2"></i>
                          Ajouter
                        </button>
                        <Link
                          href={`/product/${product.$id}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
