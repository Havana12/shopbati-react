const bcrypt = require('bcryptjs')

async function hashPassword(password) {
  const saltRounds = 12
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  return hashedPassword
}

async function generateHashes() {
  console.log('Generating password hashes for admin users...\n')
  
  // Mots de passe à hasher
  const passwords = [
    'admin123',
    'password',
    'manager123'
  ]

  for (const password of passwords) {
    const hash = await hashPassword(password)
    console.log(`Password: ${password}`)
    console.log(`Hash: ${hash}`)
    console.log('---')
  }
}

generateHashes().catch(console.error)
