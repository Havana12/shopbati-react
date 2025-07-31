'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { debugUserAuth } from '@/lib/appwrite'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState<'professional' | 'individual'>('professional')
  // Nouveaux champs d'adresse obligatoires
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('France')
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const { login, register, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/') // Redirect to homepage instead of /account
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Veuillez saisir votre prénom et nom')
          return
        }
        if (!address.trim() || !postalCode.trim() || !city.trim()) {
          setError('Veuillez saisir votre adresse complète (adresse, code postal, ville)')
          return
        }
        if (password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères')
          return
        }
        // Combine first and last name for the register function
        const fullName = `${firstName.trim()} ${lastName.trim()}`
        console.log('Attempting registration with:', {
          email,
          fullName,
          additionalData: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            accountType: accountType,
            address: address.trim(),
            postalCode: postalCode.trim(),
            city: city.trim(),
            country: country
          }
        })
        await register(email, password, fullName, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          accountType: accountType,
          address: address.trim(),
          postalCode: postalCode.trim(),
          city: city.trim(),
          country: country
        })
      } else {
        await login(email, password)
      }
      router.push('/') // Redirect to homepage instead of /account
    } catch (error: any) {
      // Handle the special case where account was created but login failed
      if (error.message === 'ACCOUNT_CREATED_LOGIN_REQUIRED') {
        setError('') // Clear any existing error immediately
        setSuccessMessage('✅ Compte créé avec succès ! Veuillez maintenant vous connecter avec vos identifiants.')
        setIsRegister(false) // Switch to login mode
        // Keep the email and password for easy login
        // setEmail('') - Don't clear email
        // setPassword('') - Don't clear password
        setLoading(false) // Set loading to false here to avoid showing error
        return
      }
      
      // Special handling for password sync required
      if (!isRegister && error.message && error.message.startsWith('SYNC_PASSWORD_REQUIRED:')) {
        const parts = error.message.split(':')
        const emailFromError = parts[1]
        const passwordFromError = parts[2]
        
        setError('')
        setSuccessMessage('🔧 Configuration de votre mot de passe en cours...')
        
        try {
          // Try to sync the password
          const { syncDbPasswordToAuth } = await import('@/lib/appwrite')
          const result = await syncDbPasswordToAuth(emailFromError, passwordFromError)
          
          if (result.success) {
            setSuccessMessage('✅ Mot de passe configuré avec succès ! Connexion automatique...')
            
            // The sync function already logged us in, just redirect
            setTimeout(() => {
              router.push('/')
            }, 1500)
            return
          } else if (result.requiresPasswordRecovery) {
            setSuccessMessage('')
            setError('⚠️ Configuration requise: Un email de récupération a été envoyé pour configurer votre mot de passe. Vérifiez votre boîte email.')
          }
        } catch (syncError: any) {
          console.error('Failed to sync password:', syncError)
          setSuccessMessage('')
          setError('Impossible de configurer automatiquement le mot de passe. Veuillez contacter le support.')
        }
        setLoading(false)
        return
      }
      
      // Special handling for DB user without Auth user
      if (!isRegister && error.message && error.message.includes('existe dans notre base de données mais n\'est pas configuré pour l\'authentification')) {
        setError('')
        setSuccessMessage('� Votre compte a été trouvé. Création des identifiants de connexion...')
        
        try {
          // Try to create the Auth user from the DB user
          const { createAuthUserFromDB } = await import('@/lib/appwrite')
          await createAuthUserFromDB(email, password)
          setSuccessMessage('✅ Identifiants créés avec succès ! Connexion en cours...')
          
          // Now try to login
          await login(email, password)
          router.push('/')
          return
        } catch (authCreationError: any) {
          console.error('Failed to create Auth user:', authCreationError)
          setSuccessMessage('')
          setError('Impossible de créer les identifiants de connexion. Veuillez contacter le support.')
        }
      }
      
      // Use the specific error message from the login process
      setError(error.message || (isRegister ? 'Erreur lors de la création du compte. Vérifiez vos informations.' : 'Email ou mot de passe incorrect'))
      console.error('Authentication error:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setSuccessMessage('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setAccountType('professional')
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
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl">
              <div className="flex items-start">
                <i className="fas fa-check-circle mr-3 text-green-500 mt-0.5"></i>
                <div className="flex-1">
                  <span>{successMessage}</span>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
              <div className="flex items-start">
                <i className="fas fa-exclamation-triangle mr-3 text-red-500 mt-0.5"></i>
                <div className="flex-1">
                  <span>{error}</span>
                  {error.includes('adresse email est déjà utilisée') && isRegister && (
                    <button
                      onClick={switchMode}
                      className="block mt-2 text-sm text-red-700 hover:text-red-800 underline"
                    >
                      → Se connecter avec cette adresse email
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-user mr-2 text-orange-500"></i>
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required={isRegister}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-user mr-2 text-orange-500"></i>
                      Nom
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required={isRegister}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-phone mr-2 text-orange-500"></i>
                    Téléphone (optionnel)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                {/* Nouveaux champs d'adresse obligatoires */}
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-map-marker-alt mr-2 text-orange-500"></i>
                    Adresse de livraison *
                  </label>
                  <input
                    id="address"
                    type="text"
                    required={isRegister}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="123 Rue de la République"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-mail-bulk mr-2 text-orange-500"></i>
                      Code postal *
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      required={isRegister}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="75001"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-city mr-2 text-orange-500"></i>
                      Ville *
                    </label>
                    <input
                      id="city"
                      type="text"
                      required={isRegister}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-flag mr-2 text-orange-500"></i>
                      Pays *
                    </label>
                    <select
                      id="country"
                      required={isRegister}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Luxembourg">Luxembourg</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="accountType" className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-briefcase mr-2 text-orange-500"></i>
                    Type de compte
                  </label>
                  <select
                    id="accountType"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as 'professional' | 'individual')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="professional">Professionnel</option>
                    <option value="individual">Particulier</option>
                  </select>
                </div>
              </>
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
