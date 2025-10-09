'use client'

import { useState } from 'react'

interface EmailFormProps {
  onSubmit: (email: string, name?: string, address?: { street: string; city: string; postalCode: string }, customerType?: 'particulier' | 'professionnel', professionalInfo?: { company?: string; siret?: string; vatNumber?: string }) => void
  onCancel: () => void
  isProcessing: boolean
}

export default function EmailForm({ onSubmit, onCancel, isProcessing }: EmailFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [customerType, setCustomerType] = useState<'particulier' | 'professionnel' | ''>('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [siret, setSiret] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleCustomerTypeSelect = (type: 'particulier' | 'professionnel') => {
    setCustomerType(type)
    setCurrentStep(2)
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setEmailError('L\'email est requis')
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError('Veuillez entrer un email valide')
      return
    }
    
    setEmailError('')
    
    // Prepare address data if provided
    const addressData = street.trim() || city.trim() || postalCode.trim() ? {
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim()
    } : undefined
    
    // Prepare professional info if professional customer
    const professionalInfo = customerType === 'professionnel' ? {
      company: company.trim() || undefined,
      siret: siret.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined
    } : undefined
    
    // Use name field for both customer types
    const customerName = name.trim() || undefined
    
    onSubmit(email.trim(), customerName || undefined, addressData, customerType || 'particulier', professionalInfo)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl relative">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 text-white hover:text-orange-200 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <h3 className="text-xl font-bold mb-2">Finaliser votre commande</h3>
          <p className="text-orange-100 text-sm">
            {currentStep === 1 && 'Quel type de client êtes-vous ?'}
            {currentStep === 2 && 'Complétez vos informations'}
            {currentStep === 3 && 'Adresse de facturation'}
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mt-3 text-sm">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-orange-100' : 'text-orange-300'}`}>
              <i className={`fas ${currentStep > 1 ? 'fa-check-circle' : 'fa-user-tag'} mr-1 text-xs`}></i>
              <span className="text-xs">Type</span>
            </div>
            <i className="fas fa-chevron-right text-orange-300 text-xs"></i>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-orange-100 font-medium' : 'text-orange-300'}`}>
              <i className="fas fa-user mr-1 text-xs"></i>
              <span className="text-xs">Info</span>
            </div>
            <i className="fas fa-chevron-right text-orange-300 text-xs"></i>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-orange-100 font-medium' : 'text-orange-300'}`}>
              <i className="fas fa-map-marker-alt mr-1 text-xs"></i>
              <span className="text-xs">Adresse</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Step 1: Customer Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleCustomerTypeSelect('particulier')}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <i className="fas fa-user text-2xl text-blue-600 mr-3"></i>
                  <div>
                    <h4 className="font-semibold text-gray-800">Particulier</h4>
                    <p className="text-sm text-gray-600">Achat personnel</p>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleCustomerTypeSelect('professionnel')}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <i className="fas fa-building text-2xl text-green-600 mr-3"></i>
                  <div>
                    <h4 className="font-semibold text-gray-800">Professionnel</h4>
                    <p className="text-sm text-gray-600">Entreprise, artisan, etc.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Customer Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="text-orange-600 hover:text-orange-800 text-sm flex items-center"
                >
                  <i className="fas fa-arrow-left mr-1"></i>
                  Retour
                </button>
              )}

              {customerType === 'professionnel' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Raison sociale *
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Nom de votre entreprise"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SIRET
                      </label>
                      <input
                        type="text"
                        value={siret}
                        onChange={(e) => setSiret(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="SIRET"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        N° TVA
                      </label>
                      <input
                        type="text"
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="FR123..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Votre nom complet"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email * 
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="votre.email@exemple.com"
                  required
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Continuer
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Address Fields */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={prevStep}
                className="text-orange-600 hover:text-orange-800 text-sm flex items-center"
              >
                <i className="fas fa-arrow-left mr-1"></i>
                Retour
              </button>

              <div className="space-y-3">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Numéro et nom de rue"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="75001"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Paris"
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      Confirmation par email
                    </p>
                    <p className="text-xs text-blue-600">
                      Vous recevrez un email avec le détail de votre commande et le montant total.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !email.trim()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    'Confirmer la commande'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
