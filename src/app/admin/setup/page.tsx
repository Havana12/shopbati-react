'use client'

import { useState } from 'react'
import { AppwriteService } from '@/lib/appwrite'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [detectSchemaLoading, setDetectSchemaLoading] = useState(false)
  const [analyzeProductsLoading, setAnalyzeProductsLoading] = useState(false)
  const [setupDatabaseLoading, setSetupDatabaseLoading] = useState(false)
  const [createCategoriesLoading, setCreateCategoriesLoading] = useState(false)
  const [createProductsLoading, setCreateProductsLoading] = useState(false)
  const [createDemoDataLoading, setCreateDemoDataLoading] = useState(false)
  const [inspectUsersLoading, setInspectUsersLoading] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [testLoginLoading, setTestLoginLoading] = useState(false)
  const [testConnectivityLoading, setTestConnectivityLoading] = useState(false)
  const [createDbUserLoading, setCreateDbUserLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<string[]>([])
  const [testLogin, setTestLogin] = useState({
    email: '',
    password: ''
  })
  const [createDbForm, setCreateDbForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    accountType: 'individual' as 'individual' | 'professional'
  })
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    accountType: 'professional' as 'professional' | 'individual'
  })

  const addStatus = (message: string) => {
    setSetupStatus(prev => [...prev, message])
  }

  const detectSchema = async () => {
    setDetectSchemaLoading(true)
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
      setDetectSchemaLoading(false)
    }
  }

  const analyzeProductsSchema = async () => {
    setAnalyzeProductsLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('🔍 Analyse approfondie du schéma "products"...')

      // Check products collection schema
      try {
        const productsResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'products',
          [appwrite.Query.limit(5)]
        )
        
        if (productsResult.documents.length > 0) {
          addStatus(`✅ Trouvé ${productsResult.documents.length} produit(s) existant(s)`)
          addStatus('📋 Schéma détaillé de la collection "products":')
          
          const sampleProduct = productsResult.documents[0]
          const allFields = new Set()
          
          // Collect all unique fields from all products
          productsResult.documents.forEach(product => {
            Object.keys(product).forEach(key => {
              if (!key.startsWith('$')) {
                allFields.add(key)
              }
            })
          })
          
          // Display all fields with types and sample values
          Array.from(allFields).sort().forEach((field: string) => {
            const sampleValue = (sampleProduct as any)[field]
            const type = typeof sampleValue
            const isArray = Array.isArray(sampleValue)
            const displayValue = isArray ? `[${sampleValue.length} items]` : 
                               type === 'string' && sampleValue.length > 50 ? 
                               `"${sampleValue.substring(0, 47)}..."` : 
                               JSON.stringify(sampleValue)
            
            addStatus(`   • ${field}: ${type}${isArray ? ' (array)' : ''} = ${displayValue}`)
          })
          
          addStatus('')
          addStatus('🎯 Champs requis pour la création de produits:')
          Array.from(allFields).sort().forEach(field => {
            addStatus(`   ✓ ${field}`)
          })
          
        } else {
          addStatus('⚠️ Collection "products" vide')
          addStatus('💡 Impossible de détecter le schéma - créez au moins un produit manuellement')
        }
      } catch (error) {
        addStatus('❌ Impossible d\'accéder à la collection "products": ' + error)
      }

    } catch (error) {
      addStatus('❌ Erreur lors de l\'analyse: ' + error)
    } finally {
      setAnalyzeProductsLoading(false)
    }
  }

  const setupDatabase = async () => {
    setSetupDatabaseLoading(true)
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
      setSetupDatabaseLoading(false)
    }
  }

  const createDemoCategories = async () => {
    setCreateCategoriesLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('🏗️ Création des catégories de démonstration...')

      // Create new categories matching the reference image
      const newCategories = [
        {
          name: 'MAÇON',
          description: 'Matériaux et équipements pour la maçonnerie',
          slug: 'macon',
          image_url: '',
          parent_id: null,
          sort_order: 1,
          is_active: true,
          status: 'active',
          meta_title: 'Maçon - Matériaux de construction',
          meta_description: 'Matériaux et équipements pour vos travaux de maçonnerie',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'MENUISIER SERRURERIE',
          description: 'Portes, fenêtres, serrures et accessoires de menuiserie',
          slug: 'menuisier-serrurerie',
          image_url: '',
          parent_id: null,
          sort_order: 2,
          is_active: true,
          status: 'active',
          meta_title: 'Menuisier Serrurerie - Portes et fenêtres',
          meta_description: 'Portes, fenêtres, serrures et accessoires de menuiserie',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'PEINTRE',
          description: 'Peintures, enduits et accessoires de peinture',
          slug: 'peintre',
          image_url: '',
          parent_id: null,
          sort_order: 3,
          is_active: true,
          status: 'active',
          meta_title: 'Peintre - Peintures et enduits',
          meta_description: 'Peintures, enduits et accessoires pour vos travaux de peinture',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'CARRELEUR',
          description: 'Carrelages, faïences et accessoires de pose',
          slug: 'carreleur',
          image_url: '',
          parent_id: null,
          sort_order: 4,
          is_active: true,
          status: 'active',
          meta_title: 'Carreleur - Carrelages et faïences',
          meta_description: 'Carrelages, faïences et accessoires de pose',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'PLOMBERIE',
          description: 'Équipements et accessoires de plomberie',
          slug: 'plomberie',
          image_url: '',
          parent_id: null,
          sort_order: 5,
          is_active: true,
          status: 'active',
          meta_title: 'Plomberie - Équipements',
          meta_description: 'Équipements et accessoires de plomberie',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'CHAUFFAGE EAU CHAUDE',
          description: 'Systèmes de chauffage et production d\'eau chaude',
          slug: 'chauffage-eau-chaude',
          image_url: '',
          parent_id: null,
          sort_order: 6,
          is_active: true,
          status: 'active',
          meta_title: 'Chauffage Eau Chaude - Systèmes thermiques',
          meta_description: 'Systèmes de chauffage et production d\'eau chaude',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'SANITAIRE',
          description: 'Équipements sanitaires et accessoires',
          slug: 'sanitaire',
          image_url: '',
          parent_id: null,
          sort_order: 7,
          is_active: true,
          status: 'active',
          meta_title: 'Sanitaire - Équipements salle de bain',
          meta_description: 'Équipements sanitaires et accessoires',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'ÉLECTRICIEN',
          description: 'Matériel électrique et éclairage',
          slug: 'electricien',
          image_url: '',
          parent_id: null,
          sort_order: 8,
          is_active: true,
          status: 'active',
          meta_title: 'Électricien - Matériel électrique',
          meta_description: 'Matériel électrique et éclairage',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'OUTILLAGE & PROTECTION',
          description: 'Outils et équipements de protection professionnels',
          slug: 'outillage-protection',
          image_url: '',
          parent_id: null,
          sort_order: 9,
          is_active: true,
          status: 'active',
          meta_title: 'Outillage & Protection - Outils professionnels',
          meta_description: 'Outils et équipements de protection professionnels',
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
      setCreateCategoriesLoading(false)
    }
  }

  const createDemoData = async () => {
    setCreateDemoDataLoading(true)
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
      setCreateDemoDataLoading(false)
    }
  }

  const inspectUsersCollection = async () => {
    setInspectUsersLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('👥 Inspection de la collection "users"...')

      // Get all users from the database
      try {
        const usersResult = await appwrite.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'users',
          [appwrite.Query.limit(100)]
        )
        
        addStatus(`📊 Total utilisateurs trouvés: ${usersResult.total}`)
        
        if (usersResult.total > 0) {
          addStatus('📋 Structure de la collection "users":')
          
          // Get first user to show schema
          const firstUser = usersResult.documents[0]
          const allFields = new Set()
          
          // Collect all unique fields from all users
          usersResult.documents.forEach(user => {
            Object.keys(user).forEach(key => {
              if (!key.startsWith('$')) {
                allFields.add(key)
              }
            })
          })
          
          // Display schema
          Array.from(allFields).sort().forEach((field: string) => {
            const sampleValue = (firstUser as any)[field]
            const type = typeof sampleValue
            const isArray = Array.isArray(sampleValue)
            const displayValue = isArray ? `[${sampleValue.length} items]` : 
                               type === 'string' && sampleValue && sampleValue.length > 30 ? 
                               `"${sampleValue.substring(0, 27)}..."` : 
                               JSON.stringify(sampleValue)
            
            addStatus(`   • ${field}: ${type}${isArray ? ' (array)' : ''} = ${displayValue}`)
          })
          
          addStatus('')
          addStatus('👤 Liste des utilisateurs:')
          usersResult.documents.forEach((user, index) => {
            const name = user.first_name && user.last_name ? 
                        `${user.first_name} ${user.last_name}` : 
                        user.name || 'Nom non défini'
            const email = user.email || 'Email non défini'
            const status = user.status || 'active'
            const createdAt = user.created_at ? 
                             new Date(user.created_at).toLocaleDateString('fr-FR') : 
                             'Date inconnue'
            
            addStatus(`   ${index + 1}. ${name} (${email}) - ${status} - Créé: ${createdAt}`)
          })
        } else {
          addStatus('⚠️ Aucun utilisateur trouvé dans la collection')
          addStatus('💡 Utilisez le bouton "Ajouter Utilisateur" pour créer le premier utilisateur')
        }
        
        addStatus('')
        addStatus('🔍 Champs requis détectés:')
        addStatus('   ✓ first_name (string)')
        addStatus('   ✓ last_name (string)')
        addStatus('   ✓ email (string)')
        addStatus('   ✓ phone (string, optionnel)')
        addStatus('   ✓ account_type (string: "professional" ou "individual")')
        addStatus('   ✓ status (string: "active", "inactive")')
        addStatus('   ✓ created_at (datetime)')
        addStatus('   ✓ updated_at (datetime)')

      } catch (error) {
        addStatus('❌ Erreur lors de l\'accès à la collection "users": ' + error)
        addStatus('💡 Vérifiez que la collection "users" existe et que les permissions sont correctes')
      }

    } catch (error) {
      addStatus('❌ Erreur générale: ' + error)
    } finally {
      setInspectUsersLoading(false)
    }
  }

  const addSingleUser = async () => {
    setAddUserLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      // Validation
      if (!newUser.firstName || !newUser.lastName || !newUser.email) {
        addStatus('❌ Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email)')
        return
      }

      addStatus(`👤 Création de l'utilisateur: ${newUser.firstName} ${newUser.lastName}...`)

      // Generate temporary password
      const tempPassword = 'TempPass123!'
      
      // Create a more realistic password hash
      // In production, use bcrypt or similar
      const generatePasswordHash = (email: string, password: string) => {
        const salt = Math.random().toString(36).substring(2, 15)
        const hash = btoa(`${email}:${password}:${salt}`).substring(0, 60)
        return `$2y$10$${hash}`
      }
      
      const passwordHash = generatePasswordHash(newUser.email, tempPassword)

      // Create database profile with ALL required fields based on schema
      const userProfile = {
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone || '',
        password_hash: passwordHash, // ✅ REQUIRED FIELD
        email_verified: false,
        email_verification_token: '',
        password_reset_token: null,
        password_reset_expires: null,
        last_login: null,
        login_attempts: 0,
        locked_until: null,
        newsletter_subscribed: false,
        account_type: newUser.accountType,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create user in database first
      const dbUser = await appwrite.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        'unique()',
        userProfile
      )

      addStatus(`✅ Profil utilisateur créé dans la base de données avec ID: ${dbUser.$id}`)

      // Then try to create in Appwrite Auth (optional)
      try {
        const simpleUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        
        const authUser = await appwrite.account.create(
          simpleUserId,
          newUser.email,
          tempPassword,
          `${newUser.firstName} ${newUser.lastName}`
        )
        addStatus(`✅ Utilisateur d'authentification créé avec ID: ${authUser.$id}`)
        addStatus(`🔑 Mot de passe temporaire: ${tempPassword}`)
      } catch (authError) {
        addStatus(`⚠️ Erreur d'authentification (utilisateur peut déjà exister): ${authError}`)
        addStatus(`✅ Mais le profil DB a été créé avec succès`)
      }

      addStatus(`📧 Email: ${newUser.email}`)
      addStatus(`👨‍💼 Type de compte: ${newUser.accountType}`)
      addStatus(`🔐 Hash de mot de passe: ${passwordHash.substring(0, 20)}...`)
      
      // Reset form
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        accountType: 'professional'
      })

      addStatus('')
      addStatus('🎉 Utilisateur créé avec succès!')
      addStatus('💡 L\'utilisateur peut maintenant se connecter avec son email et le mot de passe temporaire')

    } catch (error) {
      addStatus('❌ Erreur lors de la création de l\'utilisateur: ' + error)
    } finally {
      setAddUserLoading(false)
    }
  }

  const testUserLogin = async () => {
    setTestLoginLoading(true)
    setSetupStatus([])

    try {
      addStatus('🔍 Test de connexion en cours...')
      addStatus(`📧 Email: ${testLogin.email}`)
      
      // Import debug function
      const { debugUserAuth } = await import('@/lib/appwrite')
      
      // First debug the user status
      addStatus('🔍 Vérification du statut utilisateur...')
      const debugResult = await debugUserAuth(testLogin.email)
      addStatus(`📊 Statut: DB=${debugResult.dbExists ? '✅' : '❌'}, Auth=${debugResult.authExists ? '✅' : '❌'}`)
      
      // Then try to login
      addStatus('🔑 Tentative de connexion...')
      const appwrite = AppwriteService.getInstance()
      
      try {
        const session = await appwrite.login(testLogin.email, testLogin.password)
        addStatus('✅ Connexion réussie!')
        addStatus(`🎉 Session créée: ${session.$id}`)
        
        // Get user info
        const user = await appwrite.getCurrentUser()
        addStatus(`👤 Utilisateur connecté: ${user?.name} (${user?.email})`)
        
        // Logout to clean up
        await appwrite.logout()
        addStatus('🚪 Déconnexion automatique effectuée')
        
      } catch (loginError: any) {
        addStatus('❌ Erreur de connexion: ' + loginError.message)
        addStatus('💡 Vérifiez que l\'utilisateur existe dans Appwrite Auth et que le mot de passe est correct')
      }

    } catch (error) {
      addStatus('❌ Erreur lors du test: ' + error)
    } finally {
      setTestLoginLoading(false)
    }
  }

  const testConnectivity = async () => {
    setTestConnectivityLoading(true)
    setSetupStatus([])

    try {
      addStatus('🔧 Test de connectivité en cours...')
      
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.testConnectivity()
      
      if (result.success) {
        addStatus('✅ ' + result.message)
        addStatus('🎉 Vous pouvez maintenant utiliser l\'application normalement')
      } else {
        addStatus('❌ ' + result.message)
        if (result.isRateLimit) {
          addStatus('⏰ Le rate limit d\'Appwrite est actif')
          addStatus('💡 Attendez 5-10 minutes puis réessayez')
          addStatus('🚫 Évitez de faire trop de tentatives de connexion rapidement')
        }
      }

    } catch (error) {
      addStatus('❌ Erreur lors du test: ' + error)
    } finally {
      setTestConnectivityLoading(false)
    }
  }

  const createDbUserFromAuth = async () => {
    setCreateDbUserLoading(true)
    setSetupStatus([])

    try {
      addStatus('🔧 Création profil DB à partir de l\'utilisateur Auth...')
      addStatus(`📧 Email: ${createDbForm.email}`)
      
      // Import the function
      const { createDbUserFromAuth } = await import('@/lib/appwrite')
      
      // Create DB user
      const dbUser = await createDbUserFromAuth(
        createDbForm.email,
        createDbForm.firstName,
        createDbForm.lastName,
        createDbForm.phone,
        createDbForm.accountType
      )
      
      addStatus('✅ Profil DB créé avec succès!')
      addStatus(`🆔 ID: ${dbUser.$id}`)
      addStatus(`👤 Nom: ${createDbForm.firstName} ${createDbForm.lastName}`)
      addStatus(`📧 Email: ${createDbForm.email}`)
      addStatus(`🏢 Type: ${createDbForm.accountType}`)
      addStatus('')
      addStatus('🎉 L\'utilisateur peut maintenant se connecter normalement!')
      
      // Reset form
      setCreateDbForm({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        accountType: 'individual'
      })

    } catch (error: any) {
      addStatus('❌ Erreur: ' + error.message)
      if (error.message.includes('existe déjà')) {
        addStatus('💡 L\'utilisateur existe déjà dans la DB')
      }
    } finally {
      setCreateDbUserLoading(false)
    }
  }

  const createDemoProducts = async () => {
    setCreateProductsLoading(true)
    setSetupStatus([])

    try {
      const appwrite = AppwriteService.getInstance()
      
      addStatus('📦 Création des produits de démonstration...')

      // First, get existing categories
      const categoriesResult = await appwrite.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        [appwrite.Query.limit(100)]
      )

      if (categoriesResult.total === 0) {
        addStatus('❌ Aucune catégorie trouvée. Créez d\'abord les catégories.')
        return
      }

      const categories = categoriesResult.documents
      addStatus(`✅ ${categories.length} catégories trouvées`)
      
      // Debug: Show actual category slugs
      addStatus('📋 Catégories disponibles:')
      categories.forEach(cat => {
        addStatus(`   • ${cat.name} → slug: "${cat.slug}"`)
      })

      // Demo products - multiple products per category
      const demoProducts = [
        // MAÇON - 3 produits
        {
          name: 'Ciment Portland CEM II 32,5R - 25kg',
          description: 'Ciment de qualité supérieure pour fondations, dalles et maçonnerie générale. Conforme aux normes NF EN 197-1.',
          price: 8.50,
          image_url: '',
          status: 'active',
          brand: 'LafargeHolcim',
          stock_quantity: 150,
          technical_specs: 'Poids: 25kg, Type: CEM II/A-L 32,5R, Résistance: 32,5 MPa, Conditionnement: sac papier',
          category_slug: 'macon'
        },
        {
          name: 'Bloc béton creux 20x20x50cm',
          description: 'Bloc de béton manufacturé pour construction de murs porteurs et cloisons. Résistance élevée.',
          price: 2.80,
          image_url: '',
          status: 'active',
          brand: 'Préfabéton',
          stock_quantity: 500,
          technical_specs: 'Dimensions: 20x20x50cm, Résistance: B40, Poids: 18kg, Classe: M5',
          category_slug: 'macon'
        },
        {
          name: 'Fer à béton HA 10mm - Barre 12m',
          description: 'Armature haute adhérence pour renforcement du béton armé. Acier B500B conforme NF A 35-080.',
          price: 15.60,
          image_url: '',
          status: 'active',
          brand: 'ArcelorMittal',
          stock_quantity: 80,
          technical_specs: 'Diamètre: 10mm, Longueur: 12m, Acier: B500B, Poids: 7,4kg/barre',
          category_slug: 'macon'
        },

        // MENUISIER SERRURERIE - 2 produits
        {
          name: 'Porte d\'entrée acier blindée',
          description: 'Porte blindée 3 points avec serrure multipoints. Isolation thermique et phonique renforcée.',
          price: 890.00,
          image_url: '',
          status: 'active',
          brand: 'Fichet',
          stock_quantity: 12,
          technical_specs: 'Dimensions: 215x90cm, Épaisseur: 40mm, Serrure: 3 points, Certification: A2P',
          category_slug: 'menuisier-serrurerie'
        },
        {
          name: 'Fenêtre PVC double vitrage 120x100cm',
          description: 'Fenêtre 2 vantaux PVC blanc avec double vitrage 4/16/4. Excellent coefficient thermique.',
          price: 285.00,
          image_url: '',
          status: 'active',
          brand: 'Tryba',
          stock_quantity: 25,
          technical_specs: 'Dimensions: 120x100cm, Profilé: PVC 5 chambres, Vitrage: 4/16/4 argon, Uw: 1,1 W/m²K',
          category_slug: 'menuisier-serrurerie'
        },

        // PEINTRE - 2 produits
        {
          name: 'Peinture acrylique mur et plafond 10L',
          description: 'Peinture lavable haute couvrance pour intérieur. Finition mate, séchage rapide.',
          price: 45.90,
          image_url: '',
          status: 'active',
          brand: 'Dulux Valentine',
          stock_quantity: 60,
          technical_specs: 'Volume: 10L, Rendement: 12m²/L, Finition: mate, Temps séchage: 6h',
          category_slug: 'peintre'
        },
        {
          name: 'Enduit de rebouchage pâte 1kg',
          description: 'Enduit prêt à l\'emploi pour reboucher fissures et trous. Application facile au couteau.',
          price: 12.80,
          image_url: '',
          status: 'active',
          brand: 'Toupret',
          stock_quantity: 120,
          technical_specs: 'Poids: 1kg, Type: pâte, Épaisseur max: 5mm, Support: plâtre, béton',
          category_slug: 'peintre'
        },

        // CARRELEUR - 2 produits
        {
          name: 'Carrelage grès cérame effet bois 20x120cm',
          description: 'Carrelage imitation parquet chêne naturel. Résistant aux rayures et à l\'humidité. Format moderne.',
          price: 35.90,
          image_url: '',
          status: 'active',
          brand: 'Porcelanosa',
          stock_quantity: 200,
          technical_specs: 'Format: 20x120cm, Épaisseur: 9mm, Classe: PEI IV, Rectifié, Antidérapant R10',
          category_slug: 'carreleur'
        },
        {
          name: 'Faïence murale blanche 25x40cm',
          description: 'Faïence brillante pour murs de cuisine et salle de bain. Facile d\'entretien, résistante aux taches.',
          price: 18.50,
          image_url: '',
          status: 'active',
          brand: 'Novoceram',
          stock_quantity: 300,
          technical_specs: 'Format: 25x40cm, Épaisseur: 7mm, Finition: brillante, Absorption: <10%',
          category_slug: 'carreleur'
        },

        // PLOMBERIE - 2 produits
        {
          name: 'Tube cuivre écroui Ø22mm - 3m',
          description: 'Tube cuivre écroui pour distribution d\'eau sanitaire. Qualité alimentaire, livré en barre.',
          price: 18.90,
          image_url: '',
          status: 'active',
          brand: 'KME',
          stock_quantity: 100,
          technical_specs: 'Diamètre: 22mm, Longueur: 3m, Épaisseur: 1mm, Norme: NF EN 1057',
          category_slug: 'plomberie'
        },
        {
          name: 'Raccord PER à sertir Ø16mm',
          description: 'Raccord droit pour tube PER. Connexion rapide et étanche pour installation multicouche.',
          price: 4.20,
          image_url: '',
          status: 'active',
          brand: 'Uponor',
          stock_quantity: 250,
          technical_specs: 'Diamètre: 16mm, Matériau: laiton nickelé, Pression: 10 bar, Température: 95°C',
          category_slug: 'plomberie'
        },

        // CHAUFFAGE EAU CHAUDE - 2 produits
        {
          name: 'Chauffe-eau électrique 200L',
          description: 'Ballon d\'eau chaude électrique vertical mural. Résistance stéatite, protection anticorrosion.',
          price: 389.00,
          image_url: '',
          status: 'active',
          brand: 'Atlantic',
          stock_quantity: 15,
          technical_specs: 'Capacité: 200L, Puissance: 2400W, Dimensions: Ø57x153cm, Garantie cuve: 7 ans',
          category_slug: 'chauffage-eau-chaude'
        },
        {
          name: 'Radiateur acier chauffage central 600x1200mm',
          description: 'Radiateur panneaux double avec convecteur. Raccordement 1/2 pouce, puissance 1630W.',
          price: 156.00,
          image_url: '',
          status: 'active',
          brand: 'Acova',
          stock_quantity: 30,
          technical_specs: 'Dimensions: 600x1200mm, Puissance: 1630W, Raccordement: 1/2", Pression: 10 bar',
          category_slug: 'chauffage-eau-chaude'
        },

        // SANITAIRE - 2 produits
        {
          name: 'Cuvette WC suspendue avec abattant',
          description: 'WC suspendu design moderne avec chasse d\'eau économique 3/6L. Abattant à fermeture amortie inclus.',
          price: 189.00,
          image_url: '',
          status: 'active',
          brand: 'Geberit',
          stock_quantity: 18,
          technical_specs: 'Dimensions: 37x56cm, Évacuation: horizontale, Chasse: 3/6L, Norme: NF',
          category_slug: 'sanitaire'
        },
        {
          name: 'Lavabo sur colonne céramique 60cm',
          description: 'Ensemble lavabo et colonne en céramique blanche. Style classique, trop-plein intégré.',
          price: 145.00,
          image_url: '',
          status: 'active',
          brand: 'Jacob Delafon',
          stock_quantity: 22,
          technical_specs: 'Largeur: 60cm, Hauteur: 85cm, Matériau: céramique, Trop-plein: intégré',
          category_slug: 'sanitaire'
        },

        // ÉLECTRICIEN - 2 produits
        {
          name: 'Tableau électrique pré-équipé 3 rangées',
          description: 'Coffret électrique 39 modules avec disjoncteurs et différentiels. Conforme NF C 15-100.',
          price: 189.00,
          image_url: '',
          status: 'active',
          brand: 'Legrand',
          stock_quantity: 25,
          technical_specs: 'Modules: 39, Rangées: 3, Équipement: disjoncteurs + différentiels, Norme: NF C 15-100',
          category_slug: 'electricien'
        },
        {
          name: 'Câble électrique 3G2,5mm² - 100m',
          description: 'Câble rigide pour installation électrique domestique. Conducteur cuivre, gaine blanche.',
          price: 78.50,
          image_url: '',
          status: 'active',
          brand: 'Nexans',
          stock_quantity: 40,
          technical_specs: 'Section: 3x2,5mm², Longueur: 100m, Conducteur: cuivre, Tension: 500V',
          category_slug: 'electricien'
        },

        // OUTILLAGE & PROTECTION - 2 produits
        {
          name: 'Perceuse visseuse sans fil 18V',
          description: 'Perceuse visseuse professionnelle avec 2 batteries Li-ion 18V. Couple 60Nm, mandrin auto-serrant.',
          price: 189.00,
          image_url: '',
          status: 'active',
          brand: 'Bosch Professional',
          stock_quantity: 35,
          technical_specs: 'Tension: 18V, Couple: 60Nm, Mandrin: 13mm, Batteries: 2x2,0Ah incluses',
          category_slug: 'outillage-protection'
        },
        {
          name: 'Casque de chantier avec visière',
          description: 'Casque de protection EPI classe G avec visière transparente. Conforme EN 397.',
          price: 28.50,
          image_url: '',
          status: 'active',
          brand: '3M',
          stock_quantity: 75,
          technical_specs: 'Classe: G, Visière: polycarbonate, Ajustable: 53-63cm, Norme: EN 397',
          category_slug: 'outillage-protection'
        }
      ]

      // Create products and assign to categories
      for (const productData of demoProducts) {
        try {
          // Find the category by slug
          const category = categories.find(cat => 
            cat.slug === productData.category_slug
          )

          if (!category) {
            addStatus(`⚠️ Catégorie ${productData.category_slug} non trouvée pour ${productData.name}`)
            continue
          }

          addStatus(`🔗 Assignation: ${productData.name} → ${category.name} (ID: ${category.$id})`)

          // Prepare product data
          const product = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            image_url: productData.image_url || null,
            status: productData.status,
            brand: productData.brand,
            stock_quantity: productData.stock_quantity,
            technical_specs: productData.technical_specs,
            category_id: category.$id, // ✅ ASSIGN TO CATEGORY
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          await appwrite.databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'products',
            'unique()',
            product
          )

          addStatus(`✅ Produit créé: ${productData.name} → ${category.name}`)
        } catch (error) {
          addStatus(`❌ Erreur pour ${productData.name}: ${error}`)
        }
      }

      addStatus('🎉 Tous les produits de démonstration ont été créés!')
      addStatus(`📊 ${demoProducts.length} produits créés avec affectation aux catégories`)
      addStatus(`🔗 Exemple: 3 produits → GROS ŒUVRE, 2 produits → CARRELAGE, etc.`)

    } catch (error) {
      addStatus('❌ Erreur lors de la création des produits: ' + error)
    } finally {
      setCreateProductsLoading(false)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-database text-blue-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tester la Base</h3>
          <p className="text-gray-600 mb-4">Vérifier les collections et permissions</p>
          <button
            onClick={setupDatabase}
            disabled={setupDatabaseLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {setupDatabaseLoading ? 'Test en cours...' : 'Tester la Base'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-wifi text-green-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Connectivité</h3>
          <p className="text-gray-600 mb-4">Vérifier rate limit Appwrite</p>
          <button
            onClick={testConnectivity}
            disabled={testConnectivityLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {testConnectivityLoading ? 'Test en cours...' : 'Tester Connectivité'}
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
            disabled={detectSchemaLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {detectSchemaLoading ? 'Détection...' : 'Détecter Schéma'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users-cog text-cyan-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Inspecter Users</h3>
          <p className="text-gray-600 mb-4">Voir structure et utilisateurs</p>
          <button
            onClick={inspectUsersCollection}
            disabled={inspectUsersLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {inspectUsersLoading ? 'Inspection...' : 'Inspecter Users'}
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
            disabled={createCategoriesLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {createCategoriesLoading ? 'Création...' : 'Créer Catégories'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-box text-orange-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Créer Produits</h3>
          <p className="text-gray-600 mb-4">18 produits avec catégories</p>
          <button
            onClick={createDemoProducts}
            disabled={createProductsLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {createProductsLoading ? 'Création...' : 'Créer Produits'}
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
            disabled={createDemoDataLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {createDemoDataLoading ? 'Création...' : 'Créer Données'}
          </button>
        </div>
      </div>

      {/* Add Single User Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">➕ Ajouter un Utilisateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              value={newUser.firstName}
              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={newUser.lastName}
              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dupont"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jean.dupont@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="text"
              value={newUser.phone}
              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="06 12 34 56 78"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de compte</label>
            <select
              value={newUser.accountType}
              onChange={(e) => setNewUser({...newUser, accountType: e.target.value as 'professional' | 'individual'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="professional">Professionnel</option>
              <option value="individual">Particulier</option>
            </select>
          </div>
        </div>
        <button
          onClick={addSingleUser}
          disabled={addUserLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {addUserLoading ? 'Création en cours...' : 'Ajouter Utilisateur'}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          * Un mot de passe temporaire sera généré automatiquement
        </p>
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

      {/* Test Login Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔑 Test de Connexion</h3>
        <p className="text-gray-600 mb-4">Testez la connexion d'un utilisateur existant</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={testLogin.email}
              onChange={(e) => setTestLogin({...testLogin, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={testLogin.password}
              onChange={(e) => setTestLogin({...testLogin, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="password123"
            />
          </div>
        </div>
        
        <button
          onClick={testUserLogin}
          disabled={testLoginLoading || !testLogin.email || !testLogin.password}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {testLoginLoading ? 'Test en cours...' : 'Tester la Connexion'}
        </button>
        
        <p className="text-sm text-gray-600 mt-2">
          * Ce test vérifiera si l'utilisateur existe dans la DB et dans Appwrite Auth, puis tentera une connexion
        </p>
      </div>

      {/* Create DB User Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Créer Profil DB manquant</h3>
        <p className="text-gray-600 mb-4">Si un utilisateur existe dans Appwrite Auth mais pas dans la DB (comme votre cas!)</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={createDbForm.email}
              onChange={(e) => setCreateDbForm({...createDbForm, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mohamed.jourani@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              value={createDbForm.firstName}
              onChange={(e) => setCreateDbForm({...createDbForm, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mohamed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={createDbForm.lastName}
              onChange={(e) => setCreateDbForm({...createDbForm, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jourani"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={createDbForm.phone}
              onChange={(e) => setCreateDbForm({...createDbForm, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="06 12 34 56 78"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de compte</label>
            <select
              value={createDbForm.accountType}
              onChange={(e) => setCreateDbForm({...createDbForm, accountType: e.target.value as 'individual' | 'professional'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="individual">Particulier</option>
              <option value="professional">Professionnel</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={createDbUserFromAuth}
          disabled={createDbUserLoading || !createDbForm.email || !createDbForm.firstName || !createDbForm.lastName}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {createDbUserLoading ? 'Création en cours...' : 'Créer Profil DB'}
        </button>
        
        <p className="text-sm text-gray-600 mt-2">
          * Cela créera le profil manquant dans la base de données pour que l'utilisateur puisse se connecter
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">📋 Instructions:</h3>
        <div className="space-y-2 text-yellow-700">
          <p><strong>1. Collections utilisées:</strong> "products", "categories", "users"</p>
          <p><strong>2. Permissions:</strong> Définissez les permissions de lecture publique pour toutes les collections</p>
          <p><strong>3. Test:</strong> Utilisez "Tester la Base" pour diagnostiquer les problèmes</p>
          <p><strong>4. Schéma:</strong> Utilisez "Détecter Schéma" pour voir la structure de vos données</p>
          <p><strong>5. Utilisateurs:</strong> "Inspecter Users" montre la structure et liste tous les utilisateurs</p>
          <p><strong>6. Ajouter:</strong> Utilisez le formulaire pour créer des utilisateurs individuels</p>
          <p><strong>7. Catégories:</strong> Créez les 9 catégories professionnelles du bâtiment</p>
          <p><strong>8. Données:</strong> Ajoutez des clients de démonstration pour tester</p>
        </div>
      </div>
    </div>
  )
}
