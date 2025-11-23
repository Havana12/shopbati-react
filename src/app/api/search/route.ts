import { NextRequest, NextResponse } from 'next/server'
import { Client, Databases, Query } from 'node-appwrite'

// In-memory cache for search results (optional, can be removed if not needed)
let searchCache: Map<string, { results: any[], timestamp: number }> = new Map()
const CACHE_DURATION = 60000 // 1 minute cache

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    // Check cache first
    const cached = searchCache.get(normalizedQuery)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ results: cached.results, cached: true })
    }

    // Setup Appwrite client with API key for server-side
    const client = new Client()
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '')
    
    const databases = new Databases(client)
    
    // Fetch ALL active products - but this is cached so it's fast after first call
    const result = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'products',
      [
        Query.equal('status', 'active'),
        Query.limit(5000) // Get all products
      ]
    )
    
    // Filter on server side
    const matches = result.documents.filter((product: any) => {
      const name = product.name?.toLowerCase() || ''
      const description = product.description?.toLowerCase() || ''
      const reference = product.reference?.toLowerCase() || ''
      const sku = product.sku?.toLowerCase() || ''
      
      return name.includes(normalizedQuery) || 
             description.includes(normalizedQuery) ||
             reference.includes(normalizedQuery) ||
             sku.includes(normalizedQuery)
    })
    
    // Return only first 8 results with minimal data
    const finalResults = matches.slice(0, 8).map((p: any) => ({
      $id: p.$id,
      name: p.name,
      description: p.description,
      price: p.price,
      slug: p.slug,
      image_url: p.image_url,
      reference: p.reference,
      status: p.status
    }))
    
    // Cache the results
    searchCache.set(normalizedQuery, {
      results: finalResults,
      timestamp: Date.now()
    })
    
    // Clean old cache entries (keep cache size manageable)
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value
      searchCache.delete(oldestKey)
    }
    
    return NextResponse.json({ 
      results: finalResults,
      cached: false
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ 
      results: [],
      error: error instanceof Error ? error.message : 'Search failed' 
    }, { status: 500 })
  }
}
