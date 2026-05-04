# Google OAuth Setup Guide

This guide explains how to set up and use Google OAuth 2.0 authentication in this project.

## Prerequisites

- Google Cloud Console account
- MongoDB database
- Node.js and npm

## Step 1: Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

This will install:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth 2.0 strategy
- `jsonwebtoken` - For JWT token generation
- `express-session` - For session management

## Step 2: Set Up Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs:
   - Development: `http://localhost:5000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
6. Copy your Client ID and Client Secret

## Step 3: Configure Environment Variables

Create a `.env` file in the fitscore-api directory (or update your existing one):

```env
MONGODB_URI=mongodb://your_connection_string
JWT_SECRET=your_jwt_secret_key_min_32_chars
SESSION_SECRET=your_session_secret_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173
```

Replace the values with your actual credentials.

## Step 4: Frontend Setup

In your frontend (React app), create an auth callback page to handle the OAuth redirect:

```jsx
// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');

    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', user);
      navigate('/dashboard'); // or your after-login page
    } else {
      const errorMsg = params.get('message');
      console.error('Auth failed:', errorMsg);
      navigate('/login');
    }
  }, [navigate]);

  return <div>Logging in...</div>;
}
```

## Step 5: API Endpoints

### 1. Start Google OAuth Login

**GET** `/auth/google`

Initiates the Google OAuth 2.0 login flow. Redirect users to this endpoint:

```html
<a href="http://localhost:5000/auth/google">
  Login with Google
</a>
```

### 2. OAuth Callback

**GET** `/auth/google/callback`

Automatically handled by Passport. User is redirected here after Google authentication. Returns JWT token and user info via redirect to frontend.

### 3. Get Current User

**GET** `/auth/me`

Returns the current authenticated user's information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://..."
}
```

### 4. Logout

**POST** `/auth/logout`

Logs out the user. Frontend should clear the JWT token from localStorage.

## Step 6: Using the Auth Token

After login, store the JWT token and include it in all authenticated requests:

```javascript
// Example API call with authentication
const response = await fetch('http://localhost:5000/api/endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json',
  },
});
```

## Step 7: Protect Your Routes

To add authentication to your analyze route or any other routes:

```javascript
const authMiddleware = require('../middleware/authMiddleware');

// Protect the route
router.get('/protected-endpoint', authMiddleware, (req, res) => {
  // req.user contains the decoded JWT payload
  console.log('User:', req.user);
  res.json({ message: 'This is protected' });
});
```

## Database Schema

The User model stores:
- `googleId` - OAuth unique identifier
- `email` - User email address
- `name` - User display name
- `picture` - Profile picture URL
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

## Security Notes

1. **Never commit `.env`** - Keep credentials private
2. **Use HTTPS in production** - Set `secure: true` in session cookie
3. **Strong secrets** - Use strong, random values for JWT_SECRET and SESSION_SECRET
4. **CORS** - Adjust CORS settings based on your frontend domain
5. **Token expiration** - JWTs expire in 7 days, users need to re-login

## Troubleshooting

### "Invalid Client ID" error
- Verify Client ID and Secret in `.env`
- Check Google Cloud Console for typos

### "Redirect URI mismatch"
- Ensure redirect URI in `.env` matches exactly in Google Cloud Console
- Check for http vs https

### CORS errors
- Verify frontend URL in `.env` and CORS configuration

### User not saving
- Check MongoDB connection
- Verify MONGODB_URI in `.env`

## File Structure

```
fitscore-api/
├── config/
│   └── passport.js          # Passport configuration
├── middleware/
│   └── authMiddleware.js    # JWT verification middleware
├── models/
│   ├── Analysis.js
│   └── User.js              # New User model
├── routes/
│   ├── analyze.js
│   └── auth.js              # New auth routes
├── server.js                # Updated with passport
├── package.json             # Updated dependencies
├── .env                     # Your credentials (not committed)
├── .env.example             # Template
└── GOOGLE_OAUTH_SETUP.md    # This file
```
