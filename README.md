# Fit Score

Fit Score is a resume screening app with a React/Vite frontend and an Express/MongoDB backend. It supports email/password auth plus Google and GitHub OAuth, and it analyzes resumes against job descriptions.

## Project Layout

- `resume-screener-v2-pkg/` - Vite frontend
- `fitscore-api/` - Express backend
- `fitscore-backend/` - Python resume analysis service

## Local Setup

1. Copy `.env.example` to `.env` in the frontend and backend folders as needed.
2. Start the backend API.
3. Start the frontend app.
4. Make sure OAuth callback URLs match your local frontend and backend ports.

## Environment Variables

- Frontend uses `VITE_BACKEND_URL`
- Backend uses `FRONTEND_URL`, `MONGODB_URI`, OAuth credentials, and secrets

## Notes

- Secrets should never be committed.
- `.env` files are ignored by git.
- Production deployments should use real environment variables from the hosting platform.