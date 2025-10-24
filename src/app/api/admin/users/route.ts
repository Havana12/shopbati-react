import { NextRequest, NextResponse } from 'next/server'
import { AppwriteService } from '@/lib/appwrite'

// GET - List all admin users
export async function GET(request: NextRequest) {
  try {
    const appwrite = AppwriteService.getInstance()
    const result = await appwrite.getAdminUsers([
      appwrite.Query.orderDesc('created_at')
    ])
    
    return NextResponse.json({
      success: true,
      data: result.documents
    })
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin users' },
      { status: 500 }
    )
  }
}

// POST - Create new admin user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, role, status } = body

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const appwrite = AppwriteService.getInstance()

    // Check if email already exists
    const existingAdmin = await appwrite.getAdminByEmail(email)
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'An admin with this email already exists' },
        { status: 400 }
      )
    }

    // Create admin user
    const newAdmin = await appwrite.createAdminUser({
      username,
      email,
      password,
      role: role || 'admin',
      status: status || 'active'
    })

    return NextResponse.json({
      success: true,
      data: newAdmin
    })
  } catch (error: any) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
