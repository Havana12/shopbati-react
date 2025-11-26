'use client'

import { useState, useEffect } from 'react'
import { AppwriteService } from '@/lib/appwrite'

interface Category {
  $id: string
  name: string
  slug: string
}

interface DiscountByCategoryProps {
  onDiscountApplied: () => void
}

export default function DiscountByCategory({ onDiscountApplied }: DiscountByCategoryProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getCategories([
        appwrite.Query.orderAsc('name'),
        appwrite.Query.limit(200)
      ])
      // ALL categories (parents AND subcategories) for better granularity
      setCategories(result.documents as Category[])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const applyDiscount = async (percentage: number) => {
    if (!selectedCategory) {
      setMessage('❌ Veuillez sélectionner une catégorie')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const categoryName = categories.find(c => c.$id === selectedCategory)?.name || ''
    
    if (!confirm(`Appliquer -${percentage}% sur tous les produits de la catégorie "${categoryName}" ?`)) {
      return
    }

    setLoading(true)
    setMessage('')
    setProgress('Chargement des produits...')

    try {
      const appwrite = AppwriteService.getInstance()

      console.log('🔍 Searching products with category_id:', selectedCategory)

      // Get all subcategories of selected category
      const allCategories = await appwrite.getCategories([
        appwrite.Query.limit(500)
      ])
      
      const subcategoryIds = allCategories.documents
        .filter((cat: any) => cat.parent_id === selectedCategory)
        .map((cat: any) => cat.$id)
      
      console.log(`📂 Found ${subcategoryIds.length} subcategories for "${categoryName}"`)

      // Get ALL active products and filter by category AND its subcategories
      const allProducts = await appwrite.getProducts([
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.limit(5000)
      ])

      // Filter by category OR any of its subcategories
      const productList = allProducts.documents.filter((p: any) => 
        p.category_id === selectedCategory || subcategoryIds.includes(p.category_id)
      )

      console.log(`📦 Total active products: ${allProducts.documents.length}`)
      console.log(`📦 Products in "${categoryName}" + subcategories: ${productList.length}`)
      
      if (productList.length === 0) {
        setMessage(`❌ Aucun produit trouvé dans la catégorie "${categoryName}" ni ses sous-catégories`)
        setProgress('')
        setLoading(false)
        return
      }

      setProgress(`Mise à jour de ${productList.length} produits...`)

      let successCount = 0
      let failCount = 0

      // Update one by one with delay
      for (let i = 0; i < productList.length; i++) {
        const product = productList[i]
        
        try {
          const discountedPrice = Math.round(product.price * (1 - percentage / 100) * 100) / 100

          console.log(`Updating ${product.name}: discount=${percentage}%, price=${product.price} → ${discountedPrice}`)

          await appwrite.updateProduct(product.$id, {
            discount_percentage: percentage,
            discounted_price: discountedPrice
          })

          successCount++

          // Update progress every 10 products
          if ((i + 1) % 10 === 0 || i + 1 === productList.length) {
            const percent = Math.round(((i + 1) / productList.length) * 100)
            setProgress(`${i + 1}/${productList.length} produits (${percent}%)`)
          }

          // 300ms delay between updates
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error: any) {
          failCount++
          console.error(`Error updating product ${product.$id}:`, error)
          
          // If rate limited, wait 2 seconds
          if (error.code === 429) {
            setProgress(`⚠️ Attente 2 secondes... (${i + 1}/${productList.length})`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }

      setMessage(`✅ Réduction appliquée: ${successCount} succès, ${failCount} échecs`)
      setProgress('')
      setLoading(false)
      onDiscountApplied()
      setTimeout(() => setMessage(''), 5000)

    } catch (error: any) {
      console.error('Error:', error)
      setMessage(`❌ Erreur: ${error.message}`)
      setProgress('')
      setLoading(false)
    }
  }

  const removeDiscount = async () => {
    if (!selectedCategory) {
      setMessage('❌ Veuillez sélectionner une catégorie')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const categoryName = categories.find(c => c.$id === selectedCategory)?.name || ''
    
    if (!confirm(`Supprimer les réductions de la catégorie "${categoryName}" ?`)) {
      return
    }

    setLoading(true)
    setMessage('')
    setProgress('Chargement des produits...')

    try {
      const appwrite = AppwriteService.getInstance()

      // Get products with discounts in this category
      const products = await appwrite.getProducts([
        appwrite.Query.equal('category_id', selectedCategory),
        appwrite.Query.equal('status', 'active'),
        appwrite.Query.greaterThan('discount_percentage', 0),
        appwrite.Query.limit(5000)
      ])

      const productList = products.documents
      setProgress(`Suppression des réductions sur ${productList.length} produits...`)

      let successCount = 0
      let failCount = 0

      // Update one by one with delay
      for (let i = 0; i < productList.length; i++) {
        const product = productList[i]
        
        try {
          await appwrite.updateProduct(product.$id, {
            discount_percentage: 0,
            discounted_price: 0
          })

          successCount++

          // Update progress every 10 products
          if ((i + 1) % 10 === 0 || i + 1 === productList.length) {
            const percent = Math.round(((i + 1) / productList.length) * 100)
            setProgress(`${i + 1}/${productList.length} produits (${percent}%)`)
          }

          // 300ms delay between updates
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error: any) {
          failCount++
          console.error(`Error updating product ${product.$id}:`, error)
          
          // If rate limited, wait 2 seconds
          if (error.code === 429) {
            setProgress(`⚠️ Attente 2 secondes... (${i + 1}/${productList.length})`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }

      setMessage(`✅ Réductions supprimées: ${successCount} succès, ${failCount} échecs`)
      setProgress('')
      setLoading(false)
      onDiscountApplied()
      setTimeout(() => setMessage(''), 5000)

    } catch (error: any) {
      console.error('Error:', error)
      setMessage(`❌ Erreur: ${error.message}`)
      setProgress('')
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow-sm p-6 border border-orange-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fas fa-percentage mr-2 text-orange-500"></i>
          Réductions par Catégorie
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Appliquer une réduction sur tous les produits d'une catégorie (~1-2 minutes)
        </p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Category Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner une catégorie *
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={loading}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        >
          <option value="">-- Choisir une catégorie --</option>
          {categories.map((category) => (
            <option key={category.$id} value={category.$id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Discount Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => applyDiscount(10)}
          disabled={loading || !selectedCategory}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <i className="fas fa-tag mr-2"></i>
          -10%
        </button>

        <button
          onClick={() => applyDiscount(20)}
          disabled={loading || !selectedCategory}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <i className="fas fa-tag mr-2"></i>
          -20%
        </button>

        <button
          onClick={() => applyDiscount(30)}
          disabled={loading || !selectedCategory}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <i className="fas fa-tag mr-2"></i>
          -30%
        </button>

        <div className="flex-grow"></div>

        <button
          onClick={removeDiscount}
          disabled={loading || !selectedCategory}
          className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <i className="fas fa-times-circle mr-2"></i>
          Supprimer les réductions
        </button>
      </div>

      {loading && progress && (
        <div className="mt-4 flex items-center text-blue-600 font-medium">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          {progress}
        </div>
      )}
    </div>
  )
}
