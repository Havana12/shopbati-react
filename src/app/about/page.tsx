'use client'

import Link from 'next/link'

import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <i className="fas fa-building mr-3"></i>
                À propos de SHOPBATI
              </h1>
              <p className="text-xl text-blue-100">
                Votre partenaire de confiance dans l'univers du bâtiment depuis plus de 20 ans
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Company Introduction */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Notre Histoire
              </h2>
              <div className="prose prose-lg max-w-none text-gray-600">
                <p className="text-center text-lg leading-relaxed mb-6">
                  Fondée en 2003, SHOPBATI est née de la passion de professionnels du bâtiment 
                  qui souhaitaient révolutionner l'approvisionnement en matériaux et équipements 
                  de construction.
                </p>
                <p className="text-center text-lg leading-relaxed">
                  Aujourd'hui, nous sommes fiers d'être le partenaire privilégié de plus de 15,000 
                  artisans, entrepreneurs et particuliers dans toute la France, en offrant des 
                  produits de qualité, des conseils experts et un service client d'exception.
                </p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Nos Valeurs</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-award text-blue-600 text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Qualité</h3>
                <p className="text-gray-600">
                  Nous sélectionnons rigoureusement nos produits auprès des meilleures marques 
                  pour garantir des matériaux durables et fiables.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-handshake text-green-600 text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Proximité</h3>
                <p className="text-gray-600">
                  Une équipe locale et experte qui comprend vos besoins et vous accompagne 
                  dans tous vos projets de construction.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-lightbulb text-yellow-600 text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Innovation</h3>
                <p className="text-gray-600">
                  Nous investissons constamment dans les nouvelles technologies pour améliorer 
                  votre expérience d'achat et de livraison.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-8 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">SHOPBATI en chiffres</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">20+</div>
                <div className="text-gray-300">Années d'expérience</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">15K+</div>
                <div className="text-gray-300">Clients satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">10K+</div>
                <div className="text-gray-300">Produits en stock</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">500+</div>
                <div className="text-gray-300">Marques partenaires</div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Nos Services</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <i className="fas fa-truck text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Livraison Express</h3>
                    <p className="text-gray-600">
                      Livraison en 1h sur chantier avec notre flotte de véhicules spécialisés. 
                      Service drive gratuit pour les professionnels.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <i className="fas fa-tools text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Conseils Techniques</h3>
                    <p className="text-gray-600">
                      Notre équipe d'experts vous guide dans le choix des matériaux et 
                      vous propose des solutions adaptées à vos projets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <i className="fas fa-calculator text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Devis Personnalisés</h3>
                    <p className="text-gray-600">
                      Établissement de devis détaillés et personnalisés selon vos besoins 
                      spécifiques avec remises quantitatives.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <i className="fas fa-shield-alt text-yellow-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Garantie & SAV</h3>
                    <p className="text-gray-600">
                      Garantie constructeur sur tous nos produits et service après-vente 
                      réactif pour vos équipements professionnels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Notre Équipe</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-user text-gray-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Jean Dupont</h3>
                <p className="text-blue-600 mb-3">Directeur Général</p>
                <p className="text-gray-600 text-sm">
                  25 ans d'expérience dans le bâtiment. Passionné par l'innovation 
                  et le service client.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-user text-gray-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Marie Martin</h3>
                <p className="text-blue-600 mb-3">Responsable Technique</p>
                <p className="text-gray-600 text-sm">
                  Ingénieure en génie civil, elle supervise la sélection de nos 
                  produits et conseille nos clients.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-user text-gray-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Pierre Durand</h3>
                <p className="text-blue-600 mb-3">Chef des Ventes</p>
                <p className="text-gray-600 text-sm">
                  Expert en relation client, il garantit la satisfaction de nos 
                  15,000 clients professionnels.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Rejoignez la famille SHOPBATI</h2>
            <p className="text-xl text-blue-100 mb-8">
              Découvrez pourquoi plus de 15,000 professionnels nous font confiance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/produits"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors"
              >
                <i className="fas fa-store mr-2"></i>
                Découvrir nos produits
              </Link>
              <Link 
                href="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-bold transition-colors"
              >
                <i className="fas fa-phone mr-2"></i>
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
