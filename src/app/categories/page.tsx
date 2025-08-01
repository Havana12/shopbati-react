'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AppwriteService } from '@/lib/appwrite'

interface Category {
  $id: string
  name: string
  description?: string
  image_url?: string
  slug?: string
  status: string
  sort_order?: number
  product_count?: number
}

const fallbackCategories: Category[] = [
  { $id: '1', name: 'MAÇON', description: 'Matériaux pour maçonnerie et gros œuvre', slug: 'macon', status: 'active', sort_order: 1, product_count: 250 },
  { $id: '2', name: 'MENUISIER SERRURERIE', description: 'Bois, métaux et accessoires de menuiserie', slug: 'menuisier-serrurerie', status: 'active', sort_order: 2, product_count: 180 },
  { $id: '3', name: 'PEINTRE', description: 'Peintures, vernis et accessoires de peinture', slug: 'peintre', status: 'active', sort_order: 3, product_count: 320 },
  { $id: '4', name: 'CARRELEUR', description: 'Carrelages, colles et joints', slug: 'carreleur', status: 'active', sort_order: 4, product_count: 150 },
  { $id: '5', name: 'PLOMBERIE', description: 'Tuyauterie, raccords et accessoires', slug: 'plomberie', status: 'active', sort_order: 5, product_count: 280 },
  { $id: '6', name: 'CHAUFFAGE EAU CHAUDE', description: 'Systèmes de chauffage et eau chaude', slug: 'chauffage-eau-chaude', status: 'active', sort_order: 6, product_count: 120 },
  { $id: '7', name: 'SANITAIRE', description: 'Équipements sanitaires et accessoires', slug: 'sanitaire', status: 'active', sort_order: 7, product_count: 95 },
  { $id: '8', name: 'ÉLECTRICIEN', description: 'Matériel électrique et éclairage', slug: 'electricien', status: 'active', sort_order: 8, product_count: 200 },
  { $id: '9', name: 'OUTILLAGE & PROTECTION', description: 'Outils et équipements de protection', slug: 'outillage-protection', status: 'active', sort_order: 9, product_count: 350 },
  { $id: '10', name: 'ISOLATION THERMIQUE', description: 'Matériaux isolants et accessoires', slug: 'isolation', status: 'active', sort_order: 10, product_count: 80 }
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFromDatabase, setIsFromDatabase] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getCategories([
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.orderAsc('sort_order'),
        appwrite.Query.limit(100)
      ])
      
      if (result.documents && result.documents.length > 0) {
        setCategories(result.documents as unknown as Category[])
        setIsFromDatabase(true)
        console.log('✅ Categories loaded from Appwrite database:', result.documents.length)
      } else {
        setCategories(fallbackCategories)
        setIsFromDatabase(false)
        console.log('⚠️ No categories in database, using fallback data')
      }
    } catch (error) {
      console.error('❌ Error fetching categories from database:', error)
      setCategories(fallbackCategories)
      setIsFromDatabase(false)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
              Catégories
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8 leading-relaxed">
              Découvrez notre large gamme de matériaux organisée par métier
            </p>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
              <span className="text-lg font-semibold">
                {filteredCategories.length} catégorie{filteredCategories.length !== 1 ? 's' : ''} trouvée{filteredCategories.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Filters & Categories Section */}
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
                  placeholder="Rechercher une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
                />
              </div>

              {/* Database Status Indicator */}
              <div className="flex items-center gap-2">
                {isFromDatabase ? (
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-3 rounded-xl font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Données en direct</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-3 rounded-xl font-medium">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Données de démonstration</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredCategories.map((category) => (
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
                        {getCategoryIcon(category.name)}
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm text-gray-500 font-medium">
                          {category.product_count || 0} produits
                        </span>
                      </div>
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
              
              {filteredCategories.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="text-6xl text-gray-300 mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Aucune catégorie trouvée
                  </h3>
                  <p className="text-gray-500">
                    Essayez avec un autre terme de recherche
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Besoin d'aide pour choisir ?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Nos experts sont là pour vous conseiller dans le choix de vos matériaux
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Contacter un expert
            </Link>
            <Link
              href="/produits"
              className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Parcourir tous les produits
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
