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

  // Product methods
  async getProducts(queries: string[] = []) {
    try {
      return await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        queries
      )
    } catch (error) {
      console.error('Error fetching products:', error)
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

  async createCustomer(customerData: any) {
    try {
      return await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'users',
        'unique()',
        customerData
      )
    } catch (error) {
      console.error('Error creating user:', error)
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
      return await this.account.createSession(email, password)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async register(email: string, password: string, name: string) {
    try {
      const user = await this.account.create('unique()', email, password, name)
      await this.login(email, password)
      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
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
