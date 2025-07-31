# SHOPBATI React - E-commerce Platform

Une plateforme e-commerce moderne construite avec Next.js 14, React 18, TypeScript et Tailwind CSS pour la vente de matériaux et équipements de construction.

## 🚀 Fonctionnalités

### Pages Principales
- **Accueil** - Page d'accueil avec hero section, produits vedettes, catégories et derniers produits
- **Boutique** - Liste des produits avec filtrage, tri et pagination
- **Détail Produit** - Affichage détaillé des produits avec images, spécifications et produits similaires
- **Catégories** - Liste et navigation des catégories de produits
- **Panier** - Gestion du panier d'achats avec localStorage
- **Commande** - Processus de commande complet avec formulaires
- **Contact** - Page de contact avec formulaire et informations
- **À propos** - Présentation de l'entreprise

### Fonctionnalités Techniques
- 🛒 **Gestion du panier** - Ajout/suppression de produits, modification des quantités
- 🔍 **Recherche et filtres** - Recherche par nom, filtrage par catégorie et prix
- 📱 **Design responsive** - Interface adaptée mobile, tablette et desktop
- ⚡ **Performance** - Optimisations Next.js (SSR, Image optimization, etc.)
- 🎨 **UI moderne** - Design avec Tailwind CSS et icônes FontAwesome
- 💾 **Base de données** - Intégration Appwrite pour la gestion des données
- 🔐 **Authentification** - Système de connexion/inscription (préparé)

## 🛠️ Technologies Utilisées

- **Framework:** Next.js 14 (App Router)
- **Frontend:** React 18, TypeScript
- **Styling:** Tailwind CSS
- **Base de données:** Appwrite
- **Icônes:** FontAwesome 6
- **Déploiement:** Compatible Vercel/Netlify

## 📁 Structure du Projet

```
shopbati-react/
├── src/
│   ├── app/                    # Pages App Router
│   │   ├── about/              # Page À propos
│   │   ├── cart/               # Page Panier
│   │   ├── categories/         # Liste des catégories
│   │   ├── category/[slug]/    # Page catégorie dynamique
│   │   ├── checkout/           # Processus de commande
│   │   │   └── success/        # Page de confirmation
│   │   ├── contact/            # Page Contact
│   │   ├── product/[slug]/     # Page produit dynamique
│   │   ├── shop/               # Page Boutique
│   │   ├── globals.css         # Styles globaux
│   │   ├── layout.tsx          # Layout principal
│   │   └── page.tsx            # Page d'accueil
│   ├── components/             # Composants réutilisables
│   │   ├── Header.tsx          # En-tête avec navigation
│   │   └── Footer.tsx          # Pied de page
│   └── lib/                    # Utilitaires et services
│       └── appwrite.ts         # Configuration Appwrite
├── public/                     # Fichiers statiques
├── .env.local                  # Variables d'environnement
├── next.config.js              # Configuration Next.js
├── tailwind.config.js          # Configuration Tailwind
├── package.json                # Dépendances
└── README.md                   # Documentation
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation

1. **Cloner le projet**
   ```bash
   cd shopbati-react
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configuration des variables d'environnement**
   
   Créer le fichier `.env.local` :
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuration Appwrite

### Base de données requise

#### Collection `products`
```json
{
  "name": "string",
  "description": "string", 
  "price": "float",
  "image_url": "string",
  "slug": "string",
  "status": "string",
  "category_id": "string",
  "featured": "boolean",
  "created_at": "datetime"
}
```

#### Collection `categories`  
```json
{
  "name": "string",
  "description": "string",
  "image_url": "string", 
  "slug": "string",
  "status": "string",
  "sort_order": "integer"
}
```

### Permissions Appwrite
- Lecture publique pour les collections `products` et `categories`
- Permissions d'écriture selon vos besoins

## 🎨 Personnalisation

### Thème et couleurs
Modifiez `tailwind.config.js` pour personnaliser les couleurs :

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color'
      }
    }
  }
}
```

### Styles globaux
Personnalisez `src/app/globals.css` pour les styles spécifiques.

## 📱 Fonctionnalités Principales

### Gestion du Panier
- Ajout/suppression de produits
- Modification des quantités
- Persistance avec localStorage
- Calcul automatique des totaux

### Navigation et Filtres
- Filtrage par catégorie et prix
- Recherche textuelle
- Tri par prix, nom, date
- Pagination

### Interface Utilisateur
- Design responsive mobile-first
- Animations CSS fluides
- Icônes FontAwesome
- Messages de feedback utilisateur

## 🔧 Scripts Disponibles

```bash
npm run dev      # Démarrage développement
npm run build    # Build production
npm run start    # Démarrage production
npm run lint     # Vérification du code
```

## 📦 Déploiement

### Vercel (Recommandé)
1. Connecter votre repository GitHub
2. Configurer les variables d'environnement
3. Déployer automatiquement

### Autres plateformes
Le projet est compatible avec toutes les plateformes supportant Next.js.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Email: contact@shopbati.fr
- Issues GitHub: [Créer une issue](https://github.com/votre-repo/shopbati-react/issues)

## 🎯 Roadmap

### Fonctionnalités à venir
- [ ] Système d'authentification complet
- [ ] Gestion des commandes en base
- [ ] Paiement en ligne (Stripe/PayPal)
- [ ] Dashboard administrateur
- [ ] Système de reviews produits
- [ ] Wishlist utilisateur
- [ ] Multi-langue (i18n)
- [ ] PWA (Progressive Web App)

### Améliorations techniques
- [ ] Tests unitaires (Jest/Testing Library)
- [ ] Tests E2E (Playwright)
- [ ] SEO optimisé
- [ ] Analytics intégrés
- [ ] Monitoring erreurs
- [ ] Cache optimisé

---

**SHOPBATI React** - La plateforme du bâtiment nouvelle génération 🏗️
