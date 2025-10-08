import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'SHOPBATI - La plateforme du bâtiment | Matériaux & Équipements Professionnels',
  description: 'Matériaux, outillage et équipements professionnels pour tous vos projets de construction',
  keywords: 'matériaux, construction, bâtiment, outillage, équipements, professionnels',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
