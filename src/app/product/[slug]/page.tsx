'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AppwriteService } from '@/lib/appwrite'
import { useCart } from '@/contexts/CartContext'

interface Product {
  $id: string
  name: string
  description: string
  price: number
  image_url?: string
  slug?: string
  status: string
  category_id?: string
  category_name?: string
  featured?: boolean
  created_at: string
  technical_specs?: string
  brand?: string
  stock?: number
  weight?: number
  dimensions?: string
}

interface RelatedProduct {
  $id: string
  name: string
  price: number
  image_url?: string
  slug?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addItem, openCart, state, updateQuantity, removeItem } = useCart()

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  const fetchProduct = async (productSlug: string) => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      let foundProduct = null
      
      // First try to find product by slug using the products list
      try {
        const result = await appwrite.getProducts([
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.equal('slug', productSlug)
        ])
        
        if (result && result.documents && result.documents.length > 0) {
          foundProduct = result.documents[0] as unknown as Product
        }
      } catch (slugError) {
        console.log('Slug search failed:', slugError)
      }

      // If not found by slug, try to get by ID directly
      if (!foundProduct) {
        try {
          const idResult = await appwrite.getProduct(productSlug)
          
          // Check if the product is active
          if (idResult && idResult.status === 'active') {
            foundProduct = idResult as unknown as Product
          }
        } catch (idError) {
          console.log('ID search failed:', idError)
        }
      }

      if (foundProduct) {
        setProduct(foundProduct)
        
        // Fetch related products from same category
        if (foundProduct.category_id) {
          try {
            const relatedResult = await appwrite.getProducts([
              appwrite.Query.equal('status', 'active'),
              appwrite.Query.equal('category_id', foundProduct.category_id),
              appwrite.Query.notEqual('$id', foundProduct.$id),
              appwrite.Query.limit(4)
            ])
            
            if (relatedResult && relatedResult.documents && relatedResult.documents.length > 0) {
              setRelatedProducts(relatedResult.documents as unknown as RelatedProduct[])
            }
          } catch (relatedError) {
            console.log('Related products fetch failed:', relatedError)
          }
        }
      } else {
        console.log('Product not found with slug/ID:', productSlug)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    for (let i = 0; i < quantity; i++) {
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
  }

  const getProductQuantityInCart = (productId: string) => {
    const item = state.items.find(item => item.$id === productId)
    return item?.quantity || 0
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Chargement du produit...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-6xl text-gray-400 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-700 mb-2">Produit introuvable</h1>
            <p className="text-gray-500 mb-6">Le produit que vous recherchez n'existe pas ou n'est plus disponible.</p>
            <Link href="/produits" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              <i className="fas fa-store mr-2"></i>Retour à la boutique
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const productImages = product.image_url ? [product.image_url] : []

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-600 mb-8">
            <Link href="/" className="hover:text-blue-600">Accueil</Link>
            <span className="mx-2">/</span>
            <Link href="/produits" className="hover:text-blue-600">Boutique</Link>
            {product.category_name && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/categories/${product.category_id}`} className="hover:text-blue-600">
                  {product.category_name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="font-medium">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-w-1 aspect-h-1 bg-white rounded-lg shadow-lg overflow-hidden">
                {productImages.length > 0 ? (
                  <Image 
                    src={productImages[selectedImage]} 
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <i className="fas fa-box text-6xl text-gray-400"></i>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="flex space-x-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden ${
                        selectedImage === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <Image 
                        src={image} 
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                {product.featured && (
                  <span className="inline-block bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold mb-4">
                    <i className="fas fa-star mr-1"></i>Produit Vedette
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
                {product.brand && (
                  <p className="text-lg text-gray-600 mb-2">
                    <i className="fas fa-tag mr-2"></i>Marque: <span className="font-semibold">{product.brand}</span>
                  </p>
                )}
                <div className="text-4xl font-bold text-green-600 mb-6">
                  {product.price.toFixed(2)}€
                  <span className="text-sm text-gray-500 ml-2">TTC</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock !== undefined && (
                  <div className={`flex items-center ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <i className={`fas ${product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                    <span className="font-semibold">
                      {product.stock > 0 ? `En stock (${product.stock} disponibles)` : 'Rupture de stock'}
                    </span>
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <div className="mb-8">
                <div className="flex space-x-4">
                  {getProductQuantityInCart(product.$id) > 0 ? (
                    /* Product already in cart - show quantity controls */
                    <div className="flex-1 flex items-center bg-orange-50 border-2 border-orange-500 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(product.$id, getProductQuantityInCart(product.$id) - 1)}
                        className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <div className="flex-1 text-center py-3 font-bold text-orange-700 text-lg">
                        {getProductQuantityInCart(product.$id)}
                      </div>
                      
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    /* Product not in cart - show add button with quantity selector */
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="font-semibold text-gray-700">Quantité:</label>
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-4 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-2 text-center border-x border-gray-300 focus:outline-none"
                          />
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-4 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                        Ajouter au panier
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Features */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-green-600">
                    <i className="fas fa-shipping-fast mr-2"></i>
                    <span>Livraison express</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <i className="fas fa-shield-alt mr-2"></i>
                    <span>Garantie constructeur</span>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <i className="fas fa-headset mr-2"></i>
                    <span>Support technique</span>
                  </div>
                  <div className="flex items-center text-orange-600">
                    <i className="fas fa-undo mr-2"></i>
                    <span>Retour 30 jours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="bg-white rounded-lg shadow-lg mb-12">
            <div className="border-b">
              <nav className="flex space-x-8 px-8">
                <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 font-medium">
                  Description
                </button>
                {product.technical_specs && (
                  <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
                    Spécifications techniques
                  </button>
                )}
                <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
                  Livraison & Retours
                </button>
              </nav>
            </div>
            
            <div className="p-8">
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Description du produit</h3>
                <div className="text-gray-600 leading-relaxed">
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br>') }} />
                  ) : (
                    <p>Aucune description disponible pour ce produit.</p>
                  )}
                </div>

                {/* Additional Product Info */}
                {(product.weight || product.dimensions) && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Informations complémentaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {product.weight && (
                        <div>
                          <span className="font-medium">Poids:</span> {product.weight} kg
                        </div>
                      )}
                      {product.dimensions && (
                        <div>
                          <span className="font-medium">Dimensions:</span> {product.dimensions}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
                Produits similaires
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.$id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                      {relatedProduct.image_url ? (
                        <Image 
                          src={relatedProduct.image_url} 
                          alt={relatedProduct.name}
                          width={300}
                          height={200}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <i className="fas fa-box text-2xl text-gray-400"></i>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {relatedProduct.price.toFixed(2)}€
                        </span>
                        <Link 
                          href={`/product/${relatedProduct.slug || relatedProduct.$id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                        >
                          <i className="fas fa-eye mr-1"></i>Voir
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
