'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Footer() {
  const { isAuthenticated } = useAuth()
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-2 rounded-lg">
                <i className="fas fa-hammer text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">SHOPBATI</h3>
                <p className="text-sm text-gray-400">Plateforme du bâtiment</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Votre partenaire de confiance pour tous vos projets de construction. 
              Matériaux de qualité, outillage professionnel et service expert.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Liens Rapides</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/produits" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Produits
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Catégories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Service Client</h4>
            <ul className="space-y-3">
              <li>
                <Link href={isAuthenticated ? "/account?tab=profile" : "/login"} className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Mon Compte
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Mon Panier
                </Link>
              </li>
              <li>
                <Link href={isAuthenticated ? "/account" : "/login"} className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Mes Commandes
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-map-marker-alt text-yellow-400 mt-1"></i>
                <div>
                  <p className="text-gray-300">6 Rue des Bateliers - Bureau 3</p>
                  <p className="text-gray-300">92110 Clichy, France</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-phone text-yellow-400"></i>
                <p className="text-gray-300">+33 6 52 35 40 15</p>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-envelope text-yellow-400"></i>
                <p className="text-gray-300">contact@shopbati.fr</p>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-clock text-yellow-400"></i>
                <div>
                  <p className="text-gray-300">Lun-Ven: 8h-18h</p>
                  <p className="text-gray-300">Sam: 9h-17h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-center items-center">
            <div className="text-gray-400 text-sm">
              © 2025 SHOPBATI. Tous droits réservés.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
