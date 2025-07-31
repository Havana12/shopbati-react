'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Vérifier si déjà connecté
    const token = localStorage.getItem('admin_token')
    if (token) {
      router.push('/admin')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('admin_token', data.token)
        localStorage.setItem('admin_user', JSON.stringify(data.user))
        router.push('/admin')
      } else {
        setError(data.message || 'Email ou mot de passe incorrect')
      }
    } catch (error: any) {
      setError('Erreur de connexion. Veuillez réessayer.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #1e3a8a, #581c87)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem'
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: '#eab308',
              padding: '1rem',
              borderRadius: '50%'
            }}>
              <i className="fas fa-hammer" style={{
                color: 'white',
                fontSize: '2rem'
              }}></i>
            </div>
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            SHOPBATI Admin
          </h2>
          <p style={{
            color: '#bfdbfe',
            fontSize: '0.875rem'
          }}>
            Connectez-vous pour accéder au panneau d'administration
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem'
          }}>
            {error && (
              <div style={{
                marginBottom: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  paddingLeft: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <i className="fas fa-envelope" style={{ color: '#9ca3af' }}></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="admin@shopbati.fr"
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  paddingLeft: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <i className="fas fa-lock" style={{ color: '#9ca3af' }}></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '0.75rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '0.5rem',
                  color: 'white',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt" style={{ marginRight: '0.5rem' }}></i>
                    Se connecter
                  </>
                )}
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <a 
                href="/"
                style={{
                  color: '#2563eb',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
                Retour au site
              </a>
            </div>
          </div>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <p style={{
            color: '#bfdbfe',
            fontSize: '0.875rem'
          }}>
            Compte de démonstration: admin@shopbati.fr / password
          </p>
        </div>
      </div>
    </div>
  )
}
