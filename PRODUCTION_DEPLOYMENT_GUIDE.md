# Production Deployment Configuration Guide

## Overview
This guide covers the refactoring of the Resume Screener project for production-ready deployment with proper environment variable configuration, CORS setup, and OAuth integration.

---

## ✅ Changes Made

### 1. Frontend Environment Variables

#### Files Updated:
- **Login.jsx** - Updated OAuth and authentication URLs
- **Upload.jsx** - Updated resume analysis API endpoint
- **.env** - Created for local development
- **.env.production** - Created for production deployment
- **.env.example** - Created for reference

#### Key Changes:
```javascript
// Before
window.location.href = 'http://localhost:5000/auth/google'

// After
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
window.location.href = `${BACKEND_URL}/auth/google`
```

**Benefits:**
- ✅ Single source of truth for backend URL
- ✅ Easy environment-specific configuration
- ✅ No hardcoded URLs to change during deployment
- ✅ Automatic fallback to localhost for development

### 2. Backend Configuration

#### Files Updated:
- **server.js** - Enhanced CORS configuration with environment variables
- **.env** - Already configured (verified)
- **.env.example** - Updated with comprehensive documentation
- **.env.production** - Created as deployment template

#### Key Changes in server.js:
```javascript
// Before
app.use(cors());

// After
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));
```

**Benefits:**
- ✅ Restricted CORS to specified frontend domain
- ✅ Prevents unauthorized cross-origin requests
- ✅ Production-grade security configuration
- ✅ Credentials properly configured for OAuth flows

### 3. OAuth Routes (auth.js)
✅ **Already configured correctly** - using `process.env.FRONTEND_URL` for redirects

### 4. Token Handling (AuthCallback.jsx)
✅ **Already implemented correctly:**
- Reads token from URL query parameters
- Stores token in localStorage
- Redirects to "/upload" on successful authentication
- Redirects to "/login" if token is missing

---

## 📁 Environment Files Structure

### Frontend (.env files)

**`.env` (Development)**
```env
VITE_BACKEND_URL=http://localhost:5000
```

**`.env.production` (Production)**
```env
VITE_BACKEND_URL=https://your-production-backend-url.com
```

**`.env.example` (Reference)**
```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000
```

### Backend (.env files)

**`.env` (Development - Already Configured)**
```env
MONGODB_URI=mongodb+srv://[user]:[password]@[cluster].[domain]/[db]
PYTHON_URL=http://python:8000
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
JWT_SECRET=mySuperSecret123
SESSION_SECRET=mySessionSecret456
GITHUB_CLIENT_ID=[your-github-client-id]
GITHUB_CLIENT_SECRET=[your-github-client-secret]
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
ADZUNA_APP_ID=[your-adzuna-app-id]
ADZUNA_API_KEY=[your-adzuna-api-key]
```

**`.env.production` (Production Template)**
```env
# Replace all placeholder values with your actual credentials
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
JWT_SECRET=[GENERATE-SECURE-RANDOM-STRING]
SESSION_SECRET=[GENERATE-SECURE-RANDOM-STRING]
GOOGLE_CLIENT_ID=[from-google-cloud-console]
GOOGLE_CLIENT_SECRET=[from-google-cloud-console]
GITHUB_CLIENT_ID=[from-github-settings]
GITHUB_CLIENT_SECRET=[from-github-settings]
```

---

## 🚀 Deployment Steps

### Local Development (No Changes Needed)
1. Frontend automatically uses `VITE_BACKEND_URL=http://localhost:5000`
2. Backend uses `FRONTEND_URL=http://localhost:5173`
3. Run both servers and test OAuth flow

### Production Deployment

#### Step 1: Update Environment Variables

**Frontend:** Set during build or runtime
```bash
# Build with production variables
VITE_BACKEND_URL=https://api.yourdomain.com npm run build

# Or update .env.production before building
```

**Backend:** Set environment variables
```bash
export FRONTEND_URL=https://yourdomain.com
export MONGODB_URI=mongodb+srv://[credentials]@[cluster]/[db]
export JWT_SECRET=[secure-random-string]
export SESSION_SECRET=[secure-random-string]
export GOOGLE_CLIENT_ID=[google-oauth-id]
export GOOGLE_CLIENT_SECRET=[google-oauth-secret]
export GITHUB_CLIENT_ID=[github-oauth-id]
export GITHUB_CLIENT_SECRET=[github-oauth-secret]
```

#### Step 2: Update OAuth Callback URLs

**Google Cloud Console:**
- Add: `https://api.yourdomain.com/auth/google/callback`
- Authorized JavaScript origins: `https://yourdomain.com`

**GitHub Developer Settings:**
- Authorization callback URL: `https://api.yourdomain.com/auth/github/callback`
- Homepage URL: `https://yourdomain.com`

#### Step 3: Deploy
```bash
# Frontend (Vercel, Netlify, etc.)
npm run build
# Upload dist/ folder

# Backend (Heroku, Railway, etc.)
# Push code with production .env variables configured
```

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a secure random string (min 32 characters)
- [ ] Change SESSION_SECRET to a secure random string (min 32 characters)
- [ ] Update FRONTEND_URL to your production domain
- [ ] Update BACKEND_URL to your production domain
- [ ] Update MONGODB_URI to production database
- [ ] Set up HTTPS on both frontend and backend
- [ ] Update Google OAuth with production callback URLs
- [ ] Update GitHub OAuth with production callback URLs
- [ ] Review CORS configuration (currently restricted to FRONTEND_URL only)
- [ ] Set secure: true in session cookie when using HTTPS (configured)
- [ ] Use environment-specific secrets management (AWS Secrets Manager, GitHub Secrets, etc.)
- [ ] Never commit .env files (check .gitignore)
- [ ] Regenerate all API keys and secrets in production

---

## 📝 Updated Code Files

### 1. Login.jsx
✅ Updated to use environment variables for:
- Email/Password authentication endpoint
- Google OAuth login URL
- GitHub OAuth login URL

### 2. Upload.jsx
✅ Updated to use environment variable for:
- Resume analysis API endpoint

### 3. server.js
✅ Updated with:
- Dynamic PORT from environment
- CORS configuration with FRONTEND_URL
- Credentials enabled for OAuth flows

### 4. AuthCallback.jsx
✅ Already correctly handles:
- Token extraction from URL params
- localStorage storage
- Conditional redirects

---

## 🧪 Testing Production Setup Locally

Before deploying, test with production URLs:

```bash
# Terminal 1: Backend
FRONTEND_URL=http://localhost:5173 node server.js

# Terminal 2: Frontend
VITE_BACKEND_URL=http://localhost:5000 npm run dev

# Test OAuth flow:
# 1. Go to http://localhost:5173/login
# 2. Click "Continue with Google" or "Continue with GitHub"
# 3. Verify token is received and stored
# 4. Verify redirect to /upload works
```

---

## 🐳 Docker Deployment

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_BACKEND_URL=http://localhost:5000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## 🔗 OAuth Flow Diagram

```
User → Login.jsx → ${VITE_BACKEND_URL}/auth/google
                          ↓
                   Google OAuth Server
                          ↓
                   /auth/google/callback
                          ↓
              Backend verifies & creates JWT
                          ↓
       res.redirect(`${FRONTEND_URL}/auth-callback?token=...`)
                          ↓
                   AuthCallback.jsx
                          ↓
                   Store token → Redirect to /upload
```

---

## ✨ Features Now Production-Ready

- ✅ Environment-specific configuration
- ✅ No hardcoded URLs
- ✅ Secure CORS configuration
- ✅ OAuth integration (Google & GitHub)
- ✅ JWT token management
- ✅ Token persistence in localStorage
- ✅ Dynamic API endpoints
- ✅ Development and production support
- ✅ Easy environment switching
- ✅ Security best practices implemented

---

## 📞 Troubleshooting

### CORS Errors
- **Problem:** "Access to XMLHttpRequest blocked by CORS"
- **Solution:** Verify FRONTEND_URL matches the exact origin (protocol, domain, port)

### OAuth Redirect Loop
- **Problem:** Infinite redirect between login and auth-callback
- **Solution:** Verify JWT_SECRET and SESSION_SECRET are set correctly

### Token Not Persisting
- **Problem:** Token not stored in localStorage
- **Solution:** Check browser console for errors; verify token is in URL params

### Environment Variables Not Loading
- **Problem:** App using defaults instead of .env values
- **Solution:** Restart dev server after .env changes; rebuild for production

---

## 🎯 Next Steps

1. **Test locally** with the provided .env files
2. **Update OAuth credentials** for production
3. **Generate secure secrets** for JWT_SECRET and SESSION_SECRET
4. **Deploy frontend** with VITE_BACKEND_URL set
5. **Deploy backend** with FRONTEND_URL set
6. **Monitor logs** for any environment variable issues
7. **Test complete OAuth flow** in production

---

**Last Updated:** May 4, 2026  
**Version:** 1.0 Production-Ready
