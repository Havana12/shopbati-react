'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppwriteService } from '@/lib/appwrite'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const userId = searchParams.get('userId')
      const secret = searchParams.get('secret')

      if (!userId || !secret) {
        setStatus('error')
        setMessage('Lien de vérification invalide ou expiré.')
        return
      }

      try {
        const appwrite = AppwriteService.getInstance()
        await appwrite.verifyEmail(userId, secret)
        setStatus('success')
        setMessage('✅ Email vérifié avec succès ! Vous pouvez maintenant vous connecter.')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/?login=true')
        }, 3000)
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'Erreur lors de la vérification. Le lien a peut-être expiré.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

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
            <button
              onClick={() => router.push('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retour à l'accueil
            </button>
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
