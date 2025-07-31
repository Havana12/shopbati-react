'use client'

export default function AdminLoginTestPage() {
  return (
    <div className="min-h-screen bg-green-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login Test</h1>
        <p className="text-center text-gray-600">Nouvelle page de test</p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-sm text-green-800">✅ Cette page fonctionne !</p>
        </div>
        <div className="mt-4 text-center">
          <a href="/admin" className="text-blue-600 hover:text-blue-800">
            Aller vers /admin
          </a>
        </div>
      </div>
    </div>
  )
}
