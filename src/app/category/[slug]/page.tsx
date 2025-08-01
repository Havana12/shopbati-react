'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AppwriteService } from '@/lib/appwrite'

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
  description?: string
  slug?: string
  status: string
  sort_order?: number
  product_count?: number
}

const fallbackProducts: Product[] = [
  {
    $id: 'fallback-1',
    name: 'Ciment Portland CEM II/A-L 42.5 R - 25kg',
    description: 'Ciment de haute qualité pour béton armé et précontraint. Résistance élevée et prise rapide.',
    price: 8.95,
    image_url: '/images/cement.jpg',
    slug: 'ciment-portland-25kg',
    status: 'active',
    category_id: 'cat-1',
    category_name: 'MAÇON',
    featured: true,
    stock: 150,
    brand: 'LAFARGE',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    $id: 'fallback-2',
    name: 'Brique Rouge 20x10x5cm',
    description: 'Briques de construction traditionnelles en terre cuite. Résistantes et durables.',
    price: 0.45,
    image_url: '/images/brick.jpg',
    slug: 'brique-rouge-20x10x5',
    status: 'active',
    category_id: 'cat-1',
    category_name: 'MAÇON',
    featured: false,
    stock: 2500,
    brand: 'WIENERBERGER',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    $id: 'fallback-3',
    name: 'Peinture Acrylique Blanc Mat 10L',
    description: 'Peinture acrylique de qualité professionnelle. Excellent pouvoir couvrant.',
    price: 45.90,
    image_url: '/images/paint.jpg',
    slug: 'peinture-acrylique-blanc-10l',
    status: 'active',
    category_id: 'cat-3',
    category_name: 'PEINTRE',
    featured: true,
    stock: 85,
    brand: 'DULUX',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    $id: 'fallback-4',
    name: 'Carrelage Grès Cérame 60x60cm',
    description: 'Carrelage moderne en grès cérame. Facile d\'entretien et résistant.',
    price: 25.50,
    image_url: '/images/tile.jpg',
    slug: 'carrelage-gres-60x60',
    status: 'active',
    category_id: 'cat-4',
    category_name: 'CARRELEUR',
    featured: false,
    stock: 120,
    brand: 'PORCELANOSA',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState('all')
  const [isFromDatabase, setIsFromDatabase] = useState(false)

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [categorySlug])

  const fetchCategoryAndProducts = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      
      const categoriesResult = await appwrite.getCategories([
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.limit(100)
      ])
      
      let foundCategory: Category | null = null
      if (categoriesResult.documents && categoriesResult.documents.length > 0) {
        foundCategory = (categoriesResult.documents as unknown as Category[]).find(cat => 
          cat.slug === categorySlug || 
          cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        ) || null
      }
      
      if (foundCategory) {
        setCategory(foundCategory)
        
        const productsResult = await appwrite.getProducts([
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.equal('category_id', foundCategory.$id),
          appwrite.Query.limit(100)
        ])
        
        if (productsResult.documents && productsResult.documents.length > 0) {
          setProducts(productsResult.documents as unknown as Product[])
          setIsFromDatabase(true)
        } else {
          const categoryFallbackProducts = fallbackProducts.filter(product => 
            product.category_name === foundCategory.name
          )
          setProducts(categoryFallbackProducts)
          setIsFromDatabase(false)
        }
      } else {
        const mockCategory: Category = {
          $id: 'mock-' + categorySlug,
          name: categorySlug.replace(/-/g, ' ').toUpperCase(),
          description: 'Découvrez nos produits dans cette catégorie',
          slug: categorySlug,
          status: 'active',
          sort_order: 1,
          product_count: 0
        }
        setCategory(mockCategory)
        
        const categoryFallbackProducts = fallbackProducts.filter(product => 
          product.category_name?.toLowerCase().includes(categorySlug.replace(/-/g, ' ').toLowerCase()) ||
          categorySlug.toLowerCase().includes(product.category_name?.toLowerCase() || '')
        )
        setProducts(categoryFallbackProducts)
        setIsFromDatabase(false)
      }
    } catch (error) {
      console.error('Error fetching category and products:', error)
      const mockCategory: Category = {
        $id: 'mock-' + categorySlug,
        name: categorySlug.replace(/-/g, ' ').toUpperCase(),
        description: 'Découvrez nos produits dans cette catégorie',
        slug: categorySlug,
        status: 'active',
        sort_order: 1,
        product_count: 0
      }
      setCategory(mockCategory)
      setProducts(fallbackProducts)
      setIsFromDatabase(false)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max
        } else {
          return product.price >= min
        }
      })
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }

  const filteredProducts = filterAndSortProducts()

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('macon') || lowerName.includes('maçon')) return '🏗️'
    if (lowerName.includes('menuisier') || lowerName.includes('serrurerie')) return '🔧'
    if (lowerName.includes('peintre')) return '🎨'
    if (lowerName.includes('carreleur')) return '🏠'
    if (lowerName.includes('plomberie')) return '🚿'
    if (lowerName.includes('chauffage')) return '🔥'
    if (lowerName.includes('sanitaire')) return '🚿'
    if (lowerName.includes('électric')) return '⚡'
    if (lowerName.includes('outillage')) return '🔨'
    if (lowerName.includes('isolation')) return '🛡️'
    return '🏠'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600"></div>
        </div>
        <Footer />
      </div>
    )
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
            <div className="text-6xl mb-6">
              {category && getCategoryIcon(category.name)}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              {category?.name || 'Catégorie'}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8 leading-relaxed">
              {category?.description || 'Découvrez nos produits dans cette catégorie'}
            </p>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
              <span className="text-lg font-semibold">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-[1400px]">
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-orange-600 transition-colors">Accueil</Link>
              <span>›</span>
              <Link href="/categories" className="hover:text-orange-600 transition-colors">Catégories</Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">{category?.name}</span>
            </div>
          </nav>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 backdrop-blur-sm">
            <div className="flex flex-col xl:flex-row gap-6 items-center">
              
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

              <div className="min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700"
                >
                  <option value="name">Trier par nom</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="newest">Plus récents</option>
                </select>
              </div>

              <div className="min-w-[180px]">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700"
                >
                  <option value="all">Tous les prix</option>
                  <option value="0-10">0€ - 10€</option>
                  <option value="10-50">10€ - 50€</option>
                  <option value="50-100">50€ - 100€</option>
                  <option value="100">Plus de 100€</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {isFromDatabase ? (
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-3 rounded-xl font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>En direct</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-3 rounded-xl font-medium">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Démo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.$id}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    
                    {product.featured && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Populaire
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                      Stock: {product.stock || 0}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-2">
                      {product.brand && (
                        <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium mb-2">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-orange-600">
                        {product.price.toFixed(2)}€
                      </div>
                      
                      <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <span className="mr-2">Voir</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:to-orange-600/5 transition-all duration-300 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl text-gray-300 mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-500 mb-6">
                Essayez de modifier vos filtres de recherche
              </p>
              <Link
                href="/produits"
                className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Voir tous les produits
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
