# Vercel Deployment Configuration

## Required Environment Variables

Add these environment variables to your Vercel project:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6884e133002e0c2145c7
NEXT_PUBLIC_APPWRITE_DATABASE_ID=shopbati_db
APPWRITE_API_KEY=standard_6db10d78e210bc0769726854349c6ea34e570dc800b15e1d054dced1cb215520e9ec574b213d98f87eb913819985fa0ab34f94ae2d265e393564257379f709fe4820b9451980a339b5e6659219ffaaa865131429b488e5cc984ba427e649d1c6cad3bedbdd14ad800d85bbbe6c7e35bdd599bcd9a8f7a6e587c57888a152b408

# Storage
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=images

# Collections
NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID=products
NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID=categories
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID=orders

# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://ee76adef18dd8afc5f8f01e72eebe1f1.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=e4de414faa31ec291d23d2589efee1e3
CLOUDFLARE_R2_SECRET_ACCESS_KEY=454f169571849cd08ff98c30b363415010eb738596ca1b7fa55c3b451afbf586
CLOUDFLARE_R2_BUCKET_NAME=shopbati
CLOUDFLARE_R2_PUBLIC_URL=https://storage.shopbati.fr
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://storage.shopbati.fr

# Authentication
JWT_SECRET=shopbati-admin-secret-key-2025-change-this-in-production

# Email (if using Resend)
RESEND_API_KEY=your_resend_api_key_here
```

## Important Notes

1. **APPWRITE_API_KEY** must be added - it's required for server-side invoice generation
2. Set all variables for **Production, Preview, and Development** environments
3. The API key should have `files.write` and `files.read` permissions
4. Redeploy after adding environment variables

## Build Configuration

Vercel should auto-detect Next.js settings, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 18.x or 20.x

## Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Invoice bucket created in Appwrite (ID: `691b2d0200137a0256b7`)
- [ ] API key has correct permissions
- [ ] Test invoice generation at `/test-invoice-qr`
- [ ] Test real checkout flow
- [ ] Verify QR codes in emails work

## Troubleshooting

### Error: "setKey is not a function"
- Make sure `node-appwrite` is installed (already in package.json)
- Verify environment variables are set in Vercel
- Check that `APPWRITE_API_KEY` is available

### Error: "Storage bucket not found"
- Create the bucket in Appwrite Console
- Bucket ID must be: `691b2d0200137a0256b7`
- Set public read permissions

### PDF Generation Fails
- Check that API key has `files.write` scope
- Verify Appwrite endpoint is accessible from Vercel
- Check server logs in Vercel dashboard
