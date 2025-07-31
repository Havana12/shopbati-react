export default function SimpleAuthPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1e40af',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          SHOPBATI Admin
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          Connexion administrateur
        </p>

        <form>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="admin@shopbati.fr"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="password"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Se connecter
          </button>
        </form>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <strong>Test:</strong> admin@shopbati.fr / password
        </div>
      </div>
    </div>
  )
}
