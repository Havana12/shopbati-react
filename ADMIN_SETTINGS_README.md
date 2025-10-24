# Admin Settings - Gestion des Administrateurs

Cette page permet de gérer les comptes administrateurs de SHOPBATI.

## Fonctionnalités

### 1. Liste des Administrateurs
- Affiche tous les administrateurs avec leurs informations
- Colonnes: Nom, Email, Rôle, Statut, Dernière connexion
- Actions rapides: Modifier, Supprimer

### 2. Ajouter un Administrateur
- Bouton "Ajouter un administrateur" en haut de la page
- Formulaire modal avec les champs:
  - Nom complet (requis)
  - Email (requis, validé)
  - Mot de passe (requis, minimum 8 caractères)
  - Confirmation du mot de passe (requis)
  - Rôle: Admin ou Super Admin
  - Statut: Actif ou Inactif

### 3. Modifier un Administrateur
- Cliquer sur l'icône d'édition (crayon)
- Modifier les informations dans le formulaire modal
- Le mot de passe est optionnel lors de la modification
- Si laissé vide, le mot de passe actuel est conservé

### 4. Supprimer un Administrateur
- Cliquer sur l'icône de suppression (poubelle)
- Confirmation requise avant suppression
- Protection: Impossible de supprimer le dernier administrateur actif

## Sécurité

### Hashage des Mots de Passe
- Les mots de passe sont hashés avec bcryptjs avant stockage
- Utilise un salt de 10 rounds pour la sécurité
- Les mots de passe ne sont jamais stockés en clair

### Validation
- Email: Format valide requis
- Mot de passe: Minimum 8 caractères
- Confirmation: Les deux mots de passe doivent correspondre
- Email unique: Vérifie qu'aucun admin n'existe avec le même email

### Protection
- Au moins un administrateur actif doit toujours exister
- Impossible de supprimer le dernier admin actif

## Structure de la Base de Données

### Collection: `admin_users`

```json
{
  "$id": "unique_id",
  "name": "Jean Dupont",
  "email": "admin@shopbati.fr",
  "password": "hashed_password_bcrypt",
  "role": "admin|super_admin",
  "status": "active|inactive",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z",
  "last_login": "2025-01-01T00:00:00.000Z"
}
```

### Attributs Requis
- `name` (string): Nom complet de l'administrateur
- `email` (string): Email unique, utilisé pour la connexion
- `password` (string): Mot de passe hashé avec bcrypt
- `role` (string): "admin" ou "super_admin"
- `status` (string): "active" ou "inactive"
- `created_at` (datetime): Date de création
- `updated_at` (datetime, optionnel): Date de dernière modification
- `last_login` (datetime, optionnel): Date de dernière connexion

## API Routes

### GET /api/admin/users
Récupère la liste de tous les administrateurs

**Réponse:**
```json
{
  "success": true,
  "data": [...]
}
```

### POST /api/admin/users
Crée un nouvel administrateur

**Body:**
```json
{
  "name": "Jean Dupont",
  "email": "admin@shopbati.fr",
  "password": "motdepasse123",
  "role": "admin",
  "status": "active"
}
```

### PUT /api/admin/users/[id]
Met à jour un administrateur existant

**Body:**
```json
{
  "name": "Jean Dupont",
  "email": "admin@shopbati.fr",
  "password": "nouveaumotdepasse", // optionnel
  "role": "admin",
  "status": "active"
}
```

### DELETE /api/admin/users/[id]
Supprime un administrateur

**Réponse:**
```json
{
  "success": true,
  "message": "Admin user deleted successfully"
}
```

## Méthodes AppwriteService

### `getAdminUsers(queries?: string[])`
Récupère tous les administrateurs avec des filtres optionnels

### `getAdminByEmail(email: string)`
Trouve un administrateur par son email

### `createAdminUser(adminData)`
Crée un nouvel administrateur avec hashage du mot de passe

### `updateAdminUser(adminId, adminData)`
Met à jour un administrateur (hashe le mot de passe si fourni)

### `deleteAdminUser(adminId)`
Supprime un administrateur

### `updateAdminLastLogin(adminId)`
Met à jour la date de dernière connexion

## Utilisation

1. **Accéder à la page:**
   - Naviguer vers `/admin/settings`
   - Ou cliquer sur "Paramètres" dans le menu latéral

2. **Créer un administrateur:**
   ```
   1. Cliquer sur "Ajouter un administrateur"
   2. Remplir le formulaire
   3. Choisir le rôle et le statut
   4. Cliquer sur "Créer"
   ```

3. **Modifier un administrateur:**
   ```
   1. Cliquer sur l'icône d'édition
   2. Modifier les champs souhaités
   3. Le mot de passe est optionnel
   4. Cliquer sur "Mettre à jour"
   ```

4. **Supprimer un administrateur:**
   ```
   1. Cliquer sur l'icône de suppression
   2. Confirmer la suppression
   3. Note: Le dernier admin actif ne peut pas être supprimé
   ```

## Messages d'Erreur

- **"Le nom est requis"**: Le champ nom est vide
- **"L'email est requis"**: Le champ email est vide
- **"Email invalide"**: Format d'email incorrect
- **"Le mot de passe est requis"**: Mot de passe manquant (création)
- **"Le mot de passe doit contenir au moins 8 caractères"**: Mot de passe trop court
- **"Les mots de passe ne correspondent pas"**: Confirmation différente
- **"An admin with this email already exists"**: Email déjà utilisé
- **"Cannot delete the last active admin"**: Protection contre la suppression du dernier admin

## Styling

La page utilise:
- TailwindCSS pour le styling
- Font Awesome pour les icônes
- Design responsive adapté mobile/tablette/desktop
- Modal centré avec overlay
- Messages de succès/erreur temporaires (3 secondes)

## Dépendances

- `bcryptjs`: Hashage des mots de passe
- `@types/bcryptjs`: Types TypeScript pour bcryptjs
- `appwrite`: SDK Appwrite pour la base de données
- `next`: Framework Next.js 14+

## Notes Importantes

1. **Sécurité**: Toujours utiliser HTTPS en production
2. **Mots de passe**: Minimum 8 caractères recommandé (considérer 12+ pour la production)
3. **Rôles**: Implémenter des permissions différenciées entre admin et super_admin
4. **Audit**: Considérer l'ajout d'un système de logs pour les actions admin
5. **2FA**: Envisager l'ajout d'une authentification à deux facteurs

## Prochaines Améliorations

- [ ] Système de permissions granulaires
- [ ] Authentification à deux facteurs (2FA)
- [ ] Logs d'activité des administrateurs
- [ ] Export de la liste des admins en CSV
- [ ] Filtres et recherche dans la liste
- [ ] Pagination pour grandes quantités d'admins
- [ ] Email de notification lors de la création d'un compte
- [ ] Reset de mot de passe par email
