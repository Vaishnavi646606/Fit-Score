# Google OAuth Implementation Checklist

## Backend Setup ✅

- [x] Install dependencies (`passport`, `passport-google-oauth20`, `jsonwebtoken`, `express-session`)
- [x] Create User model in MongoDB
- [x] Set up Passport Google OAuth strategy
- [x] Create JWT middleware for protected routes
- [x] Create auth routes (`/auth/google`, `/auth/google/callback`, `/auth/me`, `/auth/logout`)
- [x] Update server.js with passport middleware
- [x] Create `.env.example` template

## Your TODO List

### 1. Install Dependencies
```bash
cd fitscore-api
npm install
```

### 2. Google Cloud Setup
- [ ] Go to https://console.cloud.google.com/
- [ ] Create a new project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add redirect URI: `http://localhost:5000/auth/google/callback`
- [ ] Copy Client ID and Client Secret

### 3. Configure Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Add GOOGLE_CLIENT_ID
- [ ] Add GOOGLE_CLIENT_SECRET
- [ ] Add JWT_SECRET (generate a strong random string)
- [ ] Add SESSION_SECRET (generate a strong random string)
- [ ] Verify MONGODB_URI is set
- [ ] Verify FRONTEND_URL matches your React app port

### 4. Frontend Auth Callback Page
- [ ] Create `src/pages/AuthCallback.jsx` (see FRONTEND_GOOGLE_LOGIN_EXAMPLE.jsx)
- [ ] Add route in `src/App.jsx`: `/auth-callback` → AuthCallback component
- [ ] Handle token and user data storage

### 5. Add Login Button
- [ ] Create Google login component (see FRONTEND_GOOGLE_LOGIN_EXAMPLE.jsx)
- [ ] Add to `src/pages/Login.jsx`
- [ ] Style to match your UI
- [ ] Test login flow

### 6. Integrate API Calls
- [ ] Copy `FRONTEND_API_UTILITY.js` to `src/utils/apiClient.js`
- [ ] Use `apiCall()` instead of `fetch()` for all API requests
- [ ] Token will be automatically added to headers

### 7. Protect Routes
- [ ] Add auth middleware to protected API routes
- [ ] Example: `/analyze` route should require authentication

### 8. Add Logout
- [ ] Create logout function:
```javascript
const handleLogout = async () => {
  await apiCall('/auth/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  navigate('/login');
};
```

### 9. Test Complete Flow
- [ ] Start backend: `npm start` (in fitscore-api)
- [ ] Start frontend: `npm run dev` (in resume-screener-v2-pkg)
- [ ] Click "Login with Google"
- [ ] Verify redirect to Google login
- [ ] Verify callback receives token
- [ ] Verify frontend stores token
- [ ] Test protected API endpoints

## Files Reference

**Backend Files Created:**
```
fitscore-api/
├── config/passport.js
├── middleware/authMiddleware.js
├── models/User.js
├── routes/auth.js
├── .env.example
└── GOOGLE_OAUTH_SETUP.md
```

**Examples Provided:**
```
resume-screener-v2-final/
├── FRONTEND_GOOGLE_LOGIN_EXAMPLE.jsx
├── FRONTEND_API_UTILITY.js
└── IMPLEMENTATION_SUMMARY.md
```

## Important URLs

- Google OAuth Flow: `http://localhost:5000/auth/google`
- Get User: `GET http://localhost:5000/auth/me` (requires token)
- Logout: `POST http://localhost:5000/auth/logout`
- Frontend: `http://localhost:5173`
- Callback URL: `http://localhost:5173/auth-callback`

## Environment Variables Template

```env
# Backend
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_random
SESSION_SECRET=your_super_secret_session_key_random
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
```

## Common Issues & Solutions

### "Invalid Client ID"
- Check GOOGLE_CLIENT_ID spelling in .env
- Verify credentials in Google Cloud Console

### "Redirect URI mismatch"
- Ensure `http://localhost:5000/auth/google/callback` is registered in Google Cloud
- Check for typos, http vs https

### "Cannot find module"
- Run `npm install` in fitscore-api
- Clear node_modules and reinstall if needed

### Token not persisting
- Check localStorage in browser DevTools
- Verify token is being saved in AuthCallback component

### Logout not working
- Clear localStorage when logging out
- Remove Authorization header from subsequent requests

## Next Steps

1. ✅ Backend is ready - just needs credentials
2. Setup Google OAuth credentials
3. Configure .env file
4. Update frontend with login component
5. Test the complete flow

---

**Questions?** Check `GOOGLE_OAUTH_SETUP.md` for detailed documentation.
