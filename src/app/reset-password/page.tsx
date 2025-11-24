'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')

    if (!tokenParam || !emailParam) {
      setError('Lien de réinitialisation invalide ou expiré.')
    } else {
      setToken(tokenParam)
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, newPassword })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?reset=success')
        }, 3000)
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Erreur lors de la réinitialisation du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-times text-3xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/forgot-password"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors text-center"
            >
              <i className="fas fa-redo mr-2"></i>
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-3xl text-green-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mot de passe réinitialisé !</h2>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <p className="text-sm text-gray-500 mb-6">Redirection automatique...</p>
            <Link
              href="/login"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors text-center"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Se connecter
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Nouveau mot de passe</h1>
          <p className="text-gray-600">
            Créez un nouveau mot de passe pour votre compte
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Email: <strong>{email}</strong>
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
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                placeholder="Au moins 8 caractères"
                required
                disabled={loading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Retapez votre mot de passe"
              required
              disabled={loading}
              minLength={8}
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
                Réinitialisation...
              </>
            ) : (
              <>
                <i className="fas fa-lock mr-2"></i>
                Réinitialiser le mot de passe
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-orange-500 transition-colors"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
