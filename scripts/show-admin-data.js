console.log('📋 Données à copier-coller dans Appwrite Console\n')
console.log('=' .repeat(60))

const admins = [
  {
    title: '👤 Admin Principal',
    data: {
      username: 'admin',
      email: 'admin@shopbati.fr',
      password: '$2b$12$uY7KCgYo1rBDKdFB9JJ9bOdufgO69hSUixdDckop78qIMbOuY1sSm',
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    },
    plainPassword: 'admin123'
  },
  {
    title: '👤 Mohamed Jourani',
    data: {
      username: 'mohamed',
      email: 'mohamed.jourani@gmail.com', 
      password: '$2b$12$uY7KCgYo1rBDKdFB9JJ9bOdufgO69hSUixdDckop78qIMbOuY1sSm',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    },
    plainPassword: 'admin123'
  },
  {
    title: '👤 Manager',
    data: {
      username: 'manager',
      email: 'manager@shopbati.fr',
      password: '$2b$12$SExL7P4mKDJidl5/aFN32ubrCIEYPvoqYJrglezXPOjkypQZg1eg6',
      role: 'admin', 
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    },
    plainPassword: 'manager123'
  }
]

admins.forEach((admin, index) => {
  console.log(`\n${admin.title}`)
  console.log('-'.repeat(40))
  console.log('🔑 Mot de passe:', admin.plainPassword)
  console.log('📄 JSON à copier dans Appwrite:')
  console.log(JSON.stringify(admin.data, null, 2))
})

console.log('\n' + '='.repeat(60))
console.log('📝 Instructions:')
console.log('1. Allez sur https://cloud.appwrite.io/')
console.log('2. Projet: 6884e133002e0c2145c7')
console.log('3. Database: shopbati_db')
console.log('4. Collection: admin_users')
console.log('5. Cliquez "Create Document" pour chaque admin')
console.log('6. Copiez-collez le JSON correspondant')
console.log('\n🎯 Test de connexion: http://localhost:3000/admin-login')
