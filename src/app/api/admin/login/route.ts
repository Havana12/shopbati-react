import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { AppwriteService } from '@/lib/appwrite'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Initialize Appwrite service
    const appwriteService = AppwriteService.getInstance()

    // Get admin user by email
    const adminUser = await appwriteService.getAdminByEmail(email)

    if (!adminUser) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Check if admin is active
    if (adminUser.status !== 'active') {
      return NextResponse.json(
        { message: 'Compte administrateur désactivé' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Update last login
    try {
      await appwriteService.updateAdminLastLogin(adminUser.$id)
    } catch (error) {
      console.warn('Could not update last login:', error)
      // Continue anyway, login should not fail because of this
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: adminUser.$id,
        email: adminUser.email,
        role: adminUser.role || 'admin',
        name: adminUser.username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Return user info (without password)
    const userInfo = {
      id: adminUser.$id,
      email: adminUser.email,
      name: adminUser.username,
      role: adminUser.role || 'admin'
    }

    return NextResponse.json({
      success: true,
      token,
      user: userInfo,
      message: 'Connexion réussie'
    })

  } catch (error) {
    console.error('Erreur login admin:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
