# FitScore — AI-Powered Resume Screening & Job Matching Platform

FitScore is an AI-powered resume screening application that evaluates how well a candidate's resume matches a job description. It combines a React frontend, an Express backend, MongoDB, and a Python-based resume analysis service to help candidates understand their job fit and identify skill gaps.

**Live Demo:** https://fit-score-beta.vercel.app/

## Project Overview

FitScore helps candidates analyze resumes against job descriptions and understand their compatibility with a target role.

### Key Features

- **Resume Analysis:** Analyze resumes against job descriptions.
- **Fit Score:** Evaluate resume-to-job compatibility using matching metrics.
- **Skill Gap Analysis:** Identify relevant skills that may be missing from a resume.
- **Job Recommendations:** Support job discovery and matching workflows.
- **Authentication:** Email/password authentication and Google/GitHub OAuth integration.
- **Multi-Service Architecture:** React frontend, Express API, and Python analysis service.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend API | Node.js, Express.js |
| Database | MongoDB |
| Resume Analysis | Python, NLP, text similarity |
| Authentication | Email/password, Google OAuth, GitHub OAuth |
| Deployment | Vercel and configured backend hosting |

## System Architecture

```text
Candidate
   |
   v
React + Vite Frontend
   |
   v
Express Backend API
   |
   +----> MongoDB
   |
   v
Python Resume Analysis Service
   |
   v
Resume-to-Job Matching Results
   |
   v
Fit Score & Skill Gap Insights
```

## Project Structure

```text
FitScore/
├── resume-screener-v2-pkg/   # React + Vite frontend
├── fitscore-api/             # Express backend API
├── fitscore-backend/         # Python resume analysis service
└── README.md
```

## How It Works

1. The candidate provides a resume and a target job description.
2. The application processes the resume and job description.
3. The Python analysis service evaluates relevant text and skills.
4. The backend coordinates requests and database operations.
5. The application presents matching results and skill-gap insights.

## Local Setup

### Prerequisites

- Node.js and npm
- Python
- MongoDB connection
- Git

### 1. Clone the repository

```bash
git clone YOUR_FITSCORE_REPOSITORY_URL
cd YOUR_FITSCORE_PROJECT_FOLDER
```

Replace the placeholders with the actual repository URL and project folder name.

### 2. Configure environment variables

Create the required local `.env` files using the available `.env.example` templates.

Configure the relevant variables, including:

- Frontend: `VITE_BACKEND_URL`
- Backend: `FRONTEND_URL`, `MONGODB_URI`, OAuth credentials, and other required secrets

Never commit API keys, passwords, OAuth secrets, or production environment files.

### 3. Start the backend services

Install the dependencies for the Express API and Python service, configure their environment variables, and start each service using the commands defined in its project configuration.

### 4. Start the frontend

Install the frontend dependencies and run the Vite development server using the scripts defined in `package.json`.

Ensure the frontend backend URL and OAuth callback URLs match the local configuration.

## Security Considerations

- Keep secrets and credentials in environment variables.
- Exclude `.env` files from version control.
- Use appropriate authentication and database access controls.
- Configure production environment variables through the hosting platform.

## Skills Demonstrated

`React` · `Vite` · `Node.js` · `Express.js` · `MongoDB` · `Python` · `NLP` · `Text Similarity` · `REST APIs` · `OAuth` · `Full-Stack Development`

## Live Application

Explore FitScore: https://fit-score-beta.vercel.app/
