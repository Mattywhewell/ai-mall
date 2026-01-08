# Email Verification Setup Guide

## ✅ What Was Fixed

1. **Created Auth Callback Route** - `/app/auth/callback/route.ts`
   - Handles email verification redirects from Supabase
   - Exchanges verification code for session
   - Redirects to profile after successful verification

2. **Updated Signup Flow**
   - Changed redirect URL from `/auth/verify-email` to `/auth/callback`
   - Added clear "Check Your Email" message after signup
   - Shows user's email address for confirmation

3. **Improved User Experience**
   - Users see a clear success message after signup
   - Email verification link now properly logs them in
   - Automatic redirect to profile after verification

## 🔧 Required Supabase Configuration

### Configure Redirect URLs in Supabase Dashboard:

1. Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```

3. Set **Site URL** to:
   ```
   http://localhost:3000
   ```

4. Enable **Email Confirmations**:
   - Go to **Authentication** → **Providers** → **Email**
   - Check "Enable email confirmations"
   - Or uncheck it if you want users to log in immediately

## 🧪 How to Test

1. **Sign Up**:
   ```
   http://localhost:3000/auth/signup
   ```
   - Fill in the form
   - Click "Sign Up"
   - See "Check Your Email" message

2. **Check Email**:
   - Open your email inbox
   - Find the verification email from Supabase
   - Click "Verify Email" link

3. **Automatic Login**:
   - You'll be redirected to `/auth/callback`
   - Session is created automatically
   - Redirected to `/profile`
   - You're now logged in!

## 📧 Email Flow Diagram

```
User Signs Up
     ↓
Check Email Message
     ↓
User Clicks Email Link
     ↓
/auth/callback (exchanges code)
     ↓
Session Created
     ↓
Redirect to /profile
     ↓
User Logged In ✅
```

## 🚨 If Still Having Issues

### Issue: "Invalid redirect URL"
**Solution**: Add the callback URL to Supabase redirect URLs (see step 2 above)

### Issue: "Email not verified"
**Solution**: 
1. Check Supabase → Authentication → Users
2. Verify the user's `email_confirmed_at` field is set
3. If not, click the user and manually confirm email

### Issue: Stuck on verify-email page
**Solution**: 
1. Make sure `.env.local` has correct Supabase keys
2. Restart the dev server: `npm run dev`
3. Clear browser cache and try again

## 🔐 Admin Account Setup

After you've verified your email and logged in:

```bash
npm run create-admin
```

This will grant your account admin privileges.

## 📝 Notes

- The callback route uses PKCE flow for security
- Session is stored in cookies automatically
- User stays logged in across page refreshes
- Email verification is required before login (configurable in Supabase)
