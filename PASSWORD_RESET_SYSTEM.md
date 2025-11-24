# Système de Réinitialisation de Mot de Passe

## 🎯 Fonctionnalités

✅ **Email de réinitialisation** envoyé depuis `contact@shopbati.fr` via Resend
✅ **Token sécurisé** valide pendant 1 heure
✅ **Validation robuste** du mot de passe (minimum 8 caractères)
✅ **Interface utilisateur** intuitive et responsive
✅ **Synchronisation** automatique entre base de données et Appwrite Auth

## 📋 Processus Complet

### 1. Demande de Réinitialisation
**Page:** `/forgot-password`
- L'utilisateur entre son email
- Un token de réinitialisation est généré (valide 1h)
- Email envoyé via Resend depuis `contact@shopbati.fr`
- Message de confirmation affiché (même si l'email n'existe pas, pour la sécurité)

### 2. Email Reçu
**Contenu:**
- Design professionnel avec logo et couleurs ShopBati
- Bouton CTA principal "Réinitialiser mon mot de passe"
- Lien alternatif en texte simple
- Avertissement d'expiration (1 heure)
- Instructions de sécurité

### 3. Réinitialisation
**Page:** `/reset-password?token=xxx&email=xxx`
- Vérification du token et de l'email
- Formulaire de nouveau mot de passe (avec confirmation)
- Validation: minimum 8 caractères
- Option pour afficher/masquer le mot de passe
- Mise à jour du hash dans la base de données
- Suppression du token après utilisation

### 4. Connexion
- L'utilisateur peut se connecter avec le nouveau mot de passe
- Le compte Appwrite Auth est synchronisé automatiquement au premier login

## 🗂️ Fichiers Créés

### API Routes
```
src/app/api/auth/forgot-password/route.ts   - Génère token et envoie email
src/app/api/auth/reset-password/route.ts    - Valide token et change mot de passe
```

### Pages
```
src/app/forgot-password/page.tsx            - Formulaire de demande
src/app/reset-password/page.tsx             - Formulaire de nouveau mot de passe
```

### Composants Modifiés
```
src/components/AuthModal.tsx                - Ajout lien "Mot de passe oublié"
```

## 🔧 Champs Base de Données Utilisés

Dans la collection `users`:
- `password_reset_token` (string) - Token de réinitialisation
- `password_reset_expires` (string) - Date d'expiration du token
- `password_hash` (string) - Hash du mot de passe
- `email` (string) - Email de l'utilisateur

## 🔐 Sécurité

✅ **Token unique** généré avec crypto.randomBytes(32)
✅ **Expiration courte** (1 heure) pour limiter les risques
✅ **Token à usage unique** supprimé après utilisation
✅ **Pas de révélation** si l'email existe ou non (protection contre l'énumération)
✅ **Validation côté serveur** du format et longueur du mot de passe
✅ **Hash sécurisé** du mot de passe dans la base de données

## 📧 Configuration Email

### Template Resend
- **Expéditeur:** contact@shopbati.fr
- **Sujet:** "Réinitialisation de votre mot de passe - ShopBati"
- **Design:** HTML responsive avec fallback texte
- **Lien:** `${NEXT_PUBLIC_BASE_URL}/reset-password?token=xxx&email=xxx`

### Variables d'Environnement
```env
RESEND_API_KEY=re_WBudf2UM_8w1aC3fs1LQizzc5534TekrE
NEXT_PUBLIC_BASE_URL=https://shopbati.fr
```

## 🧪 Test du Système

### Test Local
1. Démarrer le serveur: `npm run dev`
2. Aller sur `/login`
3. Cliquer sur "Mot de passe oublié ?"
4. Entrer un email existant
5. Vérifier l'email reçu
6. Cliquer sur le lien
7. Créer un nouveau mot de passe
8. Se connecter avec le nouveau mot de passe

### Test Production
1. Vérifier que `NEXT_PUBLIC_BASE_URL=https://shopbati.fr`
2. Déployer sur Vercel
3. Tester le flux complet sur www.shopbati.fr

## 🚀 Déploiement

Avant de déployer:
1. ✅ Vérifier que `shopbati.fr` est configuré dans Resend
2. ✅ Vérifier que `contact@shopbati.fr` est un expéditeur vérifié
3. ✅ S'assurer que `NEXT_PUBLIC_BASE_URL=https://shopbati.fr`
4. ✅ Vérifier les champs DB dans Appwrite Console

## 🔗 Navigation

- **Modal de connexion** → "Mot de passe oublié ?" → `/forgot-password`
- `/forgot-password` → Email → `/reset-password?token=xxx`
- `/reset-password` → Succès → `/login`

## 📱 Interface Utilisateur

### Page Mot de Passe Oublié
- Design épuré et professionnel
- Message informatif
- Champ email avec validation
- Bouton avec état de chargement
- Message de confirmation après envoi

### Page Réinitialisation
- Affichage de l'email concerné
- Deux champs (nouveau + confirmation)
- Option afficher/masquer mot de passe
- Validation en temps réel
- Messages d'erreur clairs
- Redirection automatique après succès

### Email
- Design responsive
- Bouton CTA visible
- Lien alternatif en texte
- Informations d'expiration
- Instructions de sécurité

## 🎨 Style

- Couleurs ShopBati (orange #f97316, rouge #dc2626)
- Icons Font Awesome
- Design cohérent avec le reste du site
- Responsive mobile-first
- Animations et transitions fluides

## ✅ Avantages

1. **Autonomie complète** - Plus de dépendance aux emails Appwrite
2. **Branding** - Tous les emails viennent de votre domaine
3. **Personnalisation** - Templates HTML entièrement personnalisables
4. **Sécurité** - Tokens courts, validation robuste
5. **UX** - Interface claire et professionnelle
6. **Fiabilité** - Service Resend avec haute délivrabilité

## 🔄 Synchronisation

Le mot de passe est mis à jour:
1. ✅ Dans la **base de données** (password_hash)
2. ✅ Dans **Appwrite Auth** au prochain login (automatique)

Pas besoin de gestion manuelle de la synchronisation!
