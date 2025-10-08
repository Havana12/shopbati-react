'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const { login, register } = useAuth()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode)
    } else {
      setEmail('')
      setPassword('')
      setName('')
      setError('')
      setShowPassword(false)
    }
  }, [isOpen, defaultMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
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
      onClose()
    } catch (error: any) {
      if (mode === 'register') {
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
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <i className="fas fa-hammer text-white text-xl"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-white">SHOPBATI</h3>
                  <p className="text-orange-100 text-sm">
                    {mode === 'register' ? 'Créer votre compte professionnel' : 'Connectez-vous à votre compte'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-200 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-user mr-2 text-orange-500"></i>
                    Nom complet
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    required={mode === 'register'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="Jean Dupont"
                  />
                </div>
              )}

              <div>
                <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-envelope mr-2 text-orange-500"></i>
                  Adresse email
                </label>
                <input
                  id="modal-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="jean@entreprise.fr"
                />
              </div>

              <div>
                <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-lock mr-2 text-orange-500"></i>
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                    minLength={mode === 'register' ? 8 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 caractères
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {mode === 'register' ? 'Création du compte...' : 'Connexion en cours...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${mode === 'register' ? 'fa-user-plus' : 'fa-sign-in-alt'} mr-2`}></i>
                    {mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={switchMode}
                className="w-full text-orange-600 hover:text-orange-700 py-2 px-4 rounded-lg font-medium border border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
              >
                {mode === 'register' 
                  ? 'Déjà un compte ? Se connecter' 
                  : 'Pas encore de compte ? Créer un compte'
                }
              </button>
            </div>

            {mode === 'register' && (
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs">
                  <i className="fas fa-shield-alt mr-1"></i>
                  En créant un compte, vous acceptez nos conditions d'utilisation
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
