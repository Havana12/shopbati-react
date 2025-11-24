'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, resendVerificationEmail } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      if (!token || !email) {
        setStatus('error')
        setMessage('Lien de vérification invalide ou expiré.')
        return
      }

      try {
        // Use custom verification system via Resend
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email })
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message || '✅ Email vérifié avec succès ! Vous pouvez maintenant vous connecter.')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Erreur lors de la vérification.')
        }
      } catch (error: any) {
        setStatus('error')
        setMessage('Erreur lors de la vérification. Le lien a peut-être expiré.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  const handleResendEmail = async () => {
    setResending(true)
    setResendSuccess(false)

    try {
      await resendVerificationEmail()
      setResendSuccess(true)
      setMessage('Email de vérification envoyé ! Vérifiez votre boîte de réception.')
    } catch (error: any) {
      console.error('Resend verification error:', error)
      setMessage('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Vérification en cours...</h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-3xl text-green-500"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Email vérifié !</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirection automatique...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-times text-3xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de vérification</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600 mr-2"></i>
                  <p className="text-sm text-green-800">
                    Email envoyé avec succès !
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {user && !user.emailVerification && (
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-envelope mr-2"></i>
                      Renvoyer l'email de vérification
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <i className="fas fa-home mr-2"></i>
                Retour à l'accueil
              </button>
              
              {!user && (
                <Link
                  href="/login"
                  className="block w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors text-center"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
