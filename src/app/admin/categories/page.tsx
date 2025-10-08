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
  const [resetLoading, setResetLoading] = useState(false)

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
      setCategories(result.documents as unknown as Category[])
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

  const resetCategories = async () => {
    if (!confirm('⚠️ ATTENTION: Cette action va supprimer TOUTES les catégories existantes et créer les nouvelles catégories métiers. Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?')) {
      return
    }

    setResetLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      
      // 1. Delete all existing categories
      const existingCategories = await appwrite.getCategories()
      for (const category of existingCategories.documents) {
        await appwrite.databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          category.$id
        )
      }

      // 2. Create new categories from your list
      const newCategories = [
        {
          name: 'MAÇON',
          description: 'Matériaux et outils pour maçonnerie, béton, mortier',
          slug: 'macon',
          status: 'active',
          sort_order: 1
        },
        {
          name: 'MENUISIER SERRURERIE',
          description: 'Bois, quincaillerie, serrures et outils de menuiserie',
          slug: 'menuisier-serrurerie',
          status: 'active',
          sort_order: 2
        },
        {
          name: 'PEINTRE',
          description: 'Peintures, enduits, pinceaux et accessoires',
          slug: 'peintre',
          status: 'active',
          sort_order: 3
        },
        {
          name: 'CARRELEUR',
          description: 'Carrelage, faïence, colle et joints',
          slug: 'carreleur',
          status: 'active',
          sort_order: 4
        },
        {
          name: 'PLOMBERIE',
          description: 'Tuyaux, raccords, robinetterie et sanitaires',
          slug: 'plomberie',
          status: 'active',
          sort_order: 5
        },
        {
          name: 'CHAUFFAGE EAU CHAUDE',
          description: 'Chaudières, radiateurs, ballons d\'eau chaude',
          slug: 'chauffage-eau-chaude',
          status: 'active',
          sort_order: 6
        },
        {
          name: 'SANITAIRE',
          description: 'WC, lavabos, douches, baignoires',
          slug: 'sanitaire',
          status: 'active',
          sort_order: 7
        },
        {
          name: 'ÉLECTRICIEN',
          description: 'Câbles, prises, tableaux électriques, éclairage',
          slug: 'electricien',
          status: 'active',
          sort_order: 8
        },
        {
          name: 'OUTILLAGE & PROTECTION',
          description: 'Outils, machines, EPI et équipements de sécurité',
          slug: 'outillage-protection',
          status: 'active',
          sort_order: 9
        }
      ]

      for (const categoryData of newCategories) {
        await appwrite.databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'categories',
          'unique()',
          {
            ...categoryData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        )
      }

      alert('✅ Catégories réinitialisées avec succès ! ' + newCategories.length + ' nouvelles catégories créées.')
      fetchCategories()
    } catch (error) {
      console.error('Error resetting categories:', error)
      alert('❌ Erreur lors de la réinitialisation des catégories: ' + error)
    } finally {
      setResetLoading(false)
    }
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
            onClick={resetCategories}
            disabled={resetLoading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {resetLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Réinitialisation...
              </>
            ) : (
              <>
                <i className="fas fa-refresh mr-2"></i>
                Réinitialiser Catégories
              </>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Categories Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {categories.map((category) => (
              <div key={category.$id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {category.image_url && (
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Ordre: {category.sort_order}</span>
                    <span>{category.products_count || 0} produits</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Modifier
                    </button>
                    <button
                      onClick={() => toggleStatus(category.$id, category.status)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        category.status === 'active' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <i className={`fas ${category.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                    <button
                      onClick={() => handleDelete(category.$id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
