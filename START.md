# Quick Start Guide

## Prerequisites
- Docker Desktop running
- Python 3.11+
- Node.js 18+

## Step 1: Start Databases
```bash
docker-compose up -d
```

## Step 2: Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py create_test_data
python manage.py runserver
```

Backend will run on: http://localhost:8000

## Step 3: Celery Worker (New Terminal)
```bash
cd backend
start_celery.bat
```

Required for LLM testing.

## Step 4: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

## Test Credentials
- Username: `demo`
- Password: `demo123`

## What You Can Do Now

1. **Register a new account** at http://localhost:5173/register
2. **Login** at http://localhost:5173/login
3. **View dashboard** with existing prompts
4. **Test prompts** against OpenAI/Anthropic
5. **API Documentation** available at `backend/API.md`

## API Keys (Required for Testing)

Add to `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Verify Setup

### Backend Health Check
```bash
curl http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

Should return JWT tokens.

### Frontend
Open http://localhost:5173 in browser - should see login page.

## Troubleshooting

**Database connection error?**
- Make sure Docker is running
- Check `docker-compose ps` shows containers running

**Port already in use?**
- Backend: Change port in `python manage.py runserver 8001`
- Frontend: Vite will auto-assign different port

**CORS errors?**
- Check `.env` files in both backend and frontend
- Ensure `CORS_ALLOWED_ORIGINS` includes frontend URL
