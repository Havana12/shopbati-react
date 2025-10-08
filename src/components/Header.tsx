'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './AuthModal'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('shopbati_cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [])

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
    setIsAccountDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAccountDropdownOpen) {
        const target = event.target as Element
        if (!target.closest('.account-dropdown')) {
          setIsAccountDropdownOpen(false)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isAccountDropdownOpen])

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Orange Banner */}
      <div className="bg-orange-600 text-white text-center py-2 text-sm font-medium">
        <div className="container mx-auto px-4">
          <span className="font-bold">100% PRO</span> RÉSERVÉ EXCLUSIVEMENT AUX PROFESSIONNELS DU BÂTIMENT
          <div className="float-right">
            <button className="bg-black text-white px-3 py-1 text-xs rounded">
              🇫🇷 SÉLECTIONNER UNE LANGUE ▼
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/logo_shopbat.jpg" 
                alt="SHOPBATI Logo" 
                className="h-12 sm:h-16 w-auto object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="hidden text-xl sm:text-2xl font-bold text-black tracking-wide">
                SHOPBATI<span className="text-orange-500">.FR</span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-4xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Rechercher un produit, une marque..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-l-lg focus:outline-none focus:border-orange-500"
              />
              <button className="absolute right-0 top-0 h-full px-8 bg-gray-600 hover:bg-gray-700 text-white rounded-r-lg transition-colors">
                <i className="fas fa-search text-lg"></i>
              </button>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer">
              <i className="fas fa-warehouse text-xl mb-1"></i>
              <div className="text-xs text-center">
                <div className="font-medium">MON DÉPÔT</div>
                <div className="text-orange-500">Se connecter</div>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="hidden md:flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer group relative">
                <i className="fas fa-user text-xl mb-1"></i>
                <div className="text-xs text-center">
                  <div className="font-medium">MON COMPTE</div>
                  <div className="text-orange-500">{user?.name?.split(' ')[0] || 'Compte'}</div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <i className="fas fa-user mr-2"></i>
                      Mon profil
                    </Link>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <i className="fas fa-shopping-bag mr-2"></i>
                      Mes commandes
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="account-dropdown relative">
                <button 
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="hidden md:flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer"
                >
                  <i className="fas fa-user text-xl mb-1"></i>
                  <div className="text-xs text-center">
                    <div className="font-medium">MON COMPTE</div>
                    <div className="text-orange-500 flex items-center">
                      Se connecter
                      <i className={`fas fa-chevron-down ml-1 text-xs transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="py-2">
                      <button
                        onClick={() => openAuthModal('login')}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 flex items-center"
                      >
                        <i className="fas fa-sign-in-alt mr-3 text-orange-500"></i>
                        <div>
                          <div className="font-medium">Se connecter</div>
                          <div className="text-xs text-gray-500">Accédez à votre compte</div>
                        </div>
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={() => openAuthModal('register')}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 flex items-center"
                      >
                        <i className="fas fa-user-plus mr-3 text-orange-500"></i>
                        <div>
                          <div className="font-medium">Créer un compte</div>
                          <div className="text-xs text-gray-500">Nouveau client professionnel</div>
                        </div>
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <div className="px-4 py-3 bg-orange-50">
                        <div className="text-xs text-orange-700 font-medium mb-1">
                          <i className="fas fa-star mr-1"></i>
                          Avantages compte pro
                        </div>
                        <div className="text-xs text-orange-600">
                          • Tarifs préférentiels<br/>
                          • Livraison rapide<br/>
                          • Support dédié
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Link href="/cart" className="flex flex-col items-center text-gray-700 hover:text-orange-500 cursor-pointer relative">
              <i className="fas fa-shopping-cart text-xl mb-1"></i>
              <div className="text-xs text-center">
                <div className="font-medium">MON PANIER</div>
                <div className="text-orange-500">▼</div>
              </div>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden ml-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className="fas fa-bars text-2xl text-gray-700"></i>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-gray-200 bg-white shadow-sm">
          <div className="hidden md:flex items-center justify-center py-4">
            <div className="flex items-center space-x-2">
              <Link
                href="/"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                ACCUEIL
              </Link>
              <Link
                href="/categories/macon"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                MAÇON
              </Link>
              <Link
                href="/categories/menuisier-serrurerie"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                <div className="text-center leading-tight">
                  <div>MENUISIER</div>
                  <div>SERRURERIE</div>
                </div>
              </Link>
              <Link
                href="/categories/peintre"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                PEINTRE
              </Link>
              <Link
                href="/categories/carreleur"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                CARRELEUR
              </Link>
              <Link
                href="/categories/plomberie"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                PLOMBERIE
              </Link>
              <Link
                href="/categories/chauffage-eau-chaude"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                <div className="text-center leading-tight">
                  <div>CHAUFFAGE EAU</div>
                  <div>CHAUDE</div>
                </div>
              </Link>
              <Link
                href="/categories/sanitaire"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                SANITAIRE
              </Link>
              <Link
                href="/categories/electricien"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                ÉLECTRICIEN
              </Link>
              <Link
                href="/categories/outillage-protection"
                className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-base font-medium transition-all duration-200 px-6 py-4 rounded-md"
              >
                <div className="text-center leading-tight">
                  <div>OUTILLAGE &</div>
                  <div>PROTECTION</div>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex flex-col space-y-2">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher un produit, une marque..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <i className="fas fa-search"></i>
                  </button>
                </div>

                {/* Mobile Authentication Section */}
                {!isAuthenticated && (
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                    <div className="text-center mb-3">
                      <i className="fas fa-user text-orange-500 text-2xl mb-2"></i>
                      <h3 className="font-semibold text-gray-800">Mon Compte</h3>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => openAuthModal('login')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Se connecter
                      </button>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="w-full bg-white border border-orange-500 text-orange-500 hover:bg-orange-50 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <i className="fas fa-user-plus mr-2"></i>
                        Créer un compte
                      </button>
                    </div>
                  </div>
                )}

                <Link href="/" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  ACCUEIL
                </Link>
                <Link href="/categories/macon" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  MAÇON
                </Link>
                <Link href="/categories/menuisier-serrurerie" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  MENUISIER SERRURERIE
                </Link>
                <Link href="/categories/peintre" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  PEINTRE
                </Link>
                <Link href="/categories/carreleur" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  CARRELEUR
                </Link>
                <Link href="/categories/plomberie" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  PLOMBERIE
                </Link>
                <Link href="/categories/chauffage-eau-chaude" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  CHAUFFAGE EAU CHAUDE
                </Link>
                <Link href="/categories/sanitaire" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  SANITAIRE
                </Link>
                <Link href="/categories/electricien" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  ÉLECTRICIEN
                </Link>
                <Link href="/categories/outillage-protection" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium py-3 px-4 rounded-lg transition-all">
                  OUTILLAGE & PROTECTION
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </header>
  )
}
