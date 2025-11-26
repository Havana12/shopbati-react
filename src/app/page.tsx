'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { AppwriteService } from '../lib/appwrite'

interface Category {
  $id: string
  name: string
  description?: string
  image_url?: string
  icon?: string
  slug?: string
  status: string
  sort_order?: number
  product_count?: number
  parent_id?: string
}

interface Product {
  $id: string
  name: string
  description?: string
  price: number
  image_url?: string
  slug?: string
  status: string
  featured?: boolean
  created_at?: string
  reference?: string
  discount_percentage?: number
  discounted_price?: number
}

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  // Function to get category icon
  const getCategoryIcon = (categoryName: string) => {
    const iconClass = "w-16 h-16 text-white drop-shadow-lg";
    
    switch (categoryName.toLowerCase()) {
      case 'ciments':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3-3-3m-12 6c0-1.232.046-2.453.138-3.662a4.006 4.006 0 013.7-3.7 48.678 48.678 0 017.324 0 4.006 4.006 0 013.7 3.7c.017.22.032.441.046.662M4.5 12l-3-3 3-3m15 6v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V12"/>
          </svg>
        )
      case 'briques':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 4h20v3H2V4zm0 5h9v3H2V9zm11 0h9v3h-9V9zM2 14h20v3H2v-3zm0 5h9v3H2v-3zm11 0h9v3h-9v-3z"/>
          </svg>
        )
      case 'carrelage':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm7-1h7v7h-7V3zm1 1v5h5V4h-5zM3 11h7v7H3v-7zm1 1v5h5v-5H4zm7-1h7v7h-7v-7zm1 1v5h5v-5h-5z"/>
          </svg>
        )
      case 'métaux':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.5 2L6.5 7l5 5 5-5-5-5zm0 2.83L13.67 7 11.5 9.17 9.33 7 11.5 4.83zM2 12l5 5 5-5-5-5-5 5zm5 2.17L4.83 12 7 9.83 9.17 12 7 14.17zm10-2.17l5 5-5 5-5-5 5-5zm0 2.17L14.83 12 17 9.83 19.17 12 17 14.17zM7 17l5 5 5-5-5-5-5 5zm5 2.17L9.83 17 12 14.83 14.17 17 12 19.17z"/>
          </svg>
        )
      case 'isolants':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18L19 7v4c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V7l7-3.82zm-2 4.32v2h4V7.5h-4zm0 3v2h4v-2h-4zm0 3v2h4v-2h-4z"/>
          </svg>
        )
      case 'peintures':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3zm-1 2H6V4h11v2z"/>
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
    }
  }

  // Function to get product icon
  const getProductIcon = (productName: string) => {
    const iconClass = "text-4xl";
    
    if (productName.toLowerCase().includes('ciment')) return '🏗️'
    if (productName.toLowerCase().includes('brique')) return '🧱'
    if (productName.toLowerCase().includes('carrelage')) return '⬜'
    if (productName.toLowerCase().includes('fer') || productName.toLowerCase().includes('métal')) return '⚙️'
    if (productName.toLowerCase().includes('isolant')) return '🛡️'
    if (productName.toLowerCase().includes('peinture')) return '🎨'
    if (productName.toLowerCase().includes('bois')) return '🪵'
    if (productName.toLowerCase().includes('sable')) return '🏖️'
    
    return '🏗️' // default construction icon
  }

  const getCategoryIconEmoji = (category: Category) => {
    // Use icon from database if available
    if (category.icon) return category.icon
    
    // Fallback to name-based detection
    const lowerName = category.name.toLowerCase()
    if (lowerName.includes('ciment') || lowerName.includes('mortier') || lowerName.includes('macon') || lowerName.includes('maçon')) return '🏗️'
    if (lowerName.includes('brique') || lowerName.includes('bloc')) return '🧱'
    if (lowerName.includes('carrelage') || lowerName.includes('carreleur') || lowerName.includes('revêtement')) return '🏠'
    if (lowerName.includes('métal') || lowerName.includes('acier') || lowerName.includes('menuisier') || lowerName.includes('serrurerie')) return '🔧'
    if (lowerName.includes('isolation') || lowerName.includes('isolant')) return '🛡️'
    if (lowerName.includes('peinture') || lowerName.includes('peintre') || lowerName.includes('finition')) return '🎨'
    if (lowerName.includes('plomberie') || lowerName.includes('sanitaire')) return '🚿'
    if (lowerName.includes('chauffage') || lowerName.includes('eau')) return '🔥'
    if (lowerName.includes('électric') || lowerName.includes('electric')) return '⚡'
    if (lowerName.includes('outillage') || lowerName.includes('protection') || lowerName.includes('quincaillerie')) return '🔨'
    if (lowerName.includes('jardin') || lowerName.includes('extérieur')) return '🌱'
    return '🏠'
  }

  const getCategoryGradient = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('ciment') || lowerName.includes('mortier') || lowerName.includes('macon') || lowerName.includes('maçon')) return 'from-gray-400 to-gray-600'
    if (lowerName.includes('brique') || lowerName.includes('bloc')) return 'from-red-400 to-red-600'
    if (lowerName.includes('carrelage') || lowerName.includes('carreleur') || lowerName.includes('revêtement')) return 'from-blue-400 to-blue-600'
    if (lowerName.includes('métal') || lowerName.includes('acier') || lowerName.includes('menuisier') || lowerName.includes('serrurerie')) return 'from-slate-400 to-slate-600'
    if (lowerName.includes('isolation') || lowerName.includes('isolant')) return 'from-green-400 to-green-600'
    if (lowerName.includes('peinture') || lowerName.includes('peintre') || lowerName.includes('finition')) return 'from-purple-400 to-purple-600'
    if (lowerName.includes('plomberie') || lowerName.includes('sanitaire')) return 'from-cyan-400 to-cyan-600'
    if (lowerName.includes('chauffage') || lowerName.includes('eau')) return 'from-orange-400 to-orange-600'
    if (lowerName.includes('électric') || lowerName.includes('electric')) return 'from-yellow-400 to-yellow-600'
    if (lowerName.includes('outillage') || lowerName.includes('protection') || lowerName.includes('quincaillerie')) return 'from-indigo-400 to-indigo-600'
    if (lowerName.includes('jardin') || lowerName.includes('extérieur')) return 'from-emerald-400 to-emerald-600'
    return 'from-orange-400 to-orange-600'
  }

  // Fetch categories from database
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Fetch both categories and products in parallel
      const [categoriesResult, productsResult] = await Promise.all([
        appwrite.getCategories([
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.orderAsc('sort_order'),
          appwrite.Query.limit(100)
        ]),
        appwrite.getProducts([
          appwrite.Query.limit(8),
          appwrite.Query.equal('status', 'active'),
          appwrite.Query.orderDesc('created_at')
        ])
      ])
      
      // Set categories
      if (categoriesResult.documents && categoriesResult.documents.length > 0) {
        const allCategories = categoriesResult.documents as unknown as Category[]
        const parentCategories = allCategories.filter(cat => !cat.parent_id)
        setCategories(parentCategories)
      }
      
      // Set products
      if (productsResult && productsResult.documents && productsResult.documents.length > 0) {
        const limitedProducts = productsResult.documents.slice(0, 8)
        setFeaturedProducts(limitedProducts as unknown as Product[])
      } else {
        setFeaturedProducts([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      name: 'Marc Dubois',
      company: 'Construction Dubois SARL',
      text: 'ShopBati est devenu notre fournisseur de confiance. Produits de qualité et livraisons toujours ponctuelles.',
      rating: 5
    },
    {
      name: 'Sophie Martin', 
      company: 'Entreprise Martin',
      text: 'Excellent service client et prix compétitifs. Je le recommande à tous les professionnels du secteur.',
      rating: 5
    },
    {
      name: 'Pierre Moreau',
      company: 'Moreau Construction',
      text: 'La variété de produits disponibles est impressionnante. Je trouve toujours ce dont j\\\'ai besoin.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />

      {/* Modern Categories Section */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-[1400px]">
          {/* Categories Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categories.map((category) => (
                <Link
                  key={category.$id}
                  href={`/categories/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                >
                  {/* Category Icon Header */}
                  <div className={`bg-gradient-to-br ${getCategoryGradient(category.name)} p-8 text-center relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11 9-20 20-20s20 9 20 20c0 11-9 20-20 20s-20-9-20-20zm10 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E")`
                      }}></div>
                    </div>
                    <div className="relative">
                      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                        {getCategoryIconEmoji(category)}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Category Details */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                      {category.description || 'Découvrez nos produits dans cette catégorie'}
                    </p>
                    
                    <div className="flex items-center justify-end">
                      <div className="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                        <span className="text-sm font-medium mr-2">Voir</span>
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:to-orange-600/5 transition-all duration-300 rounded-2xl"></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section Avantages - Déplacée après les catégories */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Pourquoi Choisir ShopBati
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Nous nous engageons à fournir les meilleurs matériaux avec un service exceptionnel
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 hover:from-brand-50 hover:to-brand-100 transition-all duration-300 hover:shadow-brand-lg hover:-translate-y-2">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl text-white group-hover:scale-110 transition-transform duration-300">
                🚚
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Livraison Express</h3>
              <p className="text-neutral-600 leading-relaxed">
                Livraison gratuite dès 100€ d'achat avec expédition en 24-48h partout en France
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 hover:from-brand-50 hover:to-brand-100 transition-all duration-300 hover:shadow-brand-lg hover:-translate-y-2">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-construction-green to-green-600 flex items-center justify-center text-2xl text-white group-hover:scale-110 transition-transform duration-300">
                🏆
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Qualité Garantie</h3>
              <p className="text-neutral-600 leading-relaxed">
                Uniquement les meilleures marques et produits certifiés pour vos projets de construction
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 hover:from-brand-50 hover:to-brand-100 transition-all duration-300 hover:shadow-brand-lg hover:-translate-y-2">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-construction-blue to-blue-600 flex items-center justify-center text-2xl text-white group-hover:scale-110 transition-transform duration-300">
                💬
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Support Expert</h3>
              <p className="text-neutral-600 leading-relaxed">
                Conseil technique spécialisé pour vous accompagner dans le choix de vos matériaux
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Produits en Vedette */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Produits en Vedette
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Découvrez notre sélection de produits les plus demandés par les professionnels
            </p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-neutral-100 animate-pulse">
                  <div className="h-48 bg-neutral-200"></div>
                  <div className="p-6">
                    <div className="h-5 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-4 bg-neutral-200 rounded mb-4"></div>
                    <div className="h-6 bg-neutral-200 rounded mb-4"></div>
                    <div className="h-10 bg-neutral-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.$id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-200">
                  
                  {/* Titre en haut de la carte (au-dessus de l'image) */}
                  <div className="p-3 pb-2">
                    <h3 className="font-bold text-neutral-900 text-base leading-snug group-hover:text-brand-600 transition-colors min-h-[3rem] flex items-center justify-center text-center">
                      {product.name || 'Produit'}
                    </h3>
                  </div>
                  
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gray-50 aspect-square mx-3 rounded-lg">
                    <img
                      src={product.image_url || '/images/placeholder.svg'}
                      alt={product.name || 'Produit'}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.svg'
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 pt-3 space-y-3">
                    {/* Description */}
                    {product.description && (
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Prix */}
                    <div className="flex flex-col gap-2">
                      {product.discount_percentage && product.discount_percentage > 0 ? (
                        <>
                          {/* Badge de réduction */}
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{product.discount_percentage}%
                            </span>
                          </div>
                          {/* Prix avec réduction */}
                          <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold text-green-600">
                              {(product.discounted_price || 0).toFixed(2)}€
                            </span>
                            <span className="text-sm text-red-500 line-through">
                              {(product.price || 0).toFixed(2)}€
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500 uppercase tracking-wide">
                            TTC
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl font-bold text-brand-600">
                              {(product.price || 0).toFixed(2)}€
                            </span>
                            <span className="text-xs text-neutral-500 uppercase tracking-wide">
                              TTC
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Bouton */}
                    <Link 
                      href={product.slug && product.slug !== '' ? `/product/${product.slug}` : `/product/${product.$id}`}
                      className="block w-full text-center bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-2.5 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-[0.98] active:scale-95"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className="text-xl font-semibold text-neutral-700 mb-2">Aucun produit disponible</h3>
                <p className="text-neutral-500 mb-6">Les produits seront affichés ici une fois ajoutés à la base de données.</p>
                <Link 
                  href="/admin/products/new"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors duration-200"
                >
                  <span className="mr-2">➕</span>
                  Ajouter des produits
                </Link>
              </div>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link 
              href="/produits"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">🛍️</span>
              Voir Tous les Produits
            </Link>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-20 bg-neutral-900 text-white relative overflow-hidden">
        {/* Motif de fond */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Ce Que Disent Nos Clients
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              La satisfaction de nos clients professionnels est notre priorité
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-neutral-800/50 backdrop-blur-sm p-8 lg:p-12 rounded-3xl border border-neutral-700">
              <div className="text-center">
                <div className="mb-6">
                  {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                    <span key={i} className="text-brand-400 text-2xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-xl lg:text-2xl mb-8 italic leading-relaxed">
                  &ldquo;{testimonials[currentSlide].text}&rdquo;
                </blockquote>
                <div>
                  <p className="font-bold text-brand-400 text-lg">
                    {testimonials[currentSlide].name}
                  </p>
                  <p className="text-neutral-400">
                    {testimonials[currentSlide].company}
                  </p>
                </div>
              </div>
              
              {/* Navigation témoignages */}
              <div className="flex justify-center mt-8 space-x-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-brand-400 scale-125' 
                        : 'bg-neutral-600 hover:bg-neutral-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
