'use client'

import Link from 'next/link'

export default function Footer() {
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
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <i className="fab fa-youtube text-xl"></i>
              </a>
            </div>
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
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Service Client</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Mon Compte
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Mon Panier
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Mes Commandes
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>Support
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  <i className="fas fa-chevron-right text-xs mr-2"></i>FAQ
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
                  <p className="text-gray-300">123 Rue du Bâtiment</p>
                  <p className="text-gray-300">75001 Paris, France</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-phone text-yellow-400"></i>
                <p className="text-gray-300">+33 1 23 45 67 89</p>
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
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 SHOPBATI. Tous droits réservés.
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-yellow-400 transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-yellow-400 transition-colors">
                Conditions d'utilisation
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-yellow-400 transition-colors">
                Cookies
              </Link>
              <Link href="/legal" className="text-gray-400 hover:text-yellow-400 transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
