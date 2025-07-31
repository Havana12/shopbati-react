'use client'

import { useSearchParams } from 'next/navigation'

export default function CategoryPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('name') || 'Inconnue'
  
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>
        ✅ Catégorie: {category}
      </h1>
      <p style={{ fontSize: '1.2em', color: '#666' }}>
        Cette page fonctionne parfaitement !
      </p>
      <p style={{ marginTop: '20px' }}>
        URL: /category-page?name=macon
      </p>
    </div>
  )
}
