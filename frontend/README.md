# PromptOps Frontend

React + Vite frontend for PromptOps.

## Setup

```bash
npm install
npm run dev
```

## Features

- ✅ Authentication (Login/Register)
- ✅ JWT token management with auto-refresh
- ✅ Protected routes
- ✅ Dashboard with prompts list
- ✅ Tailwind CSS styling
- ✅ React Query for data fetching

## Tech Stack

- React 18
- Vite
- React Router v6
- TanStack Query (React Query)
- Axios
- Tailwind CSS

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable components
├── context/       # React context (Auth)
├── hooks/         # Custom hooks
├── pages/         # Page components
└── App.jsx        # Main app component
```

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:8000/api
```

## Available Routes

- `/login` - Login page
- `/register` - Registration page
- `/` - Dashboard (protected)
