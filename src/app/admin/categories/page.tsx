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
  status: string
  sort_order: number
  products_count?: number
  created_at: string
  updated_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
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
      const result = await appwrite.getCategories([
        appwrite.Query.orderAsc('sort_order')
      ])
      
      // Récupérer tous les produits pour compter par catégorie
      const allProductsResult = await appwrite.getProducts([
        appwrite.Query.limit(1000)
      ])
      
      // Compter les produits pour chaque catégorie
      const categoriesWithCount = result.documents.map((category: any) => {
        // Filtrer côté client pour trouver les produits de cette catégorie
        const categoryProducts = allProductsResult.documents.filter((product: any) => {
          return product.category_id === category.$id
        })
        
        console.log(`� RÉSULTAT - ${category.name}: ${categoryProducts.length} produits`)
        
        return {
          ...category,
          products_count: categoryProducts.length
        }
      })
      
      setCategories(categoriesWithCount as Category[])
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des catégories...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center p-12">
            <i className="fas fa-folder-open text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune catégorie trouvée</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre première catégorie</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Créer une catégorie
            </button>
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
                {categories.map((category) => (
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
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
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
