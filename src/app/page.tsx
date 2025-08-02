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
  slug?: string
  status: string
  sort_order?: number
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

  // Fetch categories from database
  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getCategories([
        appwrite.Query.equal('level', 0),
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.orderAsc('sort_order')
      ])
      
      if (result && result.documents && result.documents.length > 0) {
        const sortedCategories = (result.documents as unknown as Category[]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        setCategories(sortedCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getProducts([
        appwrite.Query.limit(8),
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.orderDesc('created_at')
      ])
      
      if (result && result.documents && result.documents.length > 0) {
        const limitedProducts = result.documents.slice(0, 8)
        setFeaturedProducts(limitedProducts as unknown as Product[])
      } else {
        setFeaturedProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setFeaturedProducts([])
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
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Carousel Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Carousel Container */}
        <div className="relative w-full h-full">
          {/* Slide 1 */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 0 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative w-full h-full">
              <img 
                src="/images/christopher-burns-8KfCR12oeUM-unsplash.jpg" 
                alt="Construction Materials"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-4xl px-4">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8">
                    <span className="mr-2">⭐</span>
                    Matériaux Professionnels Certifiés
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                    SHOPBATI
                  </h1>
                  <p className="text-xl lg:text-2xl mb-8 text-white/90">
                    Votre partenaire de confiance pour tous vos projets de construction
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/produits" 
                      className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-brand-600 font-semibold hover:bg-neutral-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <span className="mr-2">🛍️</span>
                      Explorer le Catalogue
                    </Link>
                    <Link 
                      href="/contact" 
                      className="inline-flex items-center px-8 py-4 rounded-xl bg-transparent text-white font-semibold border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                    >
                      <span className="mr-2">💬</span>
                      Demander un Devis
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 1 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative w-full h-full">
              <img 
                src="/images/jeriden-villegas-VLPUm5wP5Z0-unsplash.webp" 
                alt="Professional Construction"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-4xl px-4">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8">
                    <span className="mr-2">🏗️</span>
                    Qualité Professionnelle Garantie
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                    EXCELLENCE
                  </h1>
                  <p className="text-xl lg:text-2xl mb-8 text-white/90">
                    Des matériaux de première qualité pour des constructions durables
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/categories" 
                      className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-brand-600 font-semibold hover:bg-neutral-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <span className="mr-2">�</span>
                      Voir les Catégories
                    </Link>
                    <Link 
                      href="/about" 
                      className="inline-flex items-center px-8 py-4 rounded-xl bg-transparent text-white font-semibold border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                    >
                      <span className="mr-2">ℹ️</span>
                      En Savoir Plus
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={() => setCurrentSlide(currentSlide === 0 ? 1 : 0)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={() => setCurrentSlide(currentSlide === 0 ? 1 : 0)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {[0, 1].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section Avantages */}
      <section className="py-20 bg-white">
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

      {/* Section Catégories */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Catégories de Produits
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Découvrez notre large gamme de matériaux organisée par catégorie
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link 
                key={category.$id}
                href={`/categories/${category.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-brand-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="h-48 relative overflow-hidden">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-brand-400 to-brand-600 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwbDEwLTEwdjIwbC0xMC0xMHptMCAwbC0xMCAxMHYtMjBsMTAgMTB6Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10"></div>
                      <div className="relative z-10 group-hover:scale-110 transition-all duration-300 mb-2">
                        {getCategoryIcon(category.name)}
                      </div>
                      <div className="relative z-10 text-white text-4xl group-hover:scale-110 transition-all duration-300">
                        {category.name === 'Ciments' && '🏗️'}
                        {category.name === 'Briques' && '🧱'}
                        {category.name === 'Carrelage' && '⬜'}
                        {category.name === 'Métaux' && '⚙️'}
                        {category.name === 'Isolants' && '🛡️'}
                        {category.name === 'Peintures' && '🎨'}
                      </div>
                    </div>
                  )}
                  {/* Overlay gradient for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    {category.description}
                  </p>
                  <div className="inline-flex items-center text-brand-600 font-medium group-hover:text-brand-700">
                    Explorer la catégorie
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
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
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gray-50 aspect-square">
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
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-neutral-900 text-sm leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {product.name || 'Produit'}
                    </h3>
                    
                    {product.description && (
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Prix */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-brand-600">
                        {(product.price || 0).toFixed(2)}€
                      </span>
                      <span className="text-xs text-neutral-500 uppercase tracking-wide">
                        TTC
                      </span>
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

      {/* Section Appel à l'action */}
      <section className="py-20 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 relative overflow-hidden">
        {/* Éléments décoratifs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-40 right-40 w-16 h-16 bg-white/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Prêt pour Votre Prochain Projet ?
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Rejoignez des milliers de professionnels qui font confiance à ShopBati pour leurs matériaux de construction.
            Inscrivez-vous aujourd&apos;hui et bénéficiez de 10% de réduction sur votre première commande !
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/register" 
              className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-brand-600 font-semibold hover:bg-neutral-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">🎉</span>
              Inscription Gratuite
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center px-8 py-4 rounded-xl bg-transparent text-white font-semibold border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
            >
              <span className="mr-2">📋</span>
              Demander un Devis
            </Link>
          </div>
          
          {/* Statistiques */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-white/80">Clients Satisfaits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">50,000+</div>
              <div className="text-white/80">Produits Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">24h</div>
              <div className="text-white/80">Livraison Express</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
