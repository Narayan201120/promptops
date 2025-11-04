# PromptOps

**AI Prompt Management Platform** - Manage, version, test, and deploy AI prompts.

> 🎉 **Status**: MVP Complete! | 📊 **Progress**: 80% | 🚀 **Next**: Deploy to Production

[![Django](https://img.shields.io/badge/Django-4.2-green)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop (running)

### Setup

1. **Start databases:**
```bash
docker-compose up -d
```

2. **Backend setup:**
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py create_test_data
python manage.py runserver
```

3. **Celery worker (new terminal):**
```bash
cd backend
start_celery.bat
```

4. **Frontend setup (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

5. **Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin: http://localhost:8000/admin

6. **Test credentials:**
- Username: `demo`
- Password: `demo123`

## Project Structure

```
promptops/
├── backend/          # Django application
├── frontend/         # React application
└── docker-compose.yml
```

## Tech Stack

**Backend:** Django 4.2, DRF, PostgreSQL, Redis, Celery
**Frontend:** React 18, Vite, Tailwind CSS, TanStack Query
**Deployment:** Docker, Railway/Render, Vercel

## Current Features

✅ **Authentication**
- User registration with organization creation
- JWT-based login/logout
- Token auto-refresh
- Protected routes

✅ **Prompt Management**
- Create, read, update, delete prompts
- Automatic version control
- Version history and revert
- Search and filtering
- Multi-tenant data isolation
- Inline editing
- Delete confirmation

✅ **Dashboard**
- View all prompts
- Create new prompts
- Responsive design
- Modern UI with Tailwind CSS

✅ **Prompt Editor**
- Detail page with inline editing
- Version history viewer
- One-click revert to any version
- Shared layout with navigation

✅ **LLM Integration**
- Test prompts against OpenAI (GPT-3.5, GPT-4)
- Test prompts against Anthropic (Claude 3)
- Async execution with Celery
- Real-time results with polling
- Token counting and cost calculation
- Variable extraction and replacement

✅ **Analytics Dashboard**
- Usage metrics and statistics
- Cost tracking over time
- Test activity trends (30 days)
- Provider breakdown (OpenAI vs Anthropic)
- Top prompts by usage
- Performance metrics (latency)
- Interactive charts with Recharts

## Documentation

- [START.md](START.md) - Quick start guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test
- [CHECKLIST.md](CHECKLIST.md) - Feature checklist
- [backend/API.md](backend/API.md) - API reference

## What's Included

**8 Completed Phases:**
1. ✅ Foundation - Django + React setup
2. ✅ Authentication - JWT auth system
3. ✅ Prompt API - CRUD with versioning
4. ✅ Frontend - React UI with routing
5. ✅ Prompt Editor - Create/edit/version UI
6. ✅ LLM Integration - OpenAI + Anthropic
7. ✅ Analytics - Usage metrics & charts
8. ✅ Production Ready - Error handling, deployment config

**Ready to Deploy:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## API Keys Required

Add to `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## License

MIT
