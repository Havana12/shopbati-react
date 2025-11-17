/**
 * Script to create the invoices bucket in Appwrite Storage
 * Run this once to set up the storage bucket for invoices
 * 
 * Usage: npx ts-node scripts/setup-invoice-bucket.ts
 */

import { Client, Storage, Permission, Role } from 'appwrite'

async function setupInvoiceBucket() {
  console.log('🚀 Configuration du bucket pour les factures...')
  
  const client = new Client()
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '') // API key is required for creating buckets
  
  const storage = new Storage(client)
  
  try {
    // Try to create the bucket
    const bucket = await storage.createBucket(
      'invoices', // Bucket ID
      'Invoices', // Bucket Name
      [
        Permission.read(Role.any()), // Anyone can read (for QR code access)
        Permission.create(Role.users()), // Only authenticated users can create
        Permission.update(Role.users()), // Only authenticated users can update
        Permission.delete(Role.users())  // Only authenticated users can delete
      ],
      false, // fileSecurity: false for bucket-level permissions
      true,  // enabled
      undefined, // maximumFileSize: default
      ['application/pdf'], // allowedFileExtensions: only PDF files
      undefined, // compression
      false, // encryption
      false  // antivirus
    )
    
    console.log('✅ Bucket créé avec succès!')
    console.log('   ID:', bucket.$id)
    console.log('   Nom:', bucket.name)
    console.log('   Permissions:', bucket.$permissions)
    
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      console.log('⚠️  Le bucket existe déjà')
      
      // Try to get bucket info
      try {
        const bucket = await storage.getBucket('invoices')
        console.log('ℹ️  Informations du bucket existant:')
        console.log('   ID:', bucket.$id)
        console.log('   Nom:', bucket.name)
        console.log('   Permissions:', bucket.$permissions)
      } catch (getError) {
        console.error('❌ Erreur lors de la récupération du bucket:', getError)
      }
    } else {
      console.error('❌ Erreur lors de la création du bucket:', error)
      throw error
    }
  }
  
  console.log('✅ Configuration terminée!')
}

// Run the setup
setupInvoiceBucket().catch(console.error)
