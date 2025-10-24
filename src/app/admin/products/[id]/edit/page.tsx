'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AppwriteService } from '@/lib/appwrite'

interface Category {
  $id: string
  name: string
  slug: string
  parent_id?: string
  level?: number
}

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

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
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
        // Check if reference already exists (excluding current product)
        const existingProducts = await appwrite.getProducts([
          appwrite.Query.equal('reference', reference.toString()),
          appwrite.Query.notEqual('$id', productId)
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

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const product = await appwrite.databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId
      ) as unknown as Product

      // Determine if product's category_id is a parent category or subcategory
      const productCategory = await appwrite.databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'categories',
        product.category_id || ''
      ).catch(() => null)

      let parentCategoryId = ''
      let subcategoryId = ''

      if (productCategory && (productCategory as any).parent_id) {
        // It's a subcategory
        parentCategoryId = (productCategory as any).parent_id
        subcategoryId = product.category_id || ''
      } else {
        // It's a parent category
        parentCategoryId = product.category_id || ''
      }

      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        image_url: product.image_url || '',
        status: product.status,
        category_id: parentCategoryId,
        subcategory: subcategoryId,
        brand: product.brand || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        technical_specs: product.technical_specs || '',
        reference: product.reference || ''
      })

      // If there's a parent category, fetch its subcategories
      if (parentCategoryId) {
        fetchSubcategories(parentCategoryId)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('Erreur lors du chargement du produit')
      router.push('/admin/products')
    } finally {
      setPageLoading(false)
    }
  }

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

  const fetchSubcategories = async (parentId: string) => {
    setSubcategoriesLoading(true)
    try {
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getSubcategories(parentId)
      setSubcategories(result.documents as unknown as Category[])
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setSubcategories([])
    } finally {
      setSubcategoriesLoading(false)
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
        category_id: formData.subcategory || formData.category_id || null, // Use subcategory if selected, otherwise use category
        brand: formData.brand,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        technical_specs: formData.technical_specs || null,
        reference: formData.reference || null,
        updated_at: new Date().toISOString()
      }

      await appwrite.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'products',
        productId,
        productData
      )

      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Erreur lors de la modification du produit: ' + (error as any).message)
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

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le produit</h1>
          <p className="text-gray-600 mt-2">Modifiez les informations du produit</p>
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
                    placeholder="Ex: Perceuse visseuse sans fil..."
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
                    Marque
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Bosch, Makita, DeWalt..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Référence produit
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gray-50"
                    placeholder="Référence unique..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Référence unique (3 à 6 chiffres) - Peut être modifiée manuellement
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
                    Spécifications techniques
                  </label>
                  <textarea
                    name="technical_specs"
                    value={formData.technical_specs}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Voltage: 18V, Couple: 60Nm, Batterie: Li-ion..."
                  />
                </div>
              </div>
            </div>

            {/* Image Management */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Image du produit</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload d'image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={imageUploading || !formData.category_id || !formData.subcategory}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {(!formData.category_id || !formData.subcategory) && (
                    <p className="text-xs text-amber-600 mt-1">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Sélectionnez d'abord une catégorie et sous-catégorie
                    </p>
                  )}
                  {imageUploading && (
                    <div className="mt-2 text-sm text-blue-600">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Upload en cours...
                    </div>
                  )}
                  {selectedFile && !imageUploading && (
                    <p className="text-xs text-green-600 mt-1">
                      <i className="fas fa-check-circle mr-1"></i>
                      {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OU</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sous-catégorie
                    </label>
                    {formData.category_id && (
                      <button
                        type="button"
                        onClick={() => fetchSubcategories(formData.category_id)}
                        disabled={subcategoriesLoading}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        <i className={`fas fa-sync-alt mr-1 ${subcategoriesLoading ? 'fa-spin' : ''}`}></i>
                        Actualiser
                      </button>
                    )}
                  </div>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    disabled={!formData.category_id || subcategoriesLoading}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionner une sous-catégorie (optionnel)</option>
                    {subcategoriesLoading ? (
                      <option disabled>Chargement des sous-catégories...</option>
                    ) : subcategories.length === 0 && formData.category_id ? (
                      <option disabled>Aucune sous-catégorie disponible</option>
                    ) : (
                      subcategories.map((subcategory) => (
                        <option key={subcategory.$id} value={subcategory.$id}>
                          {subcategory.name}
                        </option>
                      ))
                    )}
                  </select>
                  {!formData.category_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez d'abord une catégorie
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
                      Modification...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Modifier le produit
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
            {formData.image_url && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu de l'image</h3>
                <img
                  src={formData.image_url}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
