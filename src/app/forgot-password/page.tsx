'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Erreur lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-3xl text-green-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Email envoyé !</h2>
            <p className="text-gray-600 mb-6">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email 
              avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              L'email devrait arriver dans quelques minutes. Pensez à vérifier votre dossier spam.
            </p>
            <Link
              href="/login"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors text-center"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Mot de passe oublié ?</h1>
          <p className="text-gray-600">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-600 mr-2"></i>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="votre@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Envoi en cours...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Envoyer le lien de réinitialisation
              </>
            )}
          </button>

          <div className="text-center space-y-2">
            <Link
              href="/login"
              className="block text-sm text-gray-600 hover:text-orange-500 transition-colors"
            >
              <i className="fas fa-arrow-left mr-1"></i>
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
