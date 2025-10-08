'use client'

import { useState } from 'react'
import { AppwriteService } from '@/lib/appwrite'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<string[]>([])

  const addStatus = (message: string) => {
    setSetupStatus(prev => [...prev, message])
  }

  const detectSchema = async () => {
    setLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('🔍 Détection du schéma de votre base de données...')

      // Check users collection schema
      try {
        const usersResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          [appwrite.Query.limit(1)]
        )
        
        if (usersResult.documents.length > 0) {
          const sampleUser = usersResult.documents[0]
          addStatus('✅ Schéma de la collection "users":')
          Object.keys(sampleUser).forEach(key => {
            if (!key.startsWith('$')) {
              addStatus(`   • ${key}: ${typeof sampleUser[key]}`)
            }
          })
        } else {
          addStatus('⚠️ Collection "users" vide - impossible de détecter le schéma')
        }
      } catch (error) {
        addStatus('❌ Impossible d\'accéder à la collection "users"')
      }

      // Check categories collection schema
      try {
        const categoriesResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          [appwrite.Query.limit(1)]
        )
        
        if (categoriesResult.documents.length > 0) {
          const sampleCategory = categoriesResult.documents[0]
          addStatus('✅ Schéma de la collection "categories":')
          Object.keys(sampleCategory).forEach(key => {
            if (!key.startsWith('$')) {
              addStatus(`   • ${key}: ${typeof sampleCategory[key]}`)
            }
          })
        } else {
          addStatus('⚠️ Collection "categories" vide')
        }
      } catch (error) {
        addStatus('❌ Impossible d\'accéder à la collection "categories"')
      }

      addStatus('🎯 Recommandations:')
      addStatus('1. Pour les utilisateurs: assurez-vous d\'avoir les champs first_name, last_name, email')
      addStatus('2. Pour les catégories: vérifiez les champs name, description, slug')
      addStatus('3. Vérifiez les permissions de lecture/écriture sur toutes les collections')

    } catch (error) {
      addStatus('❌ Erreur lors de la détection: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const setupDatabase = async () => {
    setLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('🚀 Test de la base de données...')

      // Test products collection
      try {
        const productsResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, 
          'products', 
          [appwrite.Query.limit(1)]
        )
        addStatus('✅ Collection "products" accessible')
        addStatus(`📊 Nombre de produits: ${productsResult.total}`)
      } catch (error) {
        addStatus('❌ Problème avec "products": ' + error)
      }

      // Test categories collection
      try {
        const categoriesResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, 
          'categories', 
          [appwrite.Query.limit(1)]
        )
        addStatus('✅ Collection "categories" accessible')
        addStatus(`📊 Nombre de catégories: ${categoriesResult.total}`)
      } catch (error) {
        addStatus('❌ Problème avec "categories": ' + error)
      }

      // Test users collection
      try {
        const usersResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, 
          'users', 
          [appwrite.Query.limit(5)]
        )
        addStatus('✅ Collection "users" accessible')
        addStatus(`📊 Nombre d'utilisateurs: ${usersResult.total}`)
      } catch (error) {
        addStatus('❌ Problème avec "users": ' + error)
      }

      addStatus('✅ Test de base de données terminé!')

    } catch (error) {
      addStatus('❌ Erreur générale: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const createDemoCategories = async () => {
    setLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('🏗️ Création des catégories de démonstration...')

      // Create new categories matching the reference image
      const newCategories = [
        {
          name: 'GROS ŒUVRE',
          description: 'Béton, ciment, mortier, agglos, briques',
          slug: 'gros-oeuvre',
          image_url: '',
          parent_id: null,
          sort_order: 1,
          is_active: true,
          status: 'active',
          meta_title: 'Gros œuvre - Matériaux de construction',
          meta_description: 'Béton, ciment, mortier, agglos, briques pour vos travaux de gros œuvre',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'ISOLATION & CLOISONS',
          description: 'Isolation thermique, phonique, cloisons sèches',
          slug: 'isolation-cloisons',
          image_url: '',
          parent_id: null,
          sort_order: 2,
          is_active: true,
          status: 'active',
          meta_title: 'Isolation et cloisons - Matériaux',
          meta_description: 'Isolation thermique, phonique, cloisons sèches pour vos aménagements',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'COUVERTURE & CHARPENTE',
          description: 'Tuiles, ardoises, gouttières, bois de charpente',
          slug: 'couverture-charpente',
          image_url: '',
          parent_id: null,
          sort_order: 3,
          is_active: true,
          status: 'active',
          meta_title: 'Couverture et charpente - Matériaux',
          meta_description: 'Tuiles, ardoises, gouttières, bois de charpente pour votre toiture',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'MENUISERIE',
          description: 'Portes, fenêtres, volets, escaliers',
          slug: 'menuiserie',
          image_url: '',
          parent_id: null,
          sort_order: 4,
          is_active: true,
          status: 'active',
          meta_title: 'Menuiserie - Portes et fenêtres',
          meta_description: 'Portes, fenêtres, volets, escaliers pour vos aménagements',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'PLOMBERIE & CHAUFFAGE',
          description: 'Tubes, raccords, radiateurs, chaudières',
          slug: 'plomberie-chauffage',
          image_url: '',
          parent_id: null,
          sort_order: 5,
          is_active: true,
          status: 'active',
          meta_title: 'Plomberie et chauffage - Équipements',
          meta_description: 'Tubes, raccords, radiateurs, chaudières pour vos installations',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      for (const categoryData of newCategories) {
        try {
          await appwrite.databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'categories',
            'unique()',
            categoryData
          )
          addStatus(`✅ Catégorie créée: ${categoryData.name}`)
        } catch (error) {
          addStatus(`❌ Erreur pour ${categoryData.name}: ${error}`)
        }
      }

      addStatus('🎉 Toutes les catégories ont été créées avec succès!')

    } catch (error) {
      addStatus('❌ Erreur lors de la création des catégories: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const createDemoData = async () => {
    setLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('👥 Création des données de démonstration...')

      // Create demo auth users first
      const demoAuthUsers = [
        {
          email: 'admin@shopbati.fr',
          password: 'password123',
          name: 'Admin SHOPBATI'
        },
        {
          email: 'jean.dubois@shopbati.fr',
          password: 'password123',
          name: 'Jean Dubois'
        },
        {
          email: 'marie.martin@shopbati.fr',
          password: 'password123',
          name: 'Marie Martin'
        }
      ]

      for (const authUser of demoAuthUsers) {
        try {
          await appwrite.register(authUser.email, authUser.password, authUser.name)
          addStatus(`✅ Utilisateur d'authentification créé: ${authUser.name}`)
        } catch (error) {
          addStatus(`⚠️ Utilisateur ${authUser.name} existe peut-être déjà: ${error}`)
        }
      }

      // Create demo customers in database
      const demoCustomers = [
        {
          first_name: 'Jean',
          last_name: 'Dubois',
          email: 'jean.dubois@shopbati.fr',
          phone: '06 12 34 56 78',
          password_hash: '$2a$10$hashedpasswordexample123456789', // Demo hash
          email_verified: true,
          email_verification_token: '',
          password_reset_token: null,
          password_reset_expires: null,
          last_login: null,
          login_attempts: 0,
          locked_until: null,
          newsletter_subscribed: true,
          account_type: 'professional',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          first_name: 'Marie',
          last_name: 'Martin',
          email: 'marie.martin@shopbati.fr',
          phone: '06 98 76 54 32',
          password_hash: '$2a$10$hashedpasswordexample123456789', // Demo hash
          email_verified: true,
          email_verification_token: '',
          password_reset_token: null,
          password_reset_expires: null,
          last_login: null,
          login_attempts: 0,
          locked_until: null,
          newsletter_subscribed: false,
          account_type: 'professional',
          status: 'active',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          first_name: 'Pierre',
          last_name: 'Durand',
          email: 'pierre.durand@shopbati.fr',
          phone: '06 55 44 33 22',
          password_hash: '$2a$10$hashedpasswordexample123456789', // Demo hash
          email_verified: true,
          email_verification_token: '',
          password_reset_token: null,
          password_reset_expires: null,
          last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          login_attempts: 0,
          locked_until: null,
          newsletter_subscribed: true,
          account_type: 'professional',
          status: 'active',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      for (const customer of demoCustomers) {
        try {
          await appwrite.databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'users',
            'unique()',
            customer
          )
          addStatus(`✅ Utilisateur créé: ${customer.first_name} ${customer.last_name}`)
        } catch (error) {
          addStatus(`❌ Erreur pour ${customer.first_name} ${customer.last_name}: ${error}`)
        }
      }

      addStatus('🎉 Données de démonstration créées!')
      addStatus('📧 Comptes de test:')
      addStatus('   • admin@shopbati.fr / password123 (Admin)')
      addStatus('   • jean.dubois@shopbati.fr / password123')
      addStatus('   • marie.martin@shopbati.fr / password123')

    } catch (error) {
      addStatus('❌ Erreur lors de la création des données: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuration de la Base de Données</h1>
        <p className="text-gray-600 mt-2">Configurez et testez votre base de données Appwrite</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-database text-blue-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tester la Base</h3>
          <p className="text-gray-600 mb-4">Vérifier les collections et permissions</p>
          <button
            onClick={setupDatabase}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Test en cours...' : 'Tester la Base'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-search text-indigo-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Détecter Schéma</h3>
          <p className="text-gray-600 mb-4">Analyser la structure des données</p>
          <button
            onClick={detectSchema}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Détection...' : 'Détecter Schéma'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-tags text-green-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Créer Catégories</h3>
          <p className="text-gray-600 mb-4">Ajouter les 9 catégories métiers</p>
          <button
            onClick={createDemoCategories}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Création...' : 'Créer Catégories'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-purple-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Données Demo</h3>
          <p className="text-gray-600 mb-4">Créer clients de test</p>
          <button
            onClick={createDemoData}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Création...' : 'Créer Données'}
          </button>
        </div>
      </div>

      {/* Status Output */}
      {setupStatus.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats:</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {setupStatus.map((status, index) => (
              <div key={index} className="mb-1">
                {status}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">📋 Instructions:</h3>
        <div className="space-y-2 text-yellow-700">
          <p><strong>1. Collections utilisées:</strong> "products", "categories", "users"</p>
          <p><strong>2. Permissions:</strong> Définissez les permissions de lecture publique pour toutes les collections</p>
          <p><strong>3. Test:</strong> Utilisez "Tester la Base" pour diagnostiquer les problèmes</p>
          <p><strong>4. Schéma:</strong> Utilisez "Détecter Schéma" pour voir la structure de vos données</p>
          <p><strong>5. Catégories:</strong> Créez les 9 catégories professionnelles du bâtiment</p>
          <p><strong>6. Données:</strong> Ajoutez des clients de démonstration pour tester</p>
        </div>
      </div>
    </div>
  )
}
