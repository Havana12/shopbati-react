// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' })

const { Client, Databases, ID } = require('node-appwrite')
const bcrypt = require('bcryptjs')

// Configuration Appwrite
const client = new Client()
const databases = new Databases(client)

// Vous devez configurer ces variables avec vos vraies valeurs Appwrite
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id'
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'your-database-id'
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'your-api-key' // Clé API serveur

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY) // Utilise la clé API pour les opérations serveur

async function createAdminUser(userData) {
  try {
    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    // Prépare les données de l'admin
    const adminData = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    }

    // Crée l'utilisateur admin dans Appwrite
    const result = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      'admin_users', // ID de votre collection
      ID.unique(),
      adminData
    )

    console.log(`✅ Admin créé: ${userData.email}`)
    console.log(`   ID: ${result.$id}`)
    console.log(`   Username: ${result.username}`)
    console.log(`   Role: ${result.role}`)
    console.log('')
    
    return result
  } catch (error) {
    console.error(`❌ Erreur création admin ${userData.email}:`, error.message)
    return null
  }
}

async function createDefaultAdmins() {
  console.log('🚀 Création des utilisateurs admin par défaut...\n')

  // Liste des admins à créer
  const adminsToCreate = [
    {
      username: 'admin',
      email: 'admin@shopbati.fr',
      password: 'admin123',
      role: 'super_admin'
    },
    {
      username: 'mohamed',
      email: 'mohamed.jourani@gmail.com', 
      password: 'admin123',
      role: 'admin'
    },
    {
      username: 'manager',
      email: 'manager@shopbati.fr',
      password: 'manager123',
      role: 'admin'
    }
  ]

  for (const adminData of adminsToCreate) {
    await createAdminUser(adminData)
  }

  console.log('✨ Création des admins terminée!')
}

// Vérifie si les variables d'environnement sont configurées
function checkEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID', 
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:')
    missing.forEach(varName => console.error(`   - ${varName}`))
    console.error('\nVeuillez configurer ces variables dans votre fichier .env.local')
    process.exit(1)
  }
}

// Lance le script
async function main() {
  try {
    checkEnvironment()
    await createDefaultAdmins()
  } catch (error) {
    console.error('❌ Erreur lors de la création des admins:', error)
    process.exit(1)
  }
}

main()
