'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState({ name: categorySlug, description: '' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [allProducts, setAllProducts] = useState([])

  // Demo products for each category
  const demoProducts = {
    macon: [
      {
        id: '1',
        name: 'Ciment Portland CEM II/A-L 42.5 R - 25kg',
        description: 'Ciment de haute qualité pour béton armé et précontraint. Résistance élevée et prise rapide.',
        price: 8.95,
        image: '/images/cement.jpg',
        stock: 150,
        brand: 'LAFARGE'
      },
      {
        id: '2',
        name: 'Brique Rouge 20x10x5cm',
        description: 'Briques de construction traditionnelles en terre cuite. Résistantes et durables.',
        price: 0.45,
        image: '/images/brick.jpg',
        stock: 2500,
        brand: 'WIENERBERGER'
      }
    ],
    menuisier: [
      {
        id: '3',
        name: 'Vis à bois 4x50mm - Boîte de 200',
        description: 'Vis à tête fraisée pour assemblage bois. Traitement anti-corrosion.',
        price: 12.90,
        image: '/images/screws.jpg',
        stock: 85,
        brand: 'SPAX'
      }
    ],
    'menuisier-serrurerie': [
      {
        id: '3',
        name: 'Vis à bois 4x50mm - Boîte de 200',
        description: 'Vis à tête fraisée pour assemblage bois. Traitement anti-corrosion.',
        price: 12.90,
        image: '/images/screws.jpg',
        stock: 85,
        brand: 'SPAX'
      },
      {
        id: '4',
        name: 'Serrure 3 points FICHET',
        description: 'Serrure haute sécurité certifiée A2P. Installation facile.',
        price: 189.00,
        image: '/images/lock.jpg',
        stock: 25,
        brand: 'FICHET'
      }
    ],
    peintre: [
      {
        id: '5',
        name: 'Peinture Acrylique Blanc Mat 10L',
        description: 'Peinture acrylique de qualité professionnelle. Excellent pouvoir couvrant.',
        price: 45.90,
        image: '/images/paint.jpg',
        stock: 85,
        brand: 'DULUX'
      }
    ],
    carreleur: [
      {
        id: '6',
        name: 'Carrelage Grès Cérame 60x60cm',
        description: 'Carrelage moderne en grès cérame. Facile d\'entretien et résistant.',
        price: 25.50,
        image: '/images/tile.jpg',
        stock: 120,
        brand: 'PORCELANOSA'
      }
    ],
    plomberie: [
      {
        id: '7',
        name: 'Tube PER Ø16mm - Couronne 50m',
        description: 'Tube multicouche pour eau chaude et froide. Résistant et flexible.',
        price: 89.90,
        image: '/images/pipe.jpg',
        stock: 45,
        brand: 'REHAU'
      }
    ],
    'chauffage-eau-chaude': [
      {
        id: '8',
        name: 'Chaudière Gaz Condensation 24kW',
        description: 'Chaudière murale haute performance. Rendement 98%. Garantie 5 ans.',
        price: 1250.00,
        image: '/images/boiler.jpg',
        stock: 8,
        brand: 'VIESSMANN'
      }
    ],
    sanitaire: [
      {
        id: '9',
        name: 'WC Suspendu GEBERIT',
        description: 'Pack WC suspendu avec bâti-support. Design moderne et économe en eau.',
        price: 385.00,
        image: '/images/toilet.jpg',
        stock: 15,
        brand: 'GEBERIT'
      }
    ],
    electricien: [
      {
        id: '10',
        name: 'Tableau Électrique 4 Rangées',
        description: 'Coffret pré-équipé avec disjoncteur différentiel. Norme NF C 15-100.',
        price: 156.00,
        image: '/images/electrical.jpg',
        stock: 32,
        brand: 'LEGRAND'
      }
    ],
    'outillage-protection': [
      {
        id: '11',
        name: 'Casque de Chantier DELTA PLUS',
        description: 'Casque de protection ventilé. Ajustement par molette. Norme EN 397.',
        price: 28.50,
        image: '/images/helmet.jpg',
        stock: 75,
        brand: 'DELTA PLUS'
      }
    ]
  }

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const categoryProducts = demoProducts[categorySlug] || []
      setAllProducts(categoryProducts)
      setProducts(categoryProducts)
      setCategory({
        name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
        description: `Produits professionnels pour ${categorySlug}`
      })
      
      // Set price range based on products
      if (categoryProducts.length > 0) {
        const maxPrice = Math.max(...categoryProducts.map(p => p.price))
        setPriceRange({ min: 0, max: maxPrice })
      }
      
      setLoading(false)
    }, 500)
  }, [categorySlug])

  // Filter and sort products
  useEffect(() => {
    let filtered = [...allProducts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
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

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'stock':
          return b.stock - a.stock
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setProducts(filtered)
  }, [allProducts, searchTerm, selectedBrand, priceRange, sortBy])

  // Get unique brands for filter
  const brands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean)))

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedBrand('all')
    setSortBy('name')
    if (allProducts.length > 0) {
      const maxPrice = Math.max(...allProducts.map(p => p.price))
      setPriceRange({ min: 0, max: maxPrice })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {category.name}
            </h1>
            <p className="text-xl text-orange-100 mb-6">
              {category.description}
            </p>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full inline-block">
              <span className="text-lg font-medium">
                {products.length} produit{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <section className="py-4 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-orange-600">Accueil</Link>
            <span>›</span>
            <Link href="/categories" className="hover:text-orange-600">Catégories</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </section>

      {/* Advanced Filter Bar */}
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 backdrop-blur-sm">
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

              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 pr-12 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 min-w-[180px]"
                >
                  <option value="all">Toutes les marques</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
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
                  <option value="stock">Stock disponible</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-6 py-4 border border-gray-200">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Prix: €{priceRange.min} - €{priceRange.max}
                </span>
                <input
                  type="range"
                  min="0"
                  max={allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price)) : 1000}
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-24 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl transition-all duration-200 font-medium whitespace-nowrap"
              >
                Effacer
              </button>

              {/* Results Count */}
              <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-3 rounded-xl font-medium">
                <span>{products.length} résultat{products.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <>
              {/* Filter Results Info */}
              {(searchTerm || selectedBrand !== 'all' || priceRange.max < (allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price)) : 1000)) && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    Filtres actifs: 
                    {searchTerm && <span className="ml-2 bg-blue-200 px-2 py-1 rounded">"{searchTerm}"</span>}
                    {selectedBrand !== 'all' && <span className="ml-2 bg-blue-200 px-2 py-1 rounded">{selectedBrand}</span>}
                    {priceRange.max < (allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price)) : 1000) && 
                      <span className="ml-2 bg-blue-200 px-2 py-1 rounded">≤ €{priceRange.max}</span>
                    }
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                  >
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400 text-4xl">📦</div>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-2">
                        <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                          {product.brand}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-3 text-lg">
                        {product.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-orange-600">
                          {product.price.toFixed(2)}€
                        </span>
                        <span className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </span>
                      </div>
                      
                      <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl text-gray-300 mb-4">�</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-500 mb-8">
                {allProducts.length === 0 
                  ? 'Cette catégorie ne contient pas encore de produits.'
                  : 'Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                }
              </p>
              {allProducts.length > 0 ? (
                <button 
                  onClick={clearFilters}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors duration-200 inline-block"
                >
                  Effacer les filtres
                </button>
              ) : (
                <Link 
                  href="/produits"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors duration-200 inline-block"
                >
                  Voir tous les produits
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
