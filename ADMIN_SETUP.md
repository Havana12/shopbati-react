# Guide : Créer des utilisateurs admin dans Appwrite

## Étape 1 : Accéder à votre console Appwrite
1. Allez sur https://cloud.appwrite.io/
2. Connectez-vous à votre compte
3. Sélectionnez votre projet : `6884e133002e0c2145c7`

## Étape 2 : Aller à la collection admin_users
1. Dans le menu de gauche, cliquez sur **Databases**
2. Sélectionnez votre base de données : `shopbati_db`
3. Cliquez sur la collection `admin_users`

## Étape 3 : Créer les documents admin
Cliquez sur **Create Document** et ajoutez ces utilisateurs :

### Admin 1 (Super Admin)
```json
{
  "username": "admin",
  "email": "admin@shopbati.fr",
  "password": "$2b$12$uY7KCgYo1rBDKdFB9JJ9bOdufgO69hSUixdDckop78qIMbOuY1sSm",
  "role": "super_admin",
  "status": "active",
  "created_at": "2025-07-30T00:00:00.000Z",
  "last_login": null
}
```

### Admin 2 (Mohamed)
```json
{
  "username": "mohamed", 
  "email": "mohamed.jourani@gmail.com",
  "password": "$2b$12$uY7KCgYo1rBDKdFB9JJ9bOdufgO69hSUixdDckop78qIMbOuY1sSm",
  "role": "admin",
  "status": "active", 
  "created_at": "2025-07-30T00:00:00.000Z",
  "last_login": null
}
```

### Admin 3 (Manager)
```json
{
  "username": "manager",
  "email": "manager@shopbati.fr", 
  "password": "$2b$12$SExL7P4mKDJidl5/aFN32ubrCIEYPvoqYJrglezXPOjkypQZg1eg6",
  "role": "admin",
  "status": "active",
  "created_at": "2025-07-30T00:00:00.000Z", 
  "last_login": null
}
```

## Mots de passe correspondants
- `admin@shopbati.fr` → **admin123**
- `mohamed.jourani@gmail.com` → **admin123** 
- `manager@shopbati.fr` → **manager123**

## Étape 4 : Vérifier la structure de la collection
Assurez-vous que votre collection `admin_users` a ces champs :
- `username` (String)
- `email` (String) 
- `password` (String)
- `role` (String)
- `status` (String)
- `created_at` (String/DateTime)
- `last_login` (String/DateTime, nullable)

## Étape 5 : Tester la connexion
Une fois les admins créés, vous pouvez tester la connexion sur :
http://localhost:3000/admin-login

Utilisez les identifiants :
- Email: `admin@shopbati.fr`
- Mot de passe: `admin123`
