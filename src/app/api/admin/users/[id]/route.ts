import { NextRequest, NextResponse } from 'next/server'
import { AppwriteService } from '@/lib/appwrite'

// PUT - Update admin user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { username, email, password, role, status } = body
    const adminId = params.id

    // Validation
    if (!username || !email) {
      return NextResponse.json(
        { success: false, error: 'Username and email are required' },
        { status: 400 }
      )
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const appwrite = AppwriteService.getInstance()

    // Check if email is being changed and if it's already in use by another admin
    const existingAdmin = await appwrite.getAdminByEmail(email)
    if (existingAdmin && existingAdmin.$id !== adminId) {
      return NextResponse.json(
        { success: false, error: 'An admin with this email already exists' },
        { status: 400 }
      )
    }

    // Update admin user
    const updateData: any = { username, email, role, status }
    if (password) {
      updateData.password = password
    }

    const updatedAdmin = await appwrite.updateAdminUser(adminId, updateData)

    return NextResponse.json({
      success: true,
      data: updatedAdmin
    })
  } catch (error: any) {
    console.error('Error updating admin user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = params.id
    const appwrite = AppwriteService.getInstance()

    // Check if this is the last active admin
    const allAdmins = await appwrite.getAdminUsers()
    const activeAdmins = allAdmins.documents.filter((admin: any) => admin.status === 'active')
    
    // Get the admin being deleted
    const adminToDelete = allAdmins.documents.find((admin: any) => admin.$id === adminId)
    
    if (activeAdmins.length === 1 && adminToDelete?.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last active admin' },
        { status: 400 }
      )
    }

    // Delete admin user
    await appwrite.deleteAdminUser(adminId)

    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting admin user:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete admin user' },
      { status: 500 }
    )
  }
}
