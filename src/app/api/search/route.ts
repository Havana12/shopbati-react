import { NextRequest, NextResponse } from 'next/server'
import { Client, Databases, Query } from 'node-appwrite'

// Cache the entire products list in memory for ultra-fast searches
let productsCache: {
  products: any[]
  timestamp: number
} | null = null

const PRODUCTS_CACHE_DURATION = 300000 // 5 minutes - products don't change often

// Setup Appwrite client once
const client = new Client()
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '')

const databases = new Databases(client)

// Function to fetch and cache products
async function getCachedProducts() {
  const now = Date.now()
  
  // Return cached products if still valid
  if (productsCache && now - productsCache.timestamp < PRODUCTS_CACHE_DURATION) {
    return productsCache.products
  }
  
  // Fetch fresh products
  console.log('Fetching fresh products for search cache...')
  const result = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    'products',
    [
      Query.equal('status', 'active'),
      Query.limit(5000)
    ]
  )
  
  // Store minimal data for fast searching
  const products = result.documents.map((p: any) => ({
    $id: p.$id,
    name: p.name || '',
    description: p.description || '',
    price: p.price,
    slug: p.slug,
    image_url: p.image_url,
    reference: p.reference || '',
    sku: p.sku || '',
    // Pre-lowercase for faster search
    _searchName: (p.name || '').toLowerCase(),
    _searchDesc: (p.description || '').toLowerCase(),
    _searchRef: (p.reference || '').toLowerCase(),
    _searchSku: (p.sku || '').toLowerCase()
  }))
  
  productsCache = {
    products,
    timestamp: now
  }
  
  console.log(`Cached ${products.length} products for search`)
  return products
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    // Get products from cache (very fast!)
    const products = await getCachedProducts()
    
    // Fast search through cached products
    const matches = products.filter((product: any) => {
      return product._searchName.includes(normalizedQuery) || 
             product._searchDesc.includes(normalizedQuery) ||
             product._searchRef.includes(normalizedQuery) ||
             product._searchSku.includes(normalizedQuery)
    })
    
    // Return only first 8 results without internal search fields
    const finalResults = matches.slice(0, 8).map((p: any) => ({
      $id: p.$id,
      name: p.name,
      description: p.description,
      price: p.price,
      slug: p.slug,
      image_url: p.image_url,
      reference: p.reference
    }))
    
    return NextResponse.json({ 
      results: finalResults,
      total: matches.length,
      cached: productsCache !== null
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ 
      results: [],
      error: error instanceof Error ? error.message : 'Search failed' 
    }, { status: 500 })
  }
}
