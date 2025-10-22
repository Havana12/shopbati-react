'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'

interface Category {
  $id: string
  name: string
  slug: string
  subcategories?: string[]
}

interface Subcategory {
  id: string
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    status: 'draft',
    category_id: '',
    subcategory: '',
    brand: '',
    stock_quantity: '',
    technical_specs: '',
    reference: ''
  })

  // Generate unique reference function
  const generateUniqueReference = async (): Promise<string> => {
    const appwrite = AppwriteService.getInstance()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      // Generate random reference: 3-6 digits (100 to 999999)
      const minDigits = 3
      const maxDigits = 6
      const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits
      const min = Math.pow(10, digits - 1)
      const max = Math.pow(10, digits) - 1
      const reference = Math.floor(Math.random() * (max - min + 1)) + min

      try {
        // Check if reference already exists
        const existingProducts = await appwrite.getProducts([
          appwrite.Query.equal('reference', reference.toString())
        ])

        if (existingProducts.documents.length === 0) {
          return reference.toString()
        }
      } catch (error) {
        console.error('Error checking reference uniqueness:', error)
      }

      attempts++
    }

    // Fallback: use timestamp-based reference if all attempts fail
    return `REF${Date.now().toString().slice(-6)}`
  }

  // Predefined subcategories for common construction categories
  const categorySubcategories: { [key: string]: Subcategory[] } = {
    'macon': [
      { id: 'ciment', name: 'Ciment' },
      { id: 'beton', name: 'Béton' },
      { id: 'mortier', name: 'Mortier' },
      { id: 'briques', name: 'Briques' },
      { id: 'parpaings', name: 'Parpaings' },
      { id: 'enduits', name: 'Enduits' }
    ],
    'menuisier-serrurerie': [
      { id: 'visserie', name: 'Visserie' },
      { id: 'quincaillerie', name: 'Quincaillerie' },
      { id: 'serrures', name: 'Serrures' },
      { id: 'poignees', name: 'Poignées' },
      { id: 'ferrures', name: 'Ferrures' },
      { id: 'charnières', name: 'Charnières' }
    ],
    'peintre': [
      { id: 'peintures-murales', name: 'Peintures murales' },
      { id: 'peintures-bois', name: 'Peintures bois' },
      { id: 'vernis-lasures', name: 'Vernis et lasures' },
      { id: 'pinceaux-rouleaux', name: 'Pinceaux et rouleaux' },
      { id: 'enduits-preparation', name: 'Enduits de préparation' },
      { id: 'produits-nettoyage', name: 'Produits de nettoyage' }
    ],
    'carreleur': [
      { id: 'carrelage-sol', name: 'Carrelage sol' },
      { id: 'carrelage-mural', name: 'Carrelage mural' },
      { id: 'colles-joints', name: 'Colles et joints' },
      { id: 'profiles-finition', name: 'Profils de finition' },
      { id: 'outils-pose', name: 'Outils de pose' },
      { id: 'produits-entretien', name: 'Produits d\'entretien' }
    ],
    'plomberie': [
      { id: 'tuyauterie', name: 'Tuyauterie' },
      { id: 'raccords', name: 'Raccords' },
      { id: 'robinetterie', name: 'Robinetterie' },
      { id: 'evacuation', name: 'Évacuation' },
      { id: 'outillage-plomberie', name: 'Outillage plomberie' },
      { id: 'produits-etancheite', name: 'Produits d\'étanchéité' }
    ],
    'electricien': [
      { id: 'cables-fils', name: 'Câbles et fils' },
      { id: 'appareillage', name: 'Appareillage' },
      { id: 'tableaux-protection', name: 'Tableaux et protection' },
      { id: 'eclairage', name: 'Éclairage' },
      { id: 'gaines-conduits', name: 'Gaines et conduits' },
      { id: 'outillage-electrique', name: 'Outillage électrique' }
    ],
    'outillage-protection': [
      { id: 'outils-main', name: 'Outils à main' },
      { id: 'outils-electroportatifs', name: 'Outils électroportatifs' },
      { id: 'equipements-protection', name: 'Équipements de protection' },
      { id: 'echafaudages-echelles', name: 'Échafaudages et échelles' },
      { id: 'consommables', name: 'Consommables' },
      { id: 'stockage-transport', name: 'Stockage et transport' }
    ]
  }

  useEffect(() => {
    fetchCategories()
    // Generate initial reference
    generateUniqueReference().then(ref => {
      setFormData(prev => ({ ...prev, reference: ref }))
    })
  }, [])

  // Update subcategories when category changes
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.$id === formData.category_id)
    if (selectedCategory && categorySubcategories[selectedCategory.slug]) {
      setSubcategories(categorySubcategories[selectedCategory.slug])
      // Reset subcategory selection when category changes
      setFormData(prev => ({ ...prev, subcategory: '' }))
    } else {
      setSubcategories([])
      setFormData(prev => ({ ...prev, subcategory: '' }))
    }
  }, [formData.category_id, categories])

  const fetchCategories = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getCategories([
        appwrite.Query.orderAsc('name'),
        appwrite.Query.limit(100)
      ])
      setCategories(result.documents as unknown as Category[])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const appwrite = AppwriteService.getInstance()

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        status: formData.status,
        category_id: formData.category_id || null,
        subcategory: formData.subcategory || null,
        brand: formData.brand,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        technical_specs: formData.technical_specs || null,
        reference: formData.reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = await appwrite.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        'unique()',
        productData
      )

      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Erreur lors de la création du produit: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!formData.category_id || !formData.subcategory) {
      alert('Veuillez d\'abord sélectionner une catégorie et sous-catégorie')
      e.target.value = '' // Reset file input
      return
    }

    setSelectedFile(file)
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setImageUploading(true)
    
    try {
      const selectedCategory = categories.find(cat => cat.$id === formData.category_id)
      if (!selectedCategory) {
        throw new Error('Category not found')
      }

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('category', selectedCategory.slug)
      formDataUpload.append('subcategory', formData.subcategory)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadedImageUrl(result.url)
      setFormData(prev => ({ ...prev, image_url: result.url }))
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Erreur lors de l\'upload: ' + (error as Error).message)
      setSelectedFile(null)
    } finally {
      setImageUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau produit</h1>
          <p className="text-gray-600 mt-2">Ajoutez un nouveau produit à votre catalogue</p>
        </div>
        <Link
          href="/admin/products"
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Retour
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations principales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Carrelage effet bois..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Bosch, Makita..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Référence produit *
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const newRef = await generateUniqueReference()
                        setFormData(prev => ({ ...prev, reference: newRef }))
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <i className="fas fa-sync-alt mr-1"></i>
                      Régénérer
                    </button>
                  </div>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gray-50"
                    placeholder="Référence unique..."
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Référence unique générée automatiquement (3 à 6 chiffres)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description détaillée du produit..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image du produit *
                  </label>
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {imageUploading ? (
                            <div className="text-center">
                              <i className="fas fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i>
                              <p className="text-sm text-gray-500">Upload en cours...</p>
                            </div>
                          ) : selectedFile ? (
                            <div className="text-center">
                              <i className="fas fa-check-circle text-2xl text-green-500 mb-2"></i>
                              <p className="text-sm text-gray-700 font-medium">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">Image uploadée avec succès</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Cliquer pour uploader</span> ou glisser-déposer
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG, WebP (max 5MB)</p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={imageUploading || !formData.category_id || !formData.subcategory}
                        />
                      </label>
                    </div>
                    
                    {/* Requirements notice */}
                    {(!formData.category_id || !formData.subcategory) && (
                      <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <i className="fas fa-info-circle text-amber-500"></i>
                        <p className="text-sm text-amber-700">
                          Sélectionnez d'abord une catégorie et sous-catégorie pour uploader une image
                        </p>
                      </div>
                    )}

                    {/* Upload info */}
                    {uploadedImageUrl && (
                      <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <div className="flex-1">
                          <p className="text-sm text-green-700 font-medium">
                            Image uploadée dans: shopbati/products/{categories.find(c => c.$id === formData.category_id)?.slug}/{formData.subcategory}/
                          </p>
                          <p className="text-xs text-green-600 mt-1 break-all">
                            {uploadedImageUrl}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécifications techniques
                  </label>
                  <textarea
                    name="technical_specs"
                    value={formData.technical_specs}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dimensions, matériaux, caractéristiques techniques..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Paramètres</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Catégorie
                    </label>
                    <button
                      type="button"
                      onClick={fetchCategories}
                      disabled={categoriesLoading}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      <i className={`fas fa-sync-alt mr-1 ${categoriesLoading ? 'fa-spin' : ''}`}></i>
                      Actualiser
                    </button>
                  </div>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categoriesLoading ? (
                      <option disabled>Chargement des catégories...</option>
                    ) : categories.length === 0 ? (
                      <option disabled>Aucune catégorie disponible</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.$id} value={category.$id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Créez d'abord des catégories dans la section{' '}
                      <Link href="/admin/categories" className="underline">
                        Gestion des catégories
                      </Link>
                    </p>
                  )}
                </div>

                {/* Subcategory dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sous-catégorie
                  </label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    disabled={!formData.category_id || subcategories.length === 0}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.category_id 
                        ? "Sélectionnez d'abord une catégorie" 
                        : subcategories.length === 0 
                          ? "Aucune sous-catégorie disponible"
                          : "Sélectionner une sous-catégorie"
                      }
                    </option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {formData.category_id && subcategories.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      {subcategories.length} sous-catégories disponibles
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Création...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Créer le produit
                    </>
                  )}
                </button>

                <Link
                  href="/admin/products"
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center block"
                >
                  <i className="fas fa-times mr-2"></i>
                  Annuler
                </Link>
              </div>
            </div>

            {/* Preview */}
            {(uploadedImageUrl || formData.image_url) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu de l'image</h3>
                <img
                  src={uploadedImageUrl || formData.image_url}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="mt-3 text-sm text-gray-500">
                  <i className="fas fa-folder mr-1"></i>
                  Stocké dans Cloudflare R2
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
