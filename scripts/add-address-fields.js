const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Configuration Appwrite
const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Vous devez ajouter cette clé dans votre .env.local

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const collectionId = 'users'; // ID de votre collection users

async function addAddressFields() {
  try {
    console.log('🔧 Ajout des champs d\'adresse à la collection users...\n');

    // 1. Champ address
    console.log('➕ Ajout du champ "address"...');
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      'address',
      255,
      false, // not required
      '', // default value
      false // not array
    );
    console.log('✅ Champ "address" ajouté avec succès');

    // Attendre un peu entre les créations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Champ postalCode
    console.log('➕ Ajout du champ "postalCode"...');
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      'postalCode',
      20,
      false, // not required
      '', // default value
      false // not array
    );
    console.log('✅ Champ "postalCode" ajouté avec succès');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Champ city
    console.log('➕ Ajout du champ "city"...');
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      'city',
      100,
      false, // not required
      '', // default value
      false // not array
    );
    console.log('✅ Champ "city" ajouté avec succès');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Champ country
    console.log('➕ Ajout du champ "country"...');
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      'country',
      100,
      false, // not required
      'France', // default value
      false // not array
    );
    console.log('✅ Champ "country" ajouté avec succès');

    console.log('\n🎉 Tous les champs d\'adresse ont été ajoutés avec succès !');
    console.log('\nChamps ajoutés :');
    console.log('- address (String, 255 caractères)');
    console.log('- postalCode (String, 20 caractères)');
    console.log('- city (String, 100 caractères)');
    console.log('- country (String, 100 caractères, défaut: "France")');
    
    console.log('\n⚠️  Note: Il peut y avoir un délai de quelques minutes avant que les champs soient disponibles.');
    console.log('💡 Vous pouvez maintenant décommenter les lignes d\'adresse dans appwrite.ts');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des champs :', error);
    
    if (error.message && error.message.includes('Attribute already exists')) {
      console.log('ℹ️  Il semble que certains champs existent déjà. Vérifiez votre console Appwrite.');
    }
    
    if (error.message && error.message.includes('Invalid API key')) {
      console.log('⚠️  Erreur d\'authentification. Assurez-vous que :');
      console.log('1. APPWRITE_API_KEY est définie dans .env.local');
      console.log('2. La clé API a les permissions "databases.write"');
    }
    
    process.exit(1);
  }
}

// Vérification des variables d'environnement
function checkEnvironment() {
  const required = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID', 
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes :');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n💡 Ajoutez ces variables dans votre fichier .env.local');
    
    if (missing.includes('APPWRITE_API_KEY')) {
      console.log('\n🔑 Pour obtenir APPWRITE_API_KEY :');
      console.log('1. Allez dans votre console Appwrite');
      console.log('2. Projet → Settings → API Keys');
      console.log('3. Créez une nouvelle clé avec les permissions "databases.write"');
      console.log('4. Ajoutez APPWRITE_API_KEY=votre_clé dans .env.local');
    }
    
    process.exit(1);
  }
}

// Exécution du script
console.log('🚀 Script d\'ajout des champs d\'adresse');
console.log('=====================================\n');

checkEnvironment();
addAddressFields();
