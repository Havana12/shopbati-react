'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login, register, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/account')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Veuillez saisir votre nom complet')
          return
        }
        if (password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères')
          return
        }
        await register(email, password, name)
      } else {
        await login(email, password)
      }
      router.push('/account')
    } catch (error: any) {
      if (isRegister) {
        setError('Erreur lors de la création du compte. Vérifiez vos informations.')
      } else {
        setError('Email ou mot de passe incorrect')
      }
      console.error('Authentication error:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-2xl inline-block mb-4">
            <i className="fas fa-hammer text-white text-4xl"></i>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">
            SHOPBATI
          </h2>
          <p className="text-orange-100 text-lg">
            {isRegister ? 'Créer votre compte professionnel' : 'Connectez-vous à votre compte'}
          </p>
        </div>
        
        {/* Form Card */}
        <div className="bg-white backdrop-blur-sm bg-opacity-95 rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center">
              <i className="fas fa-exclamation-triangle mr-3 text-red-500"></i>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-user mr-2 text-orange-500"></i>
                  Nom complet
                </label>
                <input
                  id="name"
                  type="text"
                  required={isRegister}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Jean Dupont"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-envelope mr-2 text-orange-500"></i>
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="jean@entreprise.fr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-lock mr-2 text-orange-500"></i>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="••••••••"
                  minLength={isRegister ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {isRegister && (
                <p className="mt-2 text-xs text-gray-500">
                  <i className="fas fa-info-circle mr-1"></i>
                  Minimum 8 caractères
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  {isRegister ? 'Création du compte...' : 'Connexion en cours...'}
                </>
              ) : (
                <>
                  <i className={`fas ${isRegister ? 'fa-user-plus' : 'fa-sign-in-alt'} mr-3`}></i>
                  {isRegister ? 'Créer mon compte' : 'Se connecter'}
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                {isRegister 
                  ? 'Déjà un compte ? Se connecter' 
                  : 'Pas encore de compte ? Créer un compte'
                }
              </button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Retour au site
              </Link>
            </div>
          </form>

          {isRegister && (
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                <i className="fas fa-shield-alt mr-1"></i>
                En créant un compte, vous acceptez nos conditions d'utilisation
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="text-white">
            <i className="fas fa-shield-check text-2xl mb-2 text-orange-200"></i>
            <p className="text-sm font-medium">Sécurisé</p>
          </div>
          <div className="text-white">
            <i className="fas fa-truck text-2xl mb-2 text-orange-200"></i>
            <p className="text-sm font-medium">Livraison rapide</p>
          </div>
          <div className="text-white">
            <i className="fas fa-phone text-2xl mb-2 text-orange-200"></i>
            <p className="text-sm font-medium">Support 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}
