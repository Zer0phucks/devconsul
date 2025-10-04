# OAuth Setup Guide for Supabase

## Supabase Auth Callback URL
Your Supabase project callback URL: `https://bkrbsjalxuxvtvaxyqrf.supabase.co/auth/v1/callback`

Use this URL when configuring OAuth providers (Google, GitHub).

## Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials

2. **Create OAuth 2.0 Client ID** (or edit existing):
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://bkrbsjalxuxvtvaxyqrf.supabase.co/auth/v1/callback
     ```
   - For local development, also add:
     ```
     http://localhost:54321/auth/v1/callback
     ```

3. **Copy credentials** to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

4. **Configure in Supabase Dashboard**:
   - Go to: https://bkrbsjalxuxvtvaxyqrf.supabase.co/project/_/auth/providers
   - Enable **Google** provider
   - Paste Client ID and Client Secret
   - Save

## GitHub OAuth Setup

1. **Go to GitHub Developer Settings**: https://github.com/settings/developers

2. **Create OAuth App** (or edit existing):
   - Application name: `DevConsul`
   - Homepage URL: `https://app.devconsul.com` (or `http://localhost:3000` for dev)
   - Authorization callback URL:
     ```
     https://bkrbsjalxuxvtvaxyqrf.supabase.co/auth/v1/callback
     ```
   - For local development, create separate OAuth app with:
     ```
     http://localhost:54321/auth/v1/callback
     ```

3. **Copy credentials** to `.env`:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

4. **Configure in Supabase Dashboard**:
   - Go to: https://bkrbsjalxuxvtvaxyqrf.supabase.co/project/_/auth/providers
   - Enable **GitHub** provider
   - Paste Client ID and Client Secret
   - Save

## Application Redirect Configuration

After successful OAuth, Supabase redirects to your app's callback handler:
- **Production**: `https://app.devconsul.com/auth/callback`
- **Development**: `http://localhost:3000/auth/callback`

This is already configured in:
- `components/auth/LoginForm.tsx` (line 49)
- `components/auth/SignupForm.tsx` (line 89)

## Environment Variables

Ensure these are set in `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bkrbsjalxuxvtvaxyqrf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application URL (used for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://app.devconsul.com
```

## Testing OAuth Flow

1. **Start dev server**: `npm run dev`
2. **Navigate to**: http://localhost:3000/login
3. **Click** "Google" or "GitHub" button
4. **Authorize** in provider's consent screen
5. **Redirects** to: `http://localhost:3000/auth/callback?next=/admin`
6. **Final redirect** to: `/admin` (dashboard)

## Troubleshooting

### Redirect URI Mismatch Error
- **Cause**: OAuth provider redirect URI doesn't match Supabase callback
- **Fix**: Update provider settings to use exact Supabase URL

### Invalid Client Error
- **Cause**: Client ID/Secret not configured in Supabase
- **Fix**: Add credentials in Supabase Auth providers settings

### CORS Error
- **Cause**: Site URL not configured in Supabase
- **Fix**: Add your domain to Supabase Auth > URL Configuration > Site URL

### Session Not Persisting
- **Cause**: Cookie settings or middleware issue
- **Fix**: Check middleware.ts and Supabase cookie configuration
