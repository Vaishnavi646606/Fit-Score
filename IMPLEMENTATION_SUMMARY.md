# Google OAuth Implementation Summary

## ✅ What's Been Implemented

### 1. **New Dependencies** (package.json)
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy
- `jsonwebtoken` - JWT token generation  
- `express-session` - Session management

### 2. **User Model** (models/User.js)
Stores user information from Google:
- `googleId` - OAuth identifier
- `email` - User email (unique)
- `name` - Display name
- `picture` - Profile picture URL
- `createdAt`, `updatedAt` - Timestamps

### 3. **Passport Configuration** (config/passport.js)
- Google OAuth 2.0 strategy setup
- User creation/update on login
- Automatic user lookup or create
- Session serialization/deserialization

### 4. **Auth Routes** (routes/auth.js)
Four endpoints:
- `GET /auth/google` - Start OAuth flow
- `GET /auth/google/callback` - OAuth callback (creates user, returns JWT)
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout endpoint

### 5. **JWT Middleware** (middleware/authMiddleware.js)
- Validates JWT tokens
- Protects routes requiring authentication
- Extracts user info from token

### 6. **Updated Server** (server.js)
- Passport initialization
- Express session middleware
- Auth routes mounted on `/auth`

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd fitscore-api
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy template to .env
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Get Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add callback URL: `http://localhost:5000/auth/google/callback`
   - Add your credentials to `.env`

4. **Start server:**
   ```bash
   npm start
   ```

## 📋 Environment Variables Required

```env
MONGODB_URI=your_mongodb_connection
JWT_SECRET=strong_random_secret_key
SESSION_SECRET=strong_random_secret_key
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:5173
```

## 🔗 Integration Flow

```
User clicks "Login with Google"
         ↓
Redirects to GET /auth/google
         ↓
Google login screen
         ↓
User authenticates
         ↓
Redirects to GET /auth/google/callback
         ↓
Server creates/updates user in MongoDB
         ↓
Server generates JWT token
         ↓
Redirects to frontend with token & user data
         ↓
Frontend stores token in localStorage
         ↓
Frontend uses token for authenticated requests
```

## 🔐 How to Use Tokens

All authenticated endpoints require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Example frontend code:
```javascript
const token = localStorage.getItem('authToken');
const response = await fetch('http://localhost:5000/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## 🛡️ Protect Routes

Add authentication to any route:
```javascript
const authMiddleware = require('../middleware/authMiddleware');

router.get('/protected', authMiddleware, (req, res) => {
  console.log(req.user); // Contains: id, email, name
  res.json({ message: 'Success' });
});
```

## 📁 Files Created/Modified

**Created:**
- `models/User.js` - User schema with Google OAuth fields
- `config/passport.js` - Passport strategy configuration  
- `middleware/authMiddleware.js` - JWT validation middleware
- `routes/auth.js` - OAuth routes and callbacks
- `.env.example` - Environment template
- `GOOGLE_OAUTH_SETUP.md` - Detailed setup guide
- `FRONTEND_GOOGLE_LOGIN_EXAMPLE.jsx` - React login component example

**Modified:**
- `server.js` - Added passport middleware & auth routes
- `package.json` - Added dependencies

## 🧪 Testing

Test the flow:
1. Visit `http://localhost:5000/auth/google`
2. Authenticate with Google
3. Check if token appears in frontend URL
4. Store token and test protected routes

## 💡 Next Steps

1. Update frontend `Login.jsx` to add Google login button
2. Create auth callback handler in frontend
3. Add JWT token to all API requests
4. Implement token refresh if needed
5. Add logout button to navbar

---

**Note:** Update `FRONTEND_URL` in `.env` to match your frontend port when deploying.
