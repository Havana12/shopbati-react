import { NextRequest, NextResponse } from 'next/server'

// DEPRECATED: This API is obsolete. Use direct Appwrite calls in checkout page.
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    message: 'Cette API est obsolète. Le checkout utilise maintenant directement Appwrite.' 
  }, { status: 410 })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    message: 'Cette API est obsolète.' 
  }, { status: 410 })
}