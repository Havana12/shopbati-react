'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'

interface Product {
  $id: string
  name: string
  description: string
  price: number
  image_url?: string
  status: string
  category_id?: string
  brand?: string
  stock_quantity?: number
  technical_specs?: string
  reference?: string
  created_at: string
  updated_at: string
}

interface Category {
  $id: string
  name: string
  slug: string
  parent_id?: string
  level?: number
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [parentCategories, setParentCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const productsPerPage = 50

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [currentPage, statusFilter, categoryFilter, subcategoryFilter, debouncedSearchTerm])

  // Fetch subcategories when parent category changes
  useEffect(() => {
    if (categoryFilter !== 'all') {
      const filtered = categories.filter(cat => cat.parent_id === categoryFilter)
      setSubcategories(filtered)
      // Reset subcategory filter when parent changes
      if (subcategoryFilter !== 'all' && !filtered.find(cat => cat.$id === subcategoryFilter)) {
        setSubcategoryFilter('all')
      }
    } else {
      setSubcategories([])
      setSubcategoryFilter('all')
    }
  }, [categoryFilter, categories])

  const fetchCategories = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getCategories([
        appwrite.Query.orderAsc('name'),
        appwrite.Query.limit(200)
      ])
      const allCategories = result.documents as unknown as Category[]
      setCategories(allCategories)
      
      // Separate parent categories (no parent_id or null parent_id)
      const parents = allCategories.filter(cat => !cat.parent_id)
      setParentCategories(parents)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const queries = [
        appwrite.Query.orderDesc('$createdAt'),
        appwrite.Query.limit(productsPerPage),
        appwrite.Query.offset((currentPage - 1) * productsPerPage)
      ]

      if (statusFilter !== 'all') {
        queries.push(appwrite.Query.equal('status', statusFilter))
      }

      if (subcategoryFilter !== 'all') {
        // Filter by subcategory if selected
        queries.push(appwrite.Query.equal('category_id', subcategoryFilter))
      } else if (categoryFilter !== 'all') {
        // Filter by parent category (products with this parent_id OR this category_id)
        // Get all subcategories of this parent
        const subCats = categories.filter(cat => cat.parent_id === categoryFilter).map(cat => cat.$id)
        if (subCats.length > 0) {
          queries.push(appwrite.Query.or([
            appwrite.Query.equal('category_id', categoryFilter),
            appwrite.Query.equal('category_id', subCats)
          ]))
        } else {
          queries.push(appwrite.Query.equal('category_id', categoryFilter))
        }
      }

      if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
        // Use contains for better search functionality
        queries.push(appwrite.Query.or([
          appwrite.Query.contains('name', debouncedSearchTerm),
          appwrite.Query.contains('description', debouncedSearchTerm),
          appwrite.Query.contains('reference', debouncedSearchTerm),
          appwrite.Query.contains('brand', debouncedSearchTerm)
        ]))
      }

      const result = await appwrite.getProducts(queries)
      setProducts(result.documents as unknown as Product[])
      setTotalPages(Math.ceil(result.total / productsPerPage))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function to get category name from category_id
  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return 'Sans catégorie'
    const category = categories.find(cat => cat.$id === categoryId)
    return category ? category.name : 'Catégorie inconnue'
  }

  // Function to get parent category name
  const getParentCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return '-'
    const category = categories.find(cat => cat.$id === categoryId)
    if (!category) return '-'
    
    if (category.parent_id) {
      const parent = categories.find(cat => cat.$id === category.parent_id)
      return parent ? parent.name : '-'
    }
    return category.name
  }

  // Function to check if category is a subcategory
  const isSubcategory = (categoryId: string | undefined): boolean => {
    if (!categoryId) return false
    const category = categories.find(cat => cat.$id === categoryId)
    return category ? !!category.parent_id : false
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return
    }

    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId
      )
      fetchProducts() // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Erreur lors de la suppression du produit')
    }
  }

  const toggleStatus = async (productId: string, currentStatus: string) => {
    try {
      const appwrite = AppwriteService.getInstance()
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId,
        { status: newStatus }
      )
      fetchProducts() // Refresh the list
    } catch (error) {
      console.error('Error updating product status:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
          <p className="text-gray-600 mt-2">Gérez votre catalogue de produits SHOPBATI</p>
        </div>
        <Link
          href="/admin/products/new"
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          Nouveau produit
        </Link>
      </div>

      {/* Compact Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-gray-900 flex items-center">
            <i className="fas fa-filter mr-2 text-blue-500"></i>
            Filtres
          </h3>
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setCategoryFilter('all')
              setSubcategoryFilter('all')
              setCurrentPage(1)
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
          >
            <i className="fas fa-times mr-1"></i>
            Effacer
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Input - Compact */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 text-sm"></i>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="block w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className="fas fa-times text-gray-400 hover:text-gray-600 text-sm"></i>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter - Compact */}
          <div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm w-full"
              >
                <option value="all">Toutes catégories</option>
                {parentCategories.map((category) => (
                  <option key={category.$id} value={category.$id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
              </div>
            </div>
          </div>

          {/* Subcategory Filter - Compact */}
          <div>
            <div className="relative">
              <select
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                disabled={categoryFilter === 'all' || subcategories.length === 0}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">Toutes sous-catégories</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.$id} value={subcategory.$id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
              </div>
            </div>
          </div>

          {/* Status Filter - Compact */}
          <div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm w-full"
              >
                <option value="all">Tous statuts</option>
                <option value="active">✅ Actif</option>
                <option value="inactive">❌ Inactif</option>
                <option value="draft">📝 Brouillon</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Tags - Compact */}
        {(searchTerm || categoryFilter !== 'all' || subcategoryFilter !== 'all' || statusFilter !== 'all') && (
          <div className="mt-3 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {parentCategories.find(c => c.$id === categoryFilter)?.name}
                <button onClick={() => setCategoryFilter('all')} className="ml-1 text-purple-600 hover:text-purple-800">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </span>
            )}
            {subcategoryFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                {subcategories.find(c => c.$id === subcategoryFilter)?.name}
                <button onClick={() => setSubcategoryFilter('all')} className="ml-1 text-indigo-600 hover:text-indigo-800">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {statusFilter === 'active' ? 'Actif' : statusFilter === 'inactive' ? 'Inactif' : 'Brouillon'}
                <button onClick={() => setStatusFilter('all')} className="ml-1 text-green-600 hover:text-green-800">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Summary - Compact */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {loading ? 'Chargement...' : `${products.length} produit(s) affiché(s)`}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Chargement...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center p-8">
            <i className="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500 mb-4 text-sm">Commencez par ajouter votre premier produit</p>
            <Link
              href="/admin/products/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <i className="fas fa-plus mr-2"></i>
              Ajouter un produit
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sous-catégorie
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.$id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.image_url ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover border"
                                src={product.image_url}
                                alt={product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg'
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border">
                                <i className="fas fa-box text-gray-400"></i>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                              {product.description?.substring(0, 50)}
                              {product.description && product.description.length > 50 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                          {product.reference || (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {getParentCategoryName(product.category_id)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {isSubcategory(product.category_id) ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                            {getCategoryName(product.category_id)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-bold text-gray-900">
                          {product.price.toFixed(2)}€
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          (product.stock_quantity || 0) > 10 
                            ? 'bg-green-100 text-green-800'
                            : (product.stock_quantity || 0) > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.status === 'active' ? 'Actif' : 
                           product.status === 'inactive' ? 'Inactif' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Link
                            href={`/admin/products/${product.$id}/edit`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(product.$id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compact Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    {[...Array(Math.min(3, totalPages))].map((_, index) => {
                      const pageNum = Math.max(1, currentPage - 1) + index
                      if (pageNum > totalPages) return null
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            pageNum === currentPage
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
