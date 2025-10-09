'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { debugUserAuth } from '@/lib/appwrite'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [raisonSociale, setRaisonSociale] = useState('')
  const [siret, setSiret] = useState('')
  const [tvaNumber, setTvaNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState<'professional' | 'individual'>('individual')
  // Champs d'adresse obligatoires
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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
      setFirstName('')
      setLastName('')
      setRaisonSociale('')
      setSiret('')
      setTvaNumber('')
      setPhone('')
      setAddress('')
      setPostalCode('')
      setCity('')
      setError('')
      setSuccessMessage('')
      setShowPassword(false)
      setAccountType('individual')
    }
  }, [isOpen, defaultMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (mode === 'register') {
        // Validation based on account type
        if (accountType === 'individual') {
          if (!firstName.trim() || !lastName.trim()) {
            setError('Veuillez saisir votre prénom et nom')
            return
          }
        } else {
          if (!raisonSociale.trim()) {
            setError('Veuillez saisir la raison sociale de votre entreprise')
            return
          }
          if (!siret.trim()) {
            setError('Veuillez saisir votre numéro SIRET')
            return
          }
        }
        
        if (!address.trim() || !postalCode.trim() || !city.trim()) {
          setError('Veuillez saisir votre adresse complète (adresse, code postal, ville)')
          return
        }
        if (password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères')
          return
        }
        
        console.log('Modal registration with:', {
          email,
          accountType: accountType,
          ...(accountType === 'individual' ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          } : {
            raisonSociale: raisonSociale.trim(),
            siret: siret.trim(),
            tvaNumber: tvaNumber.trim(),
          }),
          phone: phone.trim(),
          address: address.trim(),
          postalCode: postalCode.trim(),
          city: city.trim(),
          country: 'France'
        })
        
        // Prepare user data based on account type
        const userData = {
          phone: phone.trim(),
          accountType: accountType,
          address: address.trim(),
          postalCode: postalCode.trim(),
          city: city.trim(),
          country: 'France',
          ...(accountType === 'individual' ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          } : {
            raisonSociale: raisonSociale.trim(),
            siret: siret.trim(),
            tvaNumber: tvaNumber.trim(),
          })
        }
        
        // For display name, use appropriate value based on account type
        const displayName = accountType === 'individual' 
          ? `${firstName.trim()} ${lastName.trim()}`
          : raisonSociale.trim()
          
        await register(email, password, displayName, userData)
      } else {
        await login(email, password)
      }
      onClose()
    } catch (error: any) {
      // Handle the special case where account was created but login failed
      if (error.message === 'ACCOUNT_CREATED_LOGIN_REQUIRED') {
        setError('') // Clear any existing error immediately
        setSuccessMessage('✅ Compte créé avec succès ! Veuillez maintenant vous connecter avec vos identifiants.')
        setMode('login') // Switch to login mode
        // Keep the email and password for easy login
        setLoading(false) // Set loading to false here to avoid showing error
        return
      }
      
      // Debug login errors
      if (mode === 'login' && error.message && error.message.includes('Invalid credentials')) {
        console.log('🔍 Debugging login failure in modal...')
        console.log('📧 Email:', email)
        console.log('🔑 Password length:', password.length)
        
        debugUserAuth(email).then(status => {
          console.log('🔍 Debug result for modal login:', status)
          if (!status.authExists) {
            console.log('❌ PROBLÈME: Utilisateur n\'existe PAS dans Appwrite Auth!')
            console.log('💡 Solution: L\'utilisateur doit être créé dans Appwrite Auth')
          } else if (status.authExists) {
            console.log('✅ Utilisateur existe dans Auth - problème de mot de passe')
          }
        }).catch(debugError => {
          console.log('Debug failed:', debugError)
        })
      }
      
      // Use the specific error message from AuthContext
      setError(error.message || (mode === 'register' ? 'Erreur lors de la création du compte. Vérifiez vos informations.' : 'Email ou mot de passe incorrect'))
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

            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                {successMessage}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'register' && (
                <>
                  {/* Account Type Selection */}
                  <div>
                    <label htmlFor="modal-accountType" className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-user-tag mr-2 text-orange-500"></i>
                      Type de compte
                    </label>
                    <select
                      id="modal-accountType"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as 'individual' | 'professional')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    >
                      <option value="individual">🏠 Particulier</option>
                      <option value="professional">🏢 Professionnel</option>
                    </select>
                  </div>

                  {/* Individual Account Fields */}
                  {accountType === 'individual' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="modal-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="fas fa-user mr-2 text-orange-500"></i>
                          Prénom *
                        </label>
                        <input
                          id="modal-firstName"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label htmlFor="modal-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="fas fa-user mr-2 text-orange-500"></i>
                          Nom *
                        </label>
                        <input
                          id="modal-lastName"
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="Dupont"
                        />
                      </div>
                    </div>
                  )}

                  {/* Professional Account Fields */}
                  {accountType === 'professional' && (
                    <>
                      <div>
                        <label htmlFor="modal-raisonSociale" className="block text-sm font-medium text-gray-700 mb-2">
                          <i className="fas fa-building mr-2 text-orange-500"></i>
                          Raison Sociale *
                        </label>
                        <input
                          id="modal-raisonSociale"
                          type="text"
                          required
                          value={raisonSociale}
                          onChange={(e) => setRaisonSociale(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="ENTREPRISE DUPONT SARL"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="modal-siret" className="block text-sm font-medium text-gray-700 mb-2">
                            <i className="fas fa-file-contract mr-2 text-orange-500"></i>
                            SIRET *
                          </label>
                          <input
                            id="modal-siret"
                            type="text"
                            required
                            value={siret}
                            onChange={(e) => setSiret(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                            placeholder="12345678901234"
                            maxLength={14}
                          />
                        </div>
                        <div>
                          <label htmlFor="modal-tvaNumber" className="block text-sm font-medium text-gray-700 mb-2">
                            <i className="fas fa-percent mr-2 text-orange-500"></i>
                            N° TVA (optionnel)
                          </label>
                          <input
                            id="modal-tvaNumber"
                            type="text"
                            value={tvaNumber}
                            onChange={(e) => setTvaNumber(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                            placeholder="FR12345678901"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common Fields */}
                  <div>
                    <label htmlFor="modal-phone" className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-phone mr-2 text-orange-500"></i>
                      Téléphone (optionnel)
                    </label>
                    <input
                      id="modal-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="06 12 34 56 78"
                    />
                  </div>

                  {/* Address Fields */}
                  <div>
                    <label htmlFor="modal-address" className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-map-marker-alt mr-2 text-orange-500"></i>
                      Adresse de livraison *
                    </label>
                    <input
                      id="modal-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="123 Rue de la République"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-mail-bulk mr-2 text-orange-500"></i>
                        Code postal *
                      </label>
                      <input
                        id="modal-postalCode"
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        placeholder="75001"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-city" className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-city mr-2 text-orange-500"></i>
                        Ville *
                      </label>
                      <input
                        id="modal-city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        placeholder="Paris"
                      />
                    </div>
                  </div>
                </>
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
