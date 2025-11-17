# Factures avec QR Code - Documentation

## 📋 Vue d'ensemble

Cette fonctionnalité génère automatiquement des factures PDF avec un QR code intégré. Le QR code permet aux clients de scanner et accéder directement à leur facture en ligne stockée sur Appwrite Storage.

## 🎯 Fonctionnalités

- ✅ Génération automatique de facture PDF avec design SHOPBATI
- ✅ QR code intégré dans la facture (coin supérieur droit)
- ✅ Upload automatique vers Appwrite Storage
- ✅ URL publique accessible via QR code
- ✅ Email avec facture en pièce jointe + lien direct
- ✅ Stockage sécurisé dans bucket dédié "invoices"

## 🔧 Installation et Configuration

### 1. Prérequis

Les packages nécessaires sont déjà installés :
- `qrcode` - Génération de QR codes
- `@types/qrcode` - Types TypeScript pour QR code
- `jspdf` - Génération de PDF
- `appwrite` - SDK Appwrite pour le storage

### 2. Configuration du Bucket Appwrite

**IMPORTANT**: Vous devez créer le bucket "invoices" dans Appwrite Storage avant d'utiliser cette fonctionnalité.

#### Option A: Via Console Appwrite (Recommandé)

1. Connectez-vous à [cloud.appwrite.io](https://cloud.appwrite.io)
2. Ouvrez votre projet (ID: `6884e133002e0c2145c7`)
3. Allez dans **Storage** > **Create Bucket**
4. Configurez le bucket :
   - **Bucket ID**: `invoices`
   - **Bucket Name**: `Invoices`
   - **Permissions**: 
     - Read: `any()` (permettre la lecture publique pour les QR codes)
     - Create/Update/Delete: `users()` (seulement les utilisateurs authentifiés)
   - **File Security**: Disabled (utiliser les permissions au niveau bucket)
   - **Maximum File Size**: Laisser par défaut
   - **Allowed File Extensions**: `pdf`
   - **Compression**: Disabled
   - **Encryption**: Disabled
   - **Antivirus**: Disabled

#### Option B: Via Script (Nécessite API Key)

Si vous avez une API Key Appwrite:

```bash
# Ajouter votre API Key dans .env.local
APPWRITE_API_KEY=your_api_key_here

# Exécuter le script de setup
npx ts-node scripts/setup-invoice-bucket.ts
```

### 3. Variables d'environnement

Assurez-vous que ces variables sont configurées dans `.env.local` :

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6884e133002e0c2145c7
NEXT_PUBLIC_APPWRITE_DATABASE_ID=shopbati_db
RESEND_API_KEY=your_resend_api_key
```

## 📝 Utilisation

### API Route avec QR Code

Nouvelle route créée : `/api/orders/with-qr`

Cette route :
1. Sauvegarde la commande dans la base de données
2. Génère une facture PDF avec QR code
3. Upload la facture vers Appwrite Storage
4. Envoie l'email avec la facture en pièce jointe
5. Met à jour la commande avec l'URL de la facture

**Exemple d'utilisation :**

```typescript
const response = await fetch('/api/orders/with-qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'ORDER-123',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    timestamp: new Date().toISOString(),
    items: [
      {
        name: 'Ciment 25kg',
        quantity: 10,
        price: 5.99,
        reference: 'CIM001'
      }
    ],
    total: 59.90,
    shippingAddress: {
      street: '123 Rue Example',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    }
  })
})

const result = await response.json()
// result contient: { success, orderId, emailSent, invoiceUrl, fileId }
```

### Fonction Standalone

Vous pouvez aussi utiliser la fonction directement :

```typescript
import { generateInvoiceWithQRCode } from '@/lib/invoiceGenerator'

const invoice = await generateInvoiceWithQRCode(orderData)
// invoice contient: { pdfBuffer, invoiceUrl, fileId, qrCodeDataUrl }
```

### Route API Existante

L'ancienne route `/api/orders` continue de fonctionner sans QR code pour la compatibilité.

## 🎨 Design de la Facture

La facture inclut :

- **En-tête** : Bannière jaune SHOPBATI avec slogan
- **Logo** : Logo SHOPBATI (gauche) + QR code (droite)
- **QR Code** : 
  - Taille: 25x25mm
  - Position: Coin supérieur droit
  - Encadré jaune pour visibilité
  - Texte explicatif en dessous
- **Informations** : SHOPBATI et client côte à côte
- **Tableau** : Détails des produits avec références
- **Totaux** : HT, TVA 20%, TTC
- **Footer** : Informations légales et contact

## 🔒 Sécurité

- Les factures sont stockées avec permissions de lecture publique (nécessaire pour QR code)
- Seuls les utilisateurs authentifiés peuvent créer/modifier/supprimer
- Les IDs de fichiers sont générés par Appwrite (UUID)
- URLs difficiles à deviner sans le QR code ou l'email

## 📱 Expérience Client

1. Le client reçoit un email avec :
   - Facture PDF en pièce jointe
   - Lien direct vers la facture en ligne
   - Récapitulatif de la commande

2. Le client peut scanner le QR code sur la facture PDF pour :
   - Accéder instantanément à la facture en ligne
   - La télécharger à nouveau si besoin
   - La partager facilement

## 🐛 Dépannage

### Le bucket "invoices" n'existe pas

**Erreur** : `Bucket with the requested ID could not be found`

**Solution** : Créez le bucket via la console Appwrite (voir section Configuration)

### Permissions insuffisantes

**Erreur** : `The user is not authorized to perform the requested action`

**Solution** : Vérifiez les permissions du bucket (lecture publique activée)

### QR code ne fonctionne pas

**Problèmes possibles** :
1. Vérifiez que l'URL dans le QR code est valide
2. Testez l'URL directement dans un navigateur
3. Vérifiez que les permissions de lecture sont publiques

### Email non reçu

**Vérifications** :
1. Clé API Resend valide dans `.env.local`
2. Vérifiez les logs serveur pour erreurs
3. Consultez le dashboard Resend pour le statut d'envoi

## 🚀 Migration

Pour migrer l'ancienne route `/api/orders` vers la nouvelle avec QR code :

```typescript
// Avant (sans QR)
await fetch('/api/orders', { ... })

// Après (avec QR)
await fetch('/api/orders/with-qr', { ... })
```

## 📊 Base de données

Champs ajoutés au modèle Order :
- `invoice_url` : URL publique de la facture
- `invoice_file_id` : ID du fichier dans Appwrite Storage
- `invoice_sent_at` : Date d'envoi de la facture

## 🎯 Prochaines Étapes

Améliorations possibles :
- [ ] Personnalisation du QR code (couleurs, logo au centre)
- [ ] Statistiques de scan du QR code
- [ ] Page web dédiée pour afficher la facture
- [ ] Téléchargement direct depuis le QR code
- [ ] Signature numérique de la facture

## 📞 Support

Pour toute question ou problème :
- Email: contact@shopbati.fr
- Tél: +33 6 52 35 40 15
