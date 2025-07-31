'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import Footer from '../components/Footer'

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

// Données simulées pour SHOPBATI France
const featuredProducts = [
  {
    $id: '1',
    name: 'Ciment Portland 25kg',
    description: 'Ciment de haute qualité pour constructions',
    price: 45.99,
    image_url: '/images/cement.jpg',
    slug: 'ciment-portland-25kg',
    status: 'active',
    featured: true,
    created_at: '2024-01-01'
  },
  {
    $id: '2', 
    name: 'Briques Rouges',
    description: 'Briques traditionnelles pour maçonnerie',
    price: 2.50,
    image_url: '/images/bricks.jpg',
    slug: 'briques-rouges',
    status: 'active',
    featured: true,
    created_at: '2024-01-01'
  },
  {
    $id: '3',
    name: 'Carrelage Céramique 60x60',
    description: 'Carrelage pour sols et revêtements',
    price: 25.90,
    image_url: '/images/tiles.jpg',
    slug: 'carrelage-ceramique',
    status: 'active',
    featured: true,
    created_at: '2024-01-01'
  },
  {
    $id: '4',
    name: 'Fer à Béton φ12',
    description: 'Barres en acier pour béton armé',
    price: 85.00,
    image_url: '/images/rebar.jpg',
    slug: 'fer-a-beton',
    status: 'active',
    featured: true,
    created_at: '2024-01-01'
  }
]

const categories = [
  { $id: '1', name: 'Ciments', description: 'Ciments et liants hydrauliques', slug: 'ciments', status: 'active', sort_order: 1 },
  { $id: '2', name: 'Briques', description: 'Briques et blocs de maçonnerie', slug: 'briques', status: 'active', sort_order: 2 },
  { $id: '3', name: 'Carrelage', description: 'Revêtements céramiques', slug: 'carrelage', status: 'active', sort_order: 3 },
  { $id: '4', name: 'Métaux', description: 'Fer et acier pour constructions', slug: 'metaux', status: 'active', sort_order: 4 },
  { $id: '5', name: 'Isolants', description: 'Matériaux isolants thermiques', slug: 'isolants', status: 'active', sort_order: 5 },
  { $id: '6', name: 'Peintures', description: 'Peintures et vernis professionnels', slug: 'peintures', status: 'active', sort_order: 6 }
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3)
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
      text: 'La variété de produits disponibles est impressionnante. Je trouve toujours ce dont j\'ai besoin.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Section Héro Moderne */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700">
        {/* Motif de fond */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8 animate-fade-in">
              <span className="mr-2">⭐</span>
              Matériaux Professionnels Certifiés
            </div>
            
            {/* Titre principal */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up">
              SHOPBATI
            </h1>
            
            {/* Sous-titre */}
            <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto animate-fade-in-up">
              Votre plateforme de confiance pour matériaux de construction de qualité professionnelle
            </p>
            
            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
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
        
        {/* Éléments décoratifs flottants */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
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
                <div className="h-48 bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwbDEwLTEwdjIwbC0xMC0xMHptMCAwbC0xMCAxMHYtMjBsMTAgMTB6Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                  <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                    {category.name === 'Ciments' && '🏗️'}
                    {category.name === 'Briques' && '🧱'}
                    {category.name === 'Carrelage' && '🔲'}
                    {category.name === 'Métaux' && '⚙️'}
                    {category.name === 'Isolants' && '🛡️'}
                    {category.name === 'Peintures' && '🎨'}
                  </span>
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.$id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-brand-xl transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                <div className="h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center relative overflow-hidden">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🏗️</span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-brand-600">
                      {product.price.toFixed(2)}€
                    </span>
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                      TTC
                    </span>
                  </div>
                  <Link 
                    href={`/product/${product.slug}`}
                    className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl font-medium transition-colors duration-200"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
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
