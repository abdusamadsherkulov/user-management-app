# User Management App

A full-stack web application for user registration, authentication, and management. Built with React, Express, and PostgreSQL.

## Live Demo

- **Frontend:** _coming soon_
- **Backend API:** _coming soon_

## Features

- User registration with email verification (sent asynchronously via Resend)
- JWT-based authentication
- Protected admin panel — only accessible to authenticated, non-blocked users
- User management table with:
  - Multi-select checkboxes (with select-all)
  - Toolbar actions: Block, Unblock, Delete, Delete Unverified
  - Sorting by last login time
  - Filter by name or email
- Auth middleware checks user existence and block status before every protected request
- Email uniqueness enforced via a **unique database index** (not application-level code)
- Blocked users are redirected to login on their next action
- Deleted users can re-register with the same email
- Responsive, professional UI built with Bootstrap 5

## Tech Stack

**Frontend**
- React 18
- React Router v6
- Bootstrap 5 + Bootstrap Icons
- Axios
- Vite

**Backend**
- Node.js + Express
- PostgreSQL (Supabase)
- JWT (jsonwebtoken)
- bcryptjs
- Resend (email)
- nodemon (dev)

## Project Structure

```
user-management-app/
├── backend/
│   ├── src/
│   │   ├── db/index.js          # DB connection pool + schema + unique index
│   │   ├── middleware/auth.js   # JWT verification + block/delete check
│   │   ├── routes/auth.js       # POST /register, POST /login, GET /verify-email
│   │   └── routes/users.js      # GET /users, POST /block|unblock|delete
│   ├── .env                     # Environment variables (not committed)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── AdminPage.jsx
    │   │   └── VerifyEmailPage.jsx
    │   ├── api.js               # Axios instance with JWT interceptor
    │   └── App.jsx              # Routes + protected route wrappers
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database (local or Supabase)

### 1. Clone the repository

```bash
git clone https://github.com/abdusamadsherkulov/user-management-app.git
cd user-management-app
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
PORT=3001
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
```

Start the backend:

```bash
npm run dev
```

The server will initialize the database schema and unique index automatically on first run.

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Server port (default: 3001) |
| `FRONTEND_URL` | Frontend URL for email verification links |
| `RESEND_API_KEY` | Resend API key for sending emails |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL in production (leave empty for local dev) |

## Database

The app uses PostgreSQL with the following schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'unverified',
  verification_token UUID DEFAULT gen_random_uuid(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UNIQUE INDEX (not a primary key) - enforces email uniqueness at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (LOWER(email));
```

The unique index on `LOWER(email)` guarantees email uniqueness independently of how many sources push data simultaneously — no application-level uniqueness check is needed.

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node src/app.js`
6. Add all environment variables from the table above

### Frontend (Vercel)

1. Create a new project on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`

## Author

**Abdusamad Sherkulov**  
GitHub: [@abdusamadsherkulov](https://github.com/abdusamadsherkulov)