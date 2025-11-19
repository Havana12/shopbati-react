const { Client, Databases, ID } = require('node-appwrite');

// Configuration
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6884e133002e0c2145c7')
    .setKey('standard_6db10d78e210bc0769726854349c6ea34e570dc800b15e1d054dced1cb215520e9ec574b213d98f87eb913819985fa0ab34f94ae2d265e393564257379f709fe4820b9451980a339b5e6659219ffaaa865131429b488e5cc984ba427e649d1c6cad3bedbdd14ad800d85bbbe6c7e35bdd599bcd9a8f7a6e587c57888a152b408');

const databases = new Databases(client);

const DATABASE_ID = 'shopbati_db';
const COLLECTION_ID = 'orders';

// Attributs à créer
const attributes = [
  { key: 'order_number', type: 'string', size: 100, required: true },
  { key: 'customer_email', type: 'string', size: 255, required: true },
  { key: 'customer_name', type: 'string', size: 255, required: true },
  { key: 'customer_phone', type: 'string', size: 50, required: false },
  { key: 'customer_type', type: 'string', size: 50, required: false },
  { key: 'items', type: 'string', size: 10000, required: true }, // JSON array
  { key: 'subtotal', type: 'float', required: true },
  { key: 'shipping_cost', type: 'float', required: true },
  { key: 'total_amount', type: 'float', required: true },
  { key: 'shipping_address', type: 'string', size: 1000, required: true }, // JSON object
  { key: 'billing_address', type: 'string', size: 1000, required: false }, // JSON object
  { key: 'payment_method', type: 'string', size: 100, required: false },
  { key: 'special_instructions', type: 'string', size: 2000, required: false },
  { key: 'status', type: 'string', size: 50, required: true }, // en_attente, payé, expédié, livré
  { key: 'invoice_sent', type: 'boolean', required: true, default: false },
  { key: 'shipping_sent', type: 'boolean', required: true, default: false },
  { key: 'created_at', type: 'string', size: 100, required: true },
  { key: 'updated_at', type: 'string', size: 100, required: true }
];

async function createAttribute(attr) {
  try {
    console.log(`Creating attribute: ${attr.key}...`);
    
    if (attr.type === 'string') {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        attr.key,
        attr.size,
        attr.required,
        attr.default
      );
    } else if (attr.type === 'float') {
      await databases.createFloatAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        attr.key,
        attr.required,
        undefined,
        undefined,
        attr.default
      );
    } else if (attr.type === 'boolean') {
      await databases.createBooleanAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        attr.key,
        attr.required,
        attr.default
      );
    }
    
    console.log(`✅ Created: ${attr.key}`);
    
    // Wait 2 seconds between each attribute creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Attribute ${attr.key} already exists, skipping...`);
    } else {
      console.error(`❌ Error creating ${attr.key}:`, error.message);
    }
  }
}

async function createIndex() {
  try {
    console.log('\nCreating indexes...');
    
    // Index pour rechercher par email client
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'customer_email_idx',
      'key',
      ['customer_email'],
      ['ASC']
    );
    console.log('✅ Index customer_email_idx created');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Index pour rechercher par numéro de commande
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'order_number_idx',
      'key',
      ['order_number'],
      ['ASC']
    );
    console.log('✅ Index order_number_idx created');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Index pour trier par date
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'created_at_idx',
      'key',
      ['created_at'],
      ['DESC']
    );
    console.log('✅ Index created_at_idx created');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Indexes already exist, skipping...');
    } else {
      console.error('❌ Error creating indexes:', error.message);
    }
  }
}

async function setupCollection() {
  console.log('🚀 Setting up Orders collection...\n');
  
  // Create all attributes
  for (const attr of attributes) {
    await createAttribute(attr);
  }
  
  // Create indexes
  await createIndex();
  
  console.log('\n✅ Orders collection setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to Appwrite Console → Orders collection → Settings → Permissions');
  console.log('2. Add permission: Role "Any" with "Read" access');
  console.log('3. Test placing an order on your site');
}

setupCollection().catch(console.error);
