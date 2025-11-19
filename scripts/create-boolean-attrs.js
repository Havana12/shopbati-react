const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6884e133002e0c2145c7')
    .setKey('standard_6db10d78e210bc0769726854349c6ea34e570dc800b15e1d054dced1cb215520e9ec574b213d98f87eb913819985fa0ab34f94ae2d265e393564257379f709fe4820b9451980a339b5e6659219ffaaa865131429b488e5cc984ba427e649d1c6cad3bedbdd14ad800d85bbbe6c7e35bdd599bcd9a8f7a6e587c57888a152b408');

const databases = new Databases(client);

async function createBooleanAttributes() {
  try {
    console.log('Creating invoice_sent attribute...');
    await databases.createBooleanAttribute(
      'shopbati_db',
      'orders',
      'invoice_sent',
      false  // Not required
    );
    console.log('✅ invoice_sent attribute created');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Creating shipping_sent attribute...');
    await databases.createBooleanAttribute(
      'shopbati_db',
      'orders',
      'shipping_sent',
      false  // Not required
    );
    console.log('✅ shipping_sent attribute created');
    
    console.log('\n✅ Done! Now you can place orders.');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Attributes already exist! Collection is ready.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createBooleanAttributes();
