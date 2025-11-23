import { NextRequest, NextResponse } from 'next/server'
import { Client, Databases, Query } from 'node-appwrite'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting customer stats recalculation...')
    
    const client = new Client()
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '')
    
    const databases = new Databases(client)
    
    // Get all users
    const usersResult = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'users',
      [Query.limit(1000)]
    )
    
    // Get all orders
    const ordersResult = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'orders',
      [Query.limit(5000)]
    )
    
    console.log(`📊 Found ${usersResult.documents.length} users and ${ordersResult.documents.length} orders`)
    
    let updatedCount = 0
    
    // Process each user
    for (const user of usersResult.documents) {
      const userEmail = (user as any).email
      
      // Find all orders for this user using customer_email field
      const userOrders = ordersResult.documents.filter((order: any) => 
        order.customer_email === userEmail
      )
      
      // Calculate stats - only count paid orders
      const paidOrders = userOrders.filter((order: any) => 
        order.status === 'payé' || order.payment_status === 'payé'
      )
      
      const totalOrders = paidOrders.length
      const totalSpent = paidOrders.reduce((sum: number, order: any) => {
        // Use total_amount from orders table
        const orderTotal = order.total_amount || order.total || 0
        return sum + orderTotal
      }, 0)
      
      // Find last order date
      let lastOrderDate = null
      if (paidOrders.length > 0) {
        const sortedOrders = paidOrders.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.$createdAt || 0).getTime()
          const dateB = new Date(b.created_at || b.$createdAt || 0).getTime()
          return dateB - dateA
        })
        lastOrderDate = sortedOrders[0].created_at || sortedOrders[0].$createdAt
      }
      
      // Only update if user has orders
      if (totalOrders > 0) {
        try {
          // Check if these attributes exist by trying to read them first
          const updateData: any = {
            updated_at: new Date().toISOString()
          }
          
          // Try to update with all fields
          try {
            await databases.updateDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              'users',
              user.$id,
              {
                total_orders: totalOrders,
                total_spent: totalSpent,
                last_order_date: lastOrderDate,
                updated_at: new Date().toISOString()
              }
            )
            console.log(`✅ Updated ${userEmail}: ${totalOrders} orders, €${totalSpent.toFixed(2)}`)
            updatedCount++
          } catch (attrError: any) {
            // If attributes don't exist, log it
            if (attrError.type === 'document_invalid_structure') {
              console.log(`⚠️ User ${userEmail} has ${totalOrders} orders (€${totalSpent.toFixed(2)}) but attributes missing in database`)
            } else {
              throw attrError
            }
          }
        } catch (error) {
          console.error(`❌ Error updating user ${userEmail}:`, error)
        }
      }
    }
    
    console.log(`✅ Recalculation complete! Updated ${updatedCount} users with orders.`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully recalculated stats for ${updatedCount} customers`,
      details: {
        totalUsers: usersResult.documents.length,
        totalOrders: ordersResult.documents.length,
        usersWithOrders: updatedCount
      }
    })
    
  } catch (error) {
    console.error('❌ Error recalculating customer stats:', error)
    return NextResponse.json({
      success: false,
      message: 'Error recalculating customer stats',
      error: String(error)
    }, { status: 500 })
  }
}
