'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
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
  slug?: string
  status: string
  featured?: boolean
  created_at: string
}

interface Category {
  $id: string
  name: string
  description?: string
  image_url?: string
  slug?: string
  status: string
  sort_order?: number
}

export default function CategoryPage() {
  const params = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const productsPerPage = 12

  useEffect(() => {
    if (params.slug) {
      fetchCategoryAndProducts(params.slug as string)
    }
  }, [params.slug, currentPage, sortBy, sortOrder])

  const fetchCategoryAndProducts = async (categorySlug: string) => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Try to find category by slug first, then by ID
      let categoryQuery = [
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.equal('slug', categorySlug)
      ]
      
      let categoryResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        categoryQuery
      )

      // If not found by slug, try by ID
      if (categoryResult.documents.length === 0) {
        categoryQuery = [
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.equal('$id', categorySlug)
        ]
        
        categoryResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          categoryQuery
        )
      }

      if (categoryResult.documents.length > 0) {
        const foundCategory = categoryResult.documents[0] as unknown as Category
        setCategory(foundCategory)
        
        // Fetch products for this category
        const productQueries = [
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.equal('category_id', foundCategory.$id),
          appwrite.Query.limit(productsPerPage),
          appwrite.Query.offset((currentPage - 1) * productsPerPage)
        ]

        // Add sorting
        if (sortOrder === 'asc') {
          productQueries.push(appwrite.Query.orderAsc(sortBy))
        } else {
          productQueries.push(appwrite.Query.orderDesc(sortBy))
        }

        const productsResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'products',
          productQueries
        )

        setProducts(productsResult.documents as unknown as Product[])
        setTotalPages(Math.ceil(productsResult.total / productsPerPage))
      }
    } catch (error) {
      console.error('Error fetching category and products:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    const cartItems = JSON.parse(localStorage.getItem('shopbati_cart') || '[]')
    const existingItem = cartItems.find((item: any) => item.productId === product.$id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cartItems.push({
        productId: product.$id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url
      })
    }

    localStorage.setItem('shopbati_cart', JSON.stringify(cartItems))
    window.dispatchEvent(new Event('cartUpdated'))
    alert(`${product.name} ajouté au panier !`)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-')
    setSortBy(field)
    setSortOrder(order)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Chargement de la catégorie...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!category) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-6xl text-gray-400 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-700 mb-2">Catégorie introuvable</h1>
            <p className="text-gray-500 mb-6">La catégorie que vous recherchez n'existe pas.</p>
            <Link href="/shop" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              <i className="fas fa-store mr-2"></i>Retour à la boutique
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        {/* Category Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0">
                <nav className="text-sm text-blue-200 mb-4">
                  <Link href="/" className="hover:text-white">Accueil</Link>
                  <span className="mx-2">/</span>
                  <Link href="/shop" className="hover:text-white">Boutique</Link>
                  <span className="mx-2">/</span>
                  <span>{category.name}</span>
                </nav>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
                {category.description && (
                  <p className="text-xl text-blue-100 leading-relaxed">
                    {category.description}
                  </p>
                )}
                <div className="mt-6 flex items-center text-blue-200">
                  <i className="fas fa-boxes mr-2"></i>
                  <span>{products.length} produits disponibles</span>
                </div>
              </div>
              {category.image_url && (
                <div className="md:w-1/3">
                  <Image 
                    src={category.image_url} 
                    alt={category.name}
                    width={400}
                    height={300}
                    className="rounded-lg shadow-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Sort Options */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0">
              Affichage de {((currentPage - 1) * productsPerPage) + 1} à {Math.min(currentPage * productsPerPage, products.length)} produits sur {products.length}
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Trier par:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="created_at-desc">Plus récents</option>
                <option value="created_at-asc">Plus anciens</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name-asc">Nom A-Z</option>
                <option value="name-desc">Nom Z-A</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-lg p-12">
                <i className="fas fa-box-open text-6xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun produit dans cette catégorie</h3>
                <p className="text-gray-500 mb-6">Cette catégorie ne contient aucun produit pour le moment.</p>
                <Link 
                  href="/shop"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <i className="fas fa-store mr-2"></i>Voir tous les produits
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <div key={product.$id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                    <div className="relative">
                      <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                        {product.image_url ? (
                          <Image 
                            src={product.image_url} 
                            alt={product.name}
                            width={400}
                            height={300}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <i className="fas fa-box text-4xl text-gray-400"></i>
                          </div>
                        )}
                      </div>
                      {product.featured && (
                        <span className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                          <i className="fas fa-star mr-1"></i>Vedette
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description ? product.description.substring(0, 100) + '...' : ''}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">
                          {product.price.toFixed(2)}€
                        </span>
                        <div className="flex space-x-2">
                          <Link 
                            href={`/product/${product.slug || product.$id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            <i className="fas fa-eye mr-1"></i>Voir
                          </Link>
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            <i className="fas fa-cart-plus mr-1"></i>Panier
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
                  >
                    <i className="fas fa-chevron-left mr-2"></i>Précédent
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const pageNum = Math.max(1, currentPage - 2) + index
                    if (pageNum > totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded transition-colors ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
                  >
                    Suivant<i className="fas fa-chevron-right ml-2"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
