# Custom Email Verification System - Migration Guide

## Overview
This branch implements a custom email verification system using Resend instead of Appwrite's default verification emails. All verification emails will now be sent from `contact@shopbati.fr`.

## Database Changes Required

Add the following attributes to your `users` collection in Appwrite Console:

1. **email_verification_token** (string, 128 characters, not required)
   - Stores the verification token sent to user's email

2. **email_verification_expires** (string/datetime, not required)
   - Stores when the verification token expires (24 hours from creation)

## How It Works

### Registration Flow:
1. User registers with email/password
2. Account is created in database with `email_verified: false`
3. Verification email is sent via Resend from `contact@shopbati.fr`
4. User receives branded email with verification link
5. User clicks link → redirected to `/verify-email?token=xxx&email=xxx`
6. Token is validated and `email_verified` is set to `true`
7. User can now login

### Login Flow:
1. User attempts login
2. System checks if `email_verified: true` in database
3. If not verified → error message asking to verify email
4. If verified → Appwrite Auth session is created
5. If Auth user doesn't exist but DB user is verified → Auth user is auto-created

### Email Verification:
- Tokens are valid for 24 hours
- Users can request new verification email via "Resend" button
- Verification link format: `https://shopbati.fr/verify-email?token=xxx&email=xxx`

## API Endpoints Created

1. **POST /api/auth/send-verification**
   - Generates token and sends verification email
   - Body: `{ email: string, userId: string }`

2. **POST /api/auth/verify-email**
   - Verifies token and marks email as verified
   - Body: `{ token: string, email: string }`

3. **POST /api/auth/resend-verification**
   - Resends verification email to user
   - Body: `{ email: string }`

## Files Modified

### Created:
- `src/app/api/auth/send-verification/route.ts` - Send verification email
- `src/app/api/auth/verify-email/route.ts` - Verify email token
- `src/app/api/auth/resend-verification/route.ts` - Resend verification

### Updated:
- `src/lib/emailService.ts` - Added verification email functions
- `src/contexts/AuthContext.tsx` - Updated registration and login flows
- `src/app/verify-email/page.tsx` - Updated to use custom verification

## Email Template

The verification email includes:
- Branded ShopBati header
- Clear call-to-action button
- Alternative plain text link
- 24-hour expiration notice
- Sender: `contact@shopbati.fr`

## Configuration Required

### 1. Resend Domain Setup
Ensure `shopbati.fr` domain is verified in Resend dashboard and `contact@shopbati.fr` is configured as a valid sender.

### 2. Environment Variables
Already configured in `.env.local`:
```env
RESEND_API_KEY=re_WBudf2UM_8w1aC3fs1LQizzc5534TekrE
NEXT_PUBLIC_BASE_URL=https://shopbati.fr
```

### 3. Appwrite Database
Add the two new attributes mentioned above to the `users` collection.

## Testing

### Test Registration:
1. Register new account at `/login`
2. Check email inbox for verification from `contact@shopbati.fr`
3. Click verification link
4. Verify redirect to login page
5. Login with verified account

### Test Resend:
1. Attempt login before verifying
2. See error message about unverified email
3. Request new verification email
4. Check inbox for new email

## Benefits

✅ Branded emails from your domain (`contact@shopbati.fr`)
✅ Full control over email templates and styling
✅ Custom verification flow
✅ No dependency on Appwrite's email service
✅ Better user experience with professional emails

## Rollback

If you need to rollback:
```bash
git checkout main
```

The old Appwrite verification system will be restored.
