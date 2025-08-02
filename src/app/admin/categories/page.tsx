'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'

interface Category {
  $id: string
  name: string
  description: string
  slug: string
  image_url?: string
  parent_id?: string
  level?: number
  path?: string
  has_children?: boolean
  status: string
  sort_order: number
  products_count?: number
  children?: Category[]
  created_at: string
  updated_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [flatCategories, setFlatCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('sort_order')
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    filterCategories()
  }, [flatCategories, searchTerm, statusFilter, sortBy, viewMode])

  const filterCategories = () => {
    if (viewMode === 'tree') {
      // For tree view, apply filters recursively to hierarchical structure
      const filterRecursive = (cats: Category[]): Category[] => {
        return cats.map(category => {
          const children = category.children ? filterRecursive(category.children) : []
          
          // Check if category matches filters
          const matchesSearch = !searchTerm || 
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.slug.toLowerCase().includes(searchTerm.toLowerCase())
          
          const matchesStatus = statusFilter === 'all' || category.status === statusFilter
          
          // Include category if it matches filters OR has children that match
          const shouldInclude = (matchesSearch && matchesStatus) || children.length > 0
          
          return shouldInclude ? { ...category, children } : null
        }).filter(Boolean) as Category[]
      }
      
      setFilteredCategories(filterRecursive(categories))
    } else {
      // For list view, use flat categories
      let filtered = [...flatCategories]

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.slug.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(category => category.status === statusFilter)
      }

      // Sort
      switch (sortBy) {
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'products_count':
          filtered.sort((a, b) => (b.products_count || 0) - (a.products_count || 0))
          break
        case 'created_at':
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
        default:
          filtered.sort((a, b) => a.sort_order - b.sort_order)
      }
      
      setFilteredCategories(filtered)
    }
  }

  // Toggle category expansion in tree view
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Render category rows recursively for tree view
  const renderCategoryRows = (categories: Category[], level: number = 0): JSX.Element[] => {
    const rows: JSX.Element[] = []
    
    categories.forEach(category => {
      const hasChildren = category.children && category.children.length > 0
      const isExpanded = expandedCategories.has(category.$id)
      
      rows.push(
        <tr key={category.$id} className="hover:bg-gray-50">
          <td className="px-4 py-4 whitespace-nowrap">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fas fa-folder text-gray-400 text-lg"></i>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center">
                {hasChildren && (
                  <button
                    onClick={() => toggleCategory(category.$id)}
                    className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-xs`}></i>
                  </button>
                )}
                {level > 0 && (
                  <span className="mr-2 text-gray-300">
                    {'│ '.repeat(level - 1)}{'├─ '}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                {level > 0 && (
                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Niveau {level}
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded text-center">
              {category.slug}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-600 max-w-xs">
              {category.description || 'Aucune description'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              category.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {category.status === 'active' ? 'Actif' : 'Inactif'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="text-sm text-gray-600 font-medium">
              {category.sort_order}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="text-sm font-medium text-blue-600">
              {category.products_count || 0}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleEdit(category)}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Modifier"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => {
                  setFormData({
                    name: '',
                    description: '',
                    slug: '',
                    image_url: '',
                    parent_id: category.$id,
                    status: 'active',
                    sort_order: 0
                  })
                  setEditingCategory(null)
                  setShowCreateModal(true)
                }}
                className="text-green-600 hover:text-green-900 transition-colors"
                title="Ajouter une sous-catégorie"
              >
                <i className="fas fa-plus"></i>
              </button>
              <button
                onClick={() => handleDelete(category.$id)}
                className="text-red-600 hover:text-red-900 transition-colors"
                title="Supprimer"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      )
      
      // Add children rows if expanded
      if (hasChildren && isExpanded) {
        rows.push(...renderCategoryRows(category.children!, level + 1))
      }
    })
    
    return rows
  }
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    parent_id: '',
    status: 'active',
    sort_order: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // Get hierarchical categories
      const hierarchicalResult = await appwrite.getCategoriesHierarchy()
      setCategories(hierarchicalResult)
      
      // Get flat categories for filtering
      const flatResult = await appwrite.getCategories([
        appwrite.Query.orderAsc('level'),
        appwrite.Query.orderAsc('sort_order')
      ])
      
      // Get all products to count by category
      const allProductsResult = await appwrite.getProducts([
        appwrite.Query.limit(1000)
      ])
      
      // Count products for each category
      const categoriesWithCount = flatResult.documents.map((category: any) => {
        const categoryProducts = allProductsResult.documents.filter((product: any) => {
          return product.category_id === category.$id
        })
        
        return {
          ...category,
          products_count: categoryProducts.length
        }
      })
      
      setFlatCategories(categoriesWithCount as Category[])
      
      // Add product counts to hierarchical structure
      const addProductCounts = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          const withCount = categoriesWithCount.find(c => c.$id === cat.$id)
          return {
            ...cat,
            products_count: withCount?.products_count || 0,
            children: cat.children ? addProductCounts(cat.children) : []
          }
        })
      }
      
      setCategories(addProductCounts(hierarchicalResult))
      
      // Expand all categories that have children by default
      const categoriesToExpand = new Set<string>()
      const collectExpandableCategories = (cats: Category[]) => {
        cats.forEach(cat => {
          if (cat.children && cat.children.length > 0) {
            categoriesToExpand.add(cat.$id)
            collectExpandableCategories(cat.children)
          }
        })
      }
      collectExpandableCategories(addProductCounts(hierarchicalResult))
      setExpandedCategories(categoriesToExpand)
      
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const appwrite = AppwriteService.getInstance()
      
      // Generate slug from name if not provided
      const slug = formData.slug || formData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const categoryData = {
        name: formData.name,
        description: formData.description,
        slug: slug,
        image_url: formData.image_url || null,
        status: formData.status,
        sort_order: formData.sort_order,
        updated_at: new Date().toISOString()
      }

      if (editingCategory) {
        // Update existing category
        await appwrite.databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          editingCategory.$id,
          categoryData
        )
      } else {
        // Create new category
        await appwrite.databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          'unique()',
          {
            ...categoryData,
            created_at: new Date().toISOString()
          }
        )
      }

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        parent_id: '',
        status: 'active',
        sort_order: 0
      })
      setEditingCategory(null)
      setShowCreateModal(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erreur lors de la sauvegarde de la catégorie')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
      image_url: category.image_url || '',
      parent_id: category.parent_id || '',
      status: category.status,
      sort_order: category.sort_order
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return
    }

    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        categoryId
      )
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Erreur lors de la suppression de la catégorie')
    }
  }

  const toggleStatus = async (categoryId: string, currentStatus: string) => {
    try {
      const appwrite = AppwriteService.getInstance()
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        categoryId,
        { 
          status: newStatus,
          updated_at: new Date().toISOString()
        }
      )
      fetchCategories()
    } catch (error) {
      console.error('Error updating category status:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      slug: '',
      image_url: '',
      parent_id: '',
      status: 'active',
      sort_order: 0
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des catégories</h1>
          <p className="text-gray-600 mt-2">Organisez vos produits par catégories</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className="fas fa-list mr-2"></i>
              Liste
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className="fas fa-sitemap mr-2"></i>
              Hiérarchie
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Modern Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-filter mr-2 text-purple-500"></i>
            Filtres avancés
          </h3>
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setSortBy('sort_order')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
          >
            <i className="fas fa-times mr-1"></i>
            Effacer tout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search Input - Enhanced */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-search mr-1 text-gray-400"></i>
              Recherche
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, description, slug..."
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <i className="fas fa-times text-gray-400 hover:text-gray-600"></i>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-toggle-on mr-1 text-gray-400"></i>
              Statut
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="all">Tous</option>
                <option value="active">✅ Actif</option>
                <option value="inactive">❌ Inactif</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-sort mr-1 text-gray-400"></i>
              Trier par
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700 w-full"
              >
                <option value="sort_order">📋 Ordre d'affichage</option>
                <option value="name">🔤 Nom A-Z</option>
                <option value="products_count">📦 Nb. produits</option>
                <option value="created_at">📅 Date création</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i className="fas fa-chevron-down text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Recherche: "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="ml-2 text-purple-600 hover:text-purple-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Statut: {statusFilter === 'active' ? 'Actif' : 'Inactif'}
              <button onClick={() => setStatusFilter('all')} className="ml-2 text-green-600 hover:text-green-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
          {sortBy !== 'sort_order' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Tri: {sortBy === 'name' ? 'Nom' : sortBy === 'products_count' ? 'Nb. produits' : 'Date création'}
              <button onClick={() => setSortBy('sort_order')} className="ml-2 text-blue-600 hover:text-blue-800">
                <i className="fas fa-times"></i>
              </button>
            </span>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              <i className="fas fa-info-circle mr-1"></i>
              {loading ? 'Chargement...' : `${filteredCategories.length} catégorie(s) sur ${categories.length}`}
            </span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStatusFilter('active')}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded transition-colors"
              >
                Voir actives
              </button>
              <button
                onClick={() => setSortBy('products_count')}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors"
              >
                Plus de produits
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des catégories...</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center p-12">
            <i className="fas fa-folder-open text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {categories.length === 0 ? 'Aucune catégorie trouvée' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-500 mb-6">
              {categories.length === 0 
                ? 'Commencez par créer votre première catégorie'
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
            {categories.length === 0 ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Créer une catégorie
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setSortBy('sort_order')
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-times mr-2"></i>
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="w-24 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="w-20 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="w-24 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="w-32 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {viewMode === 'tree' 
                  ? renderCategoryRows(categories)
                  : filteredCategories.map((category) => (
                    <tr key={category.$id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-folder text-gray-400 text-lg"></i>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded text-center">
                          {category.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {category.description || 'Aucune description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900 font-medium">{category.sort_order}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900 font-bold bg-blue-50 px-2 py-1 rounded">
                          {category.products_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleEdit(category)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg text-sm transition-colors"
                            title="Modifier"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => toggleStatus(category.$id, category.status)}
                            className={`p-2 rounded-lg text-sm transition-colors ${
                              category.status === 'active' 
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                            title={category.status === 'active' ? 'Désactiver' : 'Activer'}
                          >
                            <i className={`fas ${category.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                          <button
                            onClick={() => handleDelete(category.$id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm transition-colors"
                            title="Supprimer"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Modifier la catégorie' : 
                 formData.parent_id ? 'Nouvelle sous-catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Carrelage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description de la catégorie..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Généré automatiquement"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour générer automatiquement
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie parent (optionnel)
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Catégorie principale</option>
                  {flatCategories
                    .filter(cat => cat.$id !== editingCategory?.$id) // Avoid circular references
                    .map(category => (
                      <option key={category.$id} value={category.$id}>
                        {category.level > 0 && '—'.repeat(category.level) + ' '}
                        {category.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.parent_id 
                    ? `Cette catégorie sera une sous-catégorie de "${flatCategories.find(c => c.$id === formData.parent_id)?.name}"`
                    : 'Sélectionnez une catégorie parent pour créer une sous-catégorie'
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {editingCategory ? 'Mettre à jour' : 'Créer'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
