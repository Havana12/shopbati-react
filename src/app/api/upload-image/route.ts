import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto', // Cloudflare R2 uses 'auto' region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!category || !subcategory) {
      return NextResponse.json({ error: 'Category and subcategory are required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const sanitizedCategory = category.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const sanitizedSubcategory = subcategory.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
    
    // Create the folder path: shopbati/products/category/subcategory/
    const folderPath = `shopbati/products/${sanitizedCategory}/${sanitizedSubcategory}/${fileName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: folderPath,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        category: category,
        subcategory: subcategory,
        uploadedAt: new Date().toISOString(),
      },
    })

    await s3Client.send(command)

    // Return the public URL
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${folderPath}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      folder: `shopbati/products/${sanitizedCategory}/${sanitizedSubcategory}`,
      size: file.size,
      type: file.type,
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Log environment variables to debug (remove in production)
    console.error('Environment check:', {
      hasEndpoint: !!process.env.CLOUDFLARE_R2_ENDPOINT,
      hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      hasBucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
      hasPublicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
    })
    
    return NextResponse.json({ 
      error: 'Failed to upload image. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}