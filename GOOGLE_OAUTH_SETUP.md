# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your AI Mall application.

## Prerequisites

1. A Google Cloud Console project
2. Supabase project with authentication enabled

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Configure the OAuth consent screen if you haven't already
   - Set Application type to "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://alverse.app/auth/callback`
   - Save and copy the Client ID and Client Secret

## Step 2: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list and click to configure
4. Enable Google authentication
5. Enter your Google Client ID and Client Secret
6. Add redirect URLs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://alverse.app/auth/callback`
7. Save the configuration

## Step 3: Environment Variables

Add the following environment variables to your Vercel project:

- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

You can add these via the Vercel CLI:

```bash
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

## Step 4: Test the Integration

1. Start your development server
2. Go to `/auth/login` or `/auth/signup`
3. Click "Continue with Google"
4. You should be redirected to Google for authentication
5. After authentication, you should be redirected back to your application

## Troubleshooting

### Common Issues:

1. **"Invalid OAuth access token"**: Check that your Google Client ID and Secret are correct
2. **"Redirect URI mismatch"**: Ensure the redirect URIs in Google Cloud Console match your Supabase configuration
3. **"Google+ API not enabled"**: Make sure the Google+ API is enabled in your Google Cloud project

### Debug Steps:

1. Check the browser console for errors
2. Check the Supabase logs in your dashboard
3. Verify environment variables are set correctly
4. Ensure the redirect URLs are properly configured

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor your authentication logs for suspicious activity</content>
<parameter name="filePath">c:\Users\cupca\Documents\ai-mall\GOOGLE_OAUTH_SETUP.md