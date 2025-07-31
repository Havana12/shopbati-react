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
  $createdAt?: string
  $updatedAt?: string
}

interface Category {
  $id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  $createdAt?: string
  $updatedAt?: string
}

// Demo data as fallback
const demoProducts: Product[] = [
  {
    $id: '1',
    name: 'Ciment Portland CEM II/A-L 32,5 R',
    description: 'Ciment de haute qualité pour tous travaux de maçonnerie',
    price: 7.5,
    image_url: '/images/products/ciment.jpg',
    slug: 'ciment-portland-cem-ii-a-l-32-5-r',
    status: 'active',
    category_id: 'macon',
    category_name: 'MACON',
    featured: true,
    stock: 250,
    brand: 'LAFARGE',
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
  
  useEffect(() => {
    fetchCategoryAndProducts()
  }, [categorySlug])

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true)
      const appwrite = new AppwriteService()
      
      // Try to fetch from database
      const [categoriesResponse, productsResponse] = await Promise.all([
        appwrite.getCategories(),
        appwrite.getProducts()
      ])
      
      const foundCategory = categoriesResponse.find((cat: Category) => cat.slug === categorySlug)
      const categoryProducts = productsResponse.filter((prod: Product) => 
        prod.category_id === categorySlug || prod.category_name?.toLowerCase().includes(categorySlug.toLowerCase())
      )
      
      if (foundCategory) {
        setCategory(foundCategory)
      }
      
      if (categoryProducts.length > 0) {
        setProducts(categoryProducts)
      } else {
        // Use demo data if no products found
        const demoCategory = {
          $id: categorySlug,
          name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
          slug: categorySlug,
          description: `Produits pour ${categorySlug}`
        }
        setCategory(demoCategory)
        setProducts(demoProducts.filter(prod => prod.category_id === categorySlug))
      }
    } catch (error) {
      console.error('Error fetching category data:', error)
      // Fallback to demo data
      const demoCategory = {
        $id: categorySlug,
        name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
        slug: categorySlug,
        description: `Produits pour ${categorySlug}`
      }
      setCategory(demoCategory)
      setProducts(demoProducts.filter(prod => prod.category_id === categorySlug))
    } finally {
      setLoading(false)
    }
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
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 text-white py-24">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {category?.name || 'Catégorie'}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
              {category?.description || 'Découvrez nos produits de qualité professionnelle'}
            </p>
            <div className="mt-8">
              <span className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-lg font-medium">
                {products.length} produit{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.$id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {product.price.toFixed(2)} €
                    </span>
                    <Link 
                      href={`/product/${product.slug}`}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 mb-8">
                Cette catégorie ne contient pas encore de produits.
              </p>
              <Link 
                href="/produits"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors duration-200 inline-block"
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
