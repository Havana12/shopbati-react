import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'shopbati-admin-secret-key-2025-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Enlever "Bearer "

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      return NextResponse.json({
        success: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        }
      })
    } catch (jwtError) {
      return NextResponse.json(
        { message: 'Token invalide' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Erreur vérification token:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
