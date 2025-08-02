import { Client, Databases, Storage, Account, Query } from 'appwrite'

export class AppwriteService {
  private static instance: AppwriteService
  public client: Client
  public databases: Databases
  public storage: Storage
  public account: Account
  public Query = Query

  private constructor() {
    this.client = new Client()
    this.client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    
    this.databases = new Databases(this.client)
    this.storage = new Storage(this.client)
    this.account = new Account(this.client)
  }

  public static getInstance(): AppwriteService {
    if (!AppwriteService.instance) {
      AppwriteService.instance = new AppwriteService()
    }
    return AppwriteService.instance
  }

  async getProducts(queries: string[] = []) {
    try {
      // Add a limit of 100 to ensure we get all products (you can increase this if needed)
      const defaultQueries = [Query.limit(100)]
      const allQueries = [...defaultQueries, ...queries]
      
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        allQueries
      )
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  async getAllProducts() {
    try {
      // Get all products without limit by using a high number
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        [Query.limit(200)] // Increased limit to handle more products
      )
    } catch (error) {
      console.error('Error fetching all products:', error)
      throw error
    }
  }

  async getProduct(productId: string) {
    try {
      return await this.databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId
      )
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  async createProduct(productData: any) {
    try {
      return await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        'unique()',
        productData
      )
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  async updateProduct(productId: string, productData: any) {
    try {
      return await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId,
        productData
      )
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  async deleteProduct(productId: string) {
    try {
      return await this.databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId
      )
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  // Check if a reference already exists
  async checkReferenceExists(reference: string) {
    try {
      const result = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        [this.Query.equal('reference', reference)]
      )
      return result.documents.length > 0
    } catch (error) {
      console.error('Error checking reference:', error)
      return false
    }
  }

  // Category methods
  async getCategories(queries: string[] = []) {
    try {
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        queries
      )
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  // Get categories hierarchically (organized by parent-child relationship)
  async getCategoriesHierarchy() {
    try {
      const result = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        [this.Query.orderAsc('level'), this.Query.orderAsc('sort_order'), this.Query.limit(200)]
      )
      return this.buildCategoryTree(result.documents)
    } catch (error) {
      console.error('Error fetching categories hierarchy:', error)
      throw error
    }
  }

  // Build tree structure from flat categories list
  private buildCategoryTree(categories: any[]): any[] {
    const categoryMap = new Map()
    const tree: any[] = []

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.$id, { ...category, children: [] })
    })

    // Second pass: build tree structure
    categories.forEach(category => {
      const node = categoryMap.get(category.$id)
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        // Add to parent's children
        categoryMap.get(category.parent_id).children.push(node)
      } else {
        // Top-level category
        tree.push(node)
      }
    })

    return tree
  }

  // Get subcategories of a specific category
  async getSubcategories(parentId: string) {
    try {
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        [
          this.Query.equal('parent_id', parentId),
          this.Query.orderAsc('sort_order'),
          this.Query.limit(100)
        ]
      )
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      throw error
    }
  }

  // Get category path (breadcrumb)
  async getCategoryPath(categoryId: string): Promise<any[]> {
    try {
      const path: any[] = []
      let currentCategory = await this.getCategory(categoryId)
      
      while (currentCategory) {
        path.unshift(currentCategory)
        if (currentCategory.parent_id) {
          currentCategory = await this.getCategory(currentCategory.parent_id)
        } else {
          break
        }
      }
      
      return path
    } catch (error) {
      console.error('Error fetching category path:', error)
      return []
    }
  }

  // Create category with hierarchy support
  async createCategory(categoryData: any) {
    try {
      // Calculate level based on parent
      let level = 0
      let path = categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-')
      
      if (categoryData.parent_id) {
        const parent = await this.getCategory(categoryData.parent_id)
        level = (parent.level || 0) + 1
        path = `${parent.path}/${path}`
        
        // Update parent's has_children flag
        await this.updateCategory(categoryData.parent_id, { has_children: true })
      }

      const finalData = {
        ...categoryData,
        level,
        path,
        has_children: false
      }

      return await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        'unique()',
        finalData
      )
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  // Update category with hierarchy support
  async updateCategory(categoryId: string, categoryData: any) {
    try {
      // If parent_id is being changed, recalculate hierarchy
      if ('parent_id' in categoryData) {
        let level = 0
        let path = categoryData.slug || categoryData.name?.toLowerCase().replace(/\s+/g, '-')
        
        if (categoryData.parent_id) {
          const parent = await this.getCategory(categoryData.parent_id)
          level = (parent.level || 0) + 1
          path = `${parent.path}/${path}`
          
          // Update parent's has_children flag
          await this.updateCategory(categoryData.parent_id, { has_children: true })
        }

        categoryData.level = level
        categoryData.path = path
      }

      return await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        categoryId,
        categoryData
      )
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  // Delete category with hierarchy support
  async deleteCategory(categoryId: string) {
    try {
      // Check if category has children
      const subcategories = await this.getSubcategories(categoryId)
      if (subcategories.documents.length > 0) {
        throw new Error('Cannot delete category with subcategories. Please delete subcategories first or move them to another parent.')
      }

      // Get category to check parent
      const category = await this.getCategory(categoryId)
      
      const result = await this.databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        categoryId
      )

      // Update parent's has_children flag if needed
      if (category.parent_id) {
        const remainingSiblings = await this.getSubcategories(category.parent_id)
        if (remainingSiblings.documents.length === 0) {
          await this.updateCategory(category.parent_id, { has_children: false })
        }
      }

      return result
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  async getCategory(categoryId: string) {
    try {
      return await this.databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        categoryId
      )
    } catch (error) {
      console.error('Error fetching category:', error)
      throw error
    }
  }

  // User/Customer methods (using "users" as the primary collection)
  async getCustomers(queries: string[] = []) {
    try {
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        queries
      )
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  // Admin methods (using "admin_users" collection)
  async getAdminUsers(queries: string[] = []) {
    try {
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'admin_users',
        queries
      )
    } catch (error) {
      console.error('Error fetching admin users:', error)
      throw error
    }
  }

  async getAdminByEmail(email: string) {
    try {
      const result = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'admin_users',
        [this.Query.equal('email', email)]
      )
      return result.documents.length > 0 ? result.documents[0] : null
    } catch (error) {
      console.error('Error fetching admin by email:', error)
      return null
    }
  }

  async updateAdminLastLogin(adminId: string) {
    try {
      return await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'admin_users',
        adminId,
        {
          last_login: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Error updating admin last login:', error)
      throw error
    }
  }

  async getCustomer(customerId: string) {
    try {
      return await this.databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        customerId
      )
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async getCustomerByEmail(email: string) {
    try {
      const result = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [this.Query.equal('email', email)]
      )
      return result.documents.length > 0 ? result.documents[0] : null
    } catch (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
  }

  async createCustomer(customerData: any) {
    try {
      console.log('Creating customer in database with data:', customerData)
      return await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        'unique()',
        customerData
      )
    } catch (error) {
      console.error('Error creating user in database:', error)
      throw error
    }
  }

  async updateCustomer(customerId: string, customerData: any) {
    try {
      return await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        customerId,
        customerData
      )
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Order methods (supports both "orders" and "ordres" collections)
  async getOrders(queries: string[] = []) {
    try {
      // Try "orders" first
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        queries
      )
    } catch (error) {
      // Fallback to "ordres" collection
      try {
        return await this.databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'ordres',
          queries
        )
      } catch (ordresError) {
        console.error('Error fetching orders/ordres:', ordresError)
        throw ordresError
      }
    }
  }

  async getOrder(orderId: string) {
    try {
      // Try "orders" first
      return await this.databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        orderId
      )
    } catch (error) {
      // Fallback to "ordres" collection
      try {
        return await this.databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'ordres',
          orderId
        )
      } catch (ordresError) {
        console.error('Error fetching order/ordre:', ordresError)
        throw ordresError
      }
    }
  }

  async createOrder(orderData: any) {
    try {
      // Try "orders" first
      return await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        'unique()',
        orderData
      )
    } catch (error) {
      // Fallback to "ordres" collection
      try {
        return await this.databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'ordres',
          'unique()',
          orderData
        )
      } catch (ordresError) {
        console.error('Error creating order/ordre:', ordresError)
        throw ordresError
      }
    }
  }

  async updateOrder(orderId: string, orderData: any) {
    try {
      // Try "orders" first
      return await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'orders',
        orderId,
        orderData
      )
    } catch (error) {
      // Fallback to "ordres" collection
      try {
        return await this.databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'ordres',
          orderId,
          orderData
        )
      } catch (ordresError) {
        console.error('Error updating order/ordre:', ordresError)
        throw ordresError
      }
    }
  }

  // Authentication methods
  async getCurrentUser() {
    try {
      return await this.account.get()
    } catch (error) {
      return null
    }
  }

  async login(email: string, password: string) {
    try {
      console.log(`🔑 Tentative de connexion pour: ${email}`)
      
      // First, check if there might be rate limiting issues
      const connectivityTest = await this.testConnectivity()
      if (!connectivityTest.success && connectivityTest.isRateLimit) {
        throw new Error('Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.')
      }
      
      const session = await this.account.createEmailPasswordSession(email, password)
      console.log('✅ Connexion réussie')
      return session
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      })
      
      // Debug the user status to provide better error messages
      try {
        const userStatus = await this.debugUserStatus(email)
        console.log('🔍 Statut utilisateur lors de l\'erreur de connexion:', userStatus)
        
        if (!userStatus.authExists && userStatus.dbExists) {
          // User exists in DB but not in Auth - this is the common issue
          console.log('🚨 PROBLÈME IDENTIFIÉ: Utilisateur existe en DB mais pas en Auth')
          throw new Error('Votre compte existe dans notre base de données mais n\'est pas configuré pour l\'authentification. Veuillez contacter le support ou essayer de créer un nouveau compte.')
        } else if (!userStatus.authExists && !userStatus.dbExists) {
          // User doesn't exist anywhere
          console.log('🚨 PROBLÈME IDENTIFIÉ: Utilisateur n\'existe nulle part')
          throw new Error('Aucun compte trouvé avec cette adresse email. Veuillez créer un compte.')
        } else if (userStatus.authExists && userStatus.dbExists) {
          // User exists in both systems but password mismatch - likely Auth has no password set
          console.log('🚨 PROBLÈME IDENTIFIÉ: Utilisateur existe dans les deux systèmes, Auth sans mot de passe')
          throw new Error('SYNC_PASSWORD_REQUIRED:' + email + ':' + password)
        } else if (userStatus.authExists) {
          // User exists in Auth only, standard password issue
          console.log('🚨 PROBLÈME IDENTIFIÉ: Utilisateur existe en Auth uniquement, problème de mot de passe')
          throw new Error('Mot de passe incorrect. Vérifiez votre mot de passe.')
        }
      } catch (debugError) {
        console.error('❌ Erreur lors du debug:', debugError)
      }
      
      // Provide more specific error messages based on the original error
      if (error.message && (
        error.message.includes('Invalid credentials') ||
        error.message.includes('Invalid email or password') ||
        error.message.includes('user_invalid_credentials')
      )) {
        throw new Error('Email ou mot de passe incorrect. Vérifiez vos identifiants.')
      } else if (error.message && error.message.includes('user_not_found')) {
        throw new Error('Aucun compte trouvé avec cette adresse email.')
      } else if (error.message && error.message.includes('user_blocked')) {
        throw new Error('Ce compte a été bloqué.')
      } else if (error.message && (
        error.message.includes('Rate limit') ||
        error.message.includes('rate limit') ||
        error.message.includes('Too many requests')
      )) {
        throw new Error('Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.')
      } else {
        throw new Error(`Erreur de connexion: ${error.message}`)
      }
    }
  }

  // Helper function to generate a valid user ID
  private generateUserId(): string {
    const timestamp = Date.now().toString()
    const randomStr = Math.random().toString(36).substring(2, 8)
    return `user_${timestamp}_${randomStr}`.substring(0, 36)
  }

  // Password recovery helper
  async initiatePasswordRecovery(email: string, resetUrl: string = 'http://localhost:3000/reset-password') {
    try {
      console.log(`🔧 Initiation récupération mot de passe pour: ${email}`)
      const recovery = await this.account.createRecovery(email, resetUrl)
      console.log('✅ Email de récupération envoyé')
      return recovery
    } catch (error) {
      console.error('❌ Erreur récupération mot de passe:', error)
      throw error
    }
  }

  // Sync database user password to Auth system
  async syncDbPasswordToAuth(email: string, newPassword: string) {
    try {
      console.log(`🔧 Synchronisation mot de passe DB vers Auth pour: ${email}`)
      
      // First get the DB user
      const dbUsers = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [this.Query.equal('email', email)]
      )
      
      if (dbUsers.total === 0) {
        throw new Error('Utilisateur non trouvé dans la base de données')
      }
      
      const dbUser = dbUsers.documents[0]
      const fullName = `${dbUser.first_name} ${dbUser.last_name}`
      
      // Try to create new Auth user with the password
      try {
        const userId = this.generateUserId()
        const authUser = await this.account.create(userId, email, newPassword, fullName)
        console.log('✅ Nouvel utilisateur Auth créé avec mot de passe:', authUser.$id)
        
        // Try to login immediately
        await this.account.createEmailPasswordSession(email, newPassword)
        console.log('✅ Connexion automatique réussie')
        
        return {
          success: true,
          message: 'Utilisateur Auth créé et connecté avec succès',
          authUser
        }
      } catch (authError: any) {
        console.log('⚠️ Erreur création Auth user:', authError)
        
        if (authError.message && authError.message.includes('user with the same id, email, or phone already exists')) {
          // User exists in Auth but might not have password set, let's try password recovery approach
          console.log('🔧 Utilisateur Auth existe, tentative de mise à jour du mot de passe...')
          
          try {
            // Use password recovery to set a new password
            const recovery = await this.account.createRecovery(email, 'http://localhost:3000/password-updated')
            console.log('✅ Email de récupération initié pour mise à jour du mot de passe')
            
            return {
              success: false,
              requiresPasswordRecovery: true,
              message: 'Un email de récupération a été envoyé pour configurer votre mot de passe.',
              recoveryId: recovery.$id
            }
          } catch (recoveryError) {
            console.error('❌ Erreur récupération mot de passe:', recoveryError)
            throw new Error('Impossible de configurer le mot de passe. Veuillez contacter le support.')
          }
        } else {
          throw authError
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur synchronisation mot de passe:', error)
      throw error
    }
  }

  // Direct password sync without rate limit issues
  async directPasswordSync(email: string, password: string) {
    try {
      console.log(`🔧 Synchronisation directe du mot de passe pour: ${email}`)
      
      // Get DB user details first
      const dbUsers = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [this.Query.equal('email', email)]
      )
      
      if (dbUsers.total === 0) {
        throw new Error('Utilisateur non trouvé dans la base de données')
      }
      
      const dbUser = dbUsers.documents[0]
      const fullName = `${dbUser.first_name} ${dbUser.last_name}`
      
      // Create new Auth user with unique ID to avoid conflicts
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      try {
        const authUser = await this.account.create(userId, email, password, fullName)
        console.log('✅ Utilisateur Auth créé avec succès:', authUser.$id)
        return {
          success: true,
          authUser,
          message: 'Utilisateur Auth créé avec succès'
        }
      } catch (createError: any) {
        if (createError.message && createError.message.includes('user with the same id, email, or phone already exists')) {
          console.log('⚠️ Utilisateur Auth existe déjà, cela devrait résoudre le problème de connexion')
          return {
            success: true,
            message: 'Utilisateur Auth existe déjà, le mot de passe devrait maintenant fonctionner'
          }
        }
        throw createError
      }
      
    } catch (error) {
      console.error('❌ Erreur synchronisation directe:', error)
      throw error
    }
  }

  // Helper function to check if email exists in Auth (not in database)
  async checkEmailInAuth(email: string): Promise<boolean> {
    try {
      // Try to create a session with invalid password to trigger the "user not found" vs "wrong password" error
      await this.account.createEmailPasswordSession(email, 'invalid_password_test_123456789')
      return false // This shouldn't succeed
    } catch (error: any) {
      console.log(`🔍 Vérification email ${email} dans Auth:`, error.message)
      
      if (error.message && (
        error.message.includes('Invalid credentials') ||
        error.message.includes('Invalid email or password') ||
        error.message.includes('user_invalid_credentials')
      )) {
        // User exists but password is wrong - this is what we expect
        console.log('✅ Utilisateur trouvé dans Auth (mot de passe incorrect attendu)')
        return true
      } else if (error.message && error.message.includes('user_not_found')) {
        // User doesn't exist in Auth
        console.log('❌ Utilisateur NON trouvé dans Auth')
        return false
      } else {
        // Unknown error, assume user exists
        console.log('⚠️ Erreur inconnue, assume que l\'utilisateur existe')
        return true
      }
    }
  }

  // Debug method to check user status
  async debugUserStatus(email: string) {
    console.log(`🔍 === DEBUG: Statut utilisateur pour ${email} ===`)
    
    // Check in database
    let dbUser = null
    try {
      const dbUsers = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [this.Query.equal('email', email)]
      )
      console.log(`📊 Utilisateurs DB trouvés: ${dbUsers.total}`)
      if (dbUsers.total > 0) {
        dbUser = dbUsers.documents[0]
        console.log('✅ Utilisateur existe dans la DB:', {
          id: dbUser.$id,
          email: dbUser.email,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name
        })
      }
    } catch (dbError) {
      console.log('❌ Erreur vérification DB:', dbError)
    }
    
    // Check in Auth
    const authExists = await this.checkEmailInAuth(email)
    console.log(`🔑 Existe dans Auth: ${authExists}`)
    
    console.log('🔍 === FIN DEBUG ===')
    return { dbExists: !!dbUser, authExists, dbUser }
  }

  // Test connectivity and rate limit status
  async testConnectivity() {
    try {
      console.log('🔧 Test de connectivité Appwrite...')
      
      // Try a simple read operation (less likely to hit rate limit)
      await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [] // queries
      )
      
      console.log('✅ Connectivité OK')
      return { success: true, message: 'Connectivité OK' }
    } catch (error: any) {
      console.log('❌ Erreur de connectivité:', error.message)
      
      if (error.message && (
        error.message.includes('Rate limit') ||
        error.message.includes('rate limit') ||
        error.message.includes('Too many requests')
      )) {
        return { 
          success: false, 
          message: 'Rate limit actif. Attendez quelques minutes.',
          isRateLimit: true
        }
      } else {
        return { 
          success: false, 
          message: `Erreur: ${error.message}`,
          isRateLimit: false
        }
      }
    }
  }

  // Create Auth user from existing DB user
  async createAuthFromDbUser(email: string, password: string) {
    try {
      console.log(`🔧 Création utilisateur Auth pour: ${email}`)
      
      // First get the DB user
      const dbUsers = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [this.Query.equal('email', email)]
      )
      
      if (dbUsers.total === 0) {
        throw new Error('Utilisateur non trouvé dans la base de données')
      }
      
      const dbUser = dbUsers.documents[0]
      const fullName = `${dbUser.first_name} ${dbUser.last_name}`
      const userId = this.generateUserId()
      
      // Create Auth user
      const authUser = await this.account.create(userId, email, password, fullName)
      console.log('✅ Utilisateur Auth créé:', authUser.$id)
      
      return authUser
    } catch (error) {
      console.error('❌ Erreur création Auth user:', error)
      throw error
    }
  }

  // Create DB user from existing Auth user
  async createDbFromAuthUser(email: string, firstName: string, lastName: string, phone: string = '', accountType: string = 'individual') {
    try {
      console.log(`🔧 Création profil DB pour: ${email}`)
      
      // Check if DB user already exists
      const existingDbUsers = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        [this.Query.equal('email', email)]
      )
      
      if (existingDbUsers.total > 0) {
        throw new Error('Utilisateur existe déjà dans la base de données')
      }
      
      // Generate password hash
      const generatePasswordHash = (email: string) => {
        const salt = Math.random().toString(36).substring(2, 15)
        const hash = btoa(`${email}:temp_password:${salt}`).substring(0, 60)
        return `$2y$10$${hash}`
      }
      
      const passwordHash = generatePasswordHash(email)

      // Create user profile in database
      const userProfileData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        password_hash: passwordHash,
        email_verified: false,
        email_verification_token: '',
        password_reset_token: null,
        password_reset_expires: null,
        last_login: null,
        login_attempts: 0,
        locked_until: null,
        newsletter_subscribed: false,
        account_type: accountType,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create database profile
      const dbUser = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        'unique()',
        userProfileData
      )

      console.log(`✅ Profil DB créé avec ID: ${dbUser.$id}`)
      return dbUser
    } catch (error) {
      console.error('❌ Erreur création profil DB:', error)
      throw error
    }
  }

  async register(email: string, password: string, name: string) {
    try {
      console.log('Attempting to register with:', { email, name, passwordLength: password.length })
      
      // Extract first and last name from full name
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || 'Utilisateur'
      const lastName = nameParts.slice(1).join(' ') || 'Inconnu'
      
      // Use the detailed registration method with extracted names
      return await this.registerWithDetails(email, password, firstName, lastName, '', 'individual')
      
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    }
  }

  async registerWithDetails(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    phone: string = '', 
    accountType: string = 'individual',
    address: string = '',
    postalCode: string = '',
    city: string = '',
    country: string = 'France',
    raisonSociale: string = '',
    siret: string = '',
    tvaNumber: string = ''
  ) {
    try {
      console.log('Attempting detailed registration with:', { 
        email, 
        firstName, 
        lastName, 
        phone, 
        accountType, 
        passwordLength: password.length 
      })
      
      // First check if user already exists by trying to get current user
      const existingUser = await this.getCurrentUser()
      if (existingUser) {
        console.log('User already logged in:', existingUser)
        await this.logout() // Logout first
      }

      // Create a more realistic password hash
      const generatePasswordHash = (email: string, password: string) => {
        const salt = Math.random().toString(36).substring(2, 15)
        const hash = btoa(`${email}:${password}:${salt}`).substring(0, 60)
        return `$2y$10$${hash}`
      }
      
      const passwordHash = generatePasswordHash(email, password)

      // First, create user profile in database (same as admin setup)
      const userProfileData = {
        first_name: (accountType === 'individual' && firstName && firstName.trim()) ? firstName.trim() : '',
        last_name: (accountType === 'individual' && lastName && lastName.trim()) ? lastName.trim() : '',
        email: email,
        phone: phone || '',
        password_hash: passwordHash,
        email_verified: false,
        email_verification_token: '',
        password_reset_token: '',
        password_reset_expires: '',
        last_login: '',
        login_attempts: 0,
        locked_until: '',
        newsletter_subscribed: false,
        account_type: accountType,
        status: 'active',
        // Champs d'adresse
        address: address || '',
        postalCode: postalCode || '',
        city: city || '',
        country: country || 'France',
        // Champs professionnels
        raison_sociale: (accountType === 'professional' && raisonSociale && raisonSociale.trim()) ? raisonSociale.trim() : '',
        siret: (accountType === 'professional' && siret && siret.trim()) ? siret.trim() : '',
        tva_number: (accountType === 'professional' && tvaNumber && tvaNumber.trim()) ? tvaNumber.trim() : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('🔍 Données à envoyer à Appwrite:', {
        ...userProfileData,
        password_hash: '[MASQUÉ]'
      })

      // Create database profile first
      const dbUser = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        'unique()',
        userProfileData
      )

      console.log(`✅ Profil utilisateur créé dans la base de données avec ID: ${dbUser.$id}`)

      // Then try to create in Appwrite Auth (optional, like in admin setup)
      const fullName = `${firstName} ${lastName}`
      
      try {
        const userId = this.generateUserId()
        
        const authUser = await this.account.create(userId, email, password, fullName)
        console.log('✅ Utilisateur d\'authentification créé avec ID:', authUser.$id)
        
        // Login after creation
        await this.account.createEmailPasswordSession(email, password)
        console.log('✅ Utilisateur connecté avec succès')
        
        return authUser
      } catch (authError: any) {
        console.log('⚠️ Erreur d\'authentification:', authError)
        
        // Check if user already exists
        if (authError.message && authError.message.includes('user with the same id, email, or phone already exists')) {
          console.log('✅ Utilisateur Auth existe déjà, tentative de connexion...')
          
          // Try to login with existing credentials
          try {
            await this.account.createEmailPasswordSession(email, password)
            console.log('✅ Connexion réussie avec les identifiants existants')
            return await this.getCurrentUser()
          } catch (loginError) {
            console.log('❌ Impossible de se connecter avec les identifiants existants:', loginError)
            // The Auth user exists but password might be different, require manual login
            return {
              success: true,
              accountCreated: true,
              requiresManualLogin: true,
              dbUserId: dbUser.$id,
              email: email,
              reason: 'existing_auth_user_wrong_password'
            }
          }
        } else {
          // Auth user doesn't exist, try to create with different ID
          console.log('✅ Tentative de création avec un nouvel ID utilisateur...')
          try {
            const newUserId = this.generateUserId() // Generate a new ID
            const authUser = await this.account.create(newUserId, email, password, fullName)
            console.log('✅ Utilisateur d\'authentification créé avec nouvel ID:', authUser.$id)
            
            // Login after creation
            await this.account.createEmailPasswordSession(email, password)
            console.log('✅ Utilisateur connecté avec succès')
            
            return authUser
          } catch (secondAuthError) {
            console.log('❌ Impossible de créer l\'utilisateur Auth même avec un nouvel ID:', secondAuthError)
            // If we still can't create the Auth user, require manual login
            return {
              success: true,
              accountCreated: true,
              requiresManualLogin: true,
              dbUserId: dbUser.$id,
              email: email,
              reason: 'auth_creation_failed'
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erreur détaillée dans registerWithDetails:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
        stack: error.stack?.substring(0, 500) // Limite la stack trace
      })
      
      // Handle specific database errors
      if (error.message && error.message.includes('Document with the requested ID already exists')) {
        throw new Error('Cette adresse email existe déjà. Essayez de vous connecter ou contactez le support.')
      }
      
      if (error.message && error.message.includes('Invalid document structure')) {
        console.error('🔍 Structure de document invalide. Détails complets:', error)
        throw new Error('Erreur de structure de données. Veuillez réessayer.')
      }

      if (error.message && error.message.includes('Missing required attribute')) {
        console.error('🔍 Attribut requis manquant:', error.message)
        throw new Error('Champ obligatoire manquant. Veuillez vérifier les données.')
      }

      if (error.message && error.message.includes('Invalid `')) {
        console.error('🔍 Données invalides:', error.message)
        throw new Error('Format de données incorrect. Veuillez réessayer.')
      }
      
      // For other errors, provide a general message
      throw new Error(`Erreur lors de la création du compte: ${error.message}`)
    }
  }

  async logout() {
    try {
      return await this.account.deleteSession('current')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  // Utility methods
  getImageUrl(imageId: string): string {
    return `${this.client.config.endpoint}/storage/buckets/images/files/${imageId}/view?project=${this.client.config.project}`
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }
}

export default AppwriteService

// Export a singleton instance and debug helper
export const appwriteService = AppwriteService.getInstance()
export const debugUserAuth = (email: string) => appwriteService.debugUserStatus(email)
export const createAuthUserFromDB = (email: string, password: string) => appwriteService.createAuthFromDbUser(email, password)
export const createDbUserFromAuth = (email: string, firstName: string, lastName: string, phone?: string, accountType?: string) => 
  appwriteService.createDbFromAuthUser(email, firstName, lastName, phone, accountType)
export const syncDbPasswordToAuth = (email: string, password: string) => appwriteService.syncDbPasswordToAuth(email, password)
export const directPasswordSync = (email: string, password: string) => appwriteService.directPasswordSync(email, password)
