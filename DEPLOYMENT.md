# PromptOps Deployment Guide

## Prerequisites

- Git repository (GitHub, GitLab, etc.)
- Railway/Render account (or similar PaaS)
- Domain name (optional)

## Option 1: Deploy to Railway

### 1. Prepare Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy Backend

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add PostgreSQL database (from Railway marketplace)
5. Add Redis (from Railway marketplace)

### 3. Configure Environment Variables

In Railway dashboard, add:

```
SECRET_KEY=<generate-random-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.railway.app
DATABASE_URL=<auto-filled-by-railway>
REDIS_URL=<auto-filled-by-railway>
OPENAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### 4. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Import your repository
3. Set root directory to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy

### 5. Run Migrations

In Railway dashboard:
```bash
python manage.py migrate
python manage.py create_test_data
```

## Option 2: Deploy to Render

### Backend

1. Create new Web Service
2. Connect GitHub repository
3. Build command: `cd backend && pip install -r requirements-prod.txt`
4. Start command: `cd backend && gunicorn config.wsgi`
5. Add PostgreSQL database
6. Add Redis instance
7. Set environment variables (same as Railway)

### Worker

1. Create new Background Worker
2. Same repository
3. Start command: `cd backend && celery -A config worker -l info`

### Frontend

1. Create new Static Site
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add environment variable

## Option 3: Docker Deployment

### 1. Create Dockerfile (Backend)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

COPY backend/ .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### 2. Create Dockerfile (Frontend)

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose (Production)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: promptops
      POSTGRES_USER: promptops
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - DATABASE_URL=postgresql://promptops:${DB_PASSWORD}@db:5432/promptops
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  worker:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: celery -A config worker -l info
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Post-Deployment Checklist

- [ ] Backend is accessible
- [ ] Frontend loads
- [ ] Can register new user
- [ ] Can login
- [ ] Can create prompt
- [ ] Can test prompt (check Celery worker)
- [ ] Analytics dashboard works
- [ ] HTTPS is enabled
- [ ] Environment variables are set
- [ ] Database backups configured

## Environment Variables Reference

### Backend
```
SECRET_KEY=<random-string>
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

### Frontend
```
VITE_API_URL=https://your-backend.com/api
```

## Monitoring

### Health Check Endpoint

```
GET https://your-backend.com/api/auth/login/
```

Should return 405 (Method Not Allowed) if backend is up.

### Logs

**Railway:** View in dashboard
**Render:** View in dashboard
**Docker:** `docker-compose logs -f`

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Automated Backups

Railway and Render provide automatic database backups.

## Scaling

### Horizontal Scaling

- Add more web workers (Railway/Render auto-scaling)
- Add more Celery workers for LLM tests

### Vertical Scaling

- Upgrade database plan
- Upgrade Redis plan
- Increase worker memory

## Troubleshooting

### Backend not starting
- Check environment variables
- Check database connection
- View logs

### Frontend not loading
- Check VITE_API_URL
- Check CORS settings
- Check build logs

### Tests not running
- Check Celery worker is running
- Check Redis connection
- Check API keys are valid

### High costs
- Monitor LLM usage in analytics
- Set usage limits
- Implement rate limiting

## Security Checklist

- [ ] DEBUG=False in production
- [ ] SECRET_KEY is random and secret
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] API keys in environment variables
- [ ] Database password is strong
- [ ] Regular security updates

## Performance Optimization

- [ ] Enable database connection pooling
- [ ] Configure Redis caching
- [ ] Enable gzip compression
- [ ] Use CDN for static files
- [ ] Optimize database queries
- [ ] Monitor slow endpoints

## Cost Estimation

### Railway (Hobby Plan)
- Backend: $5/month
- Database: $5/month
- Redis: $5/month
- Worker: $5/month
- **Total: ~$20/month**

### Vercel (Hobby Plan)
- Frontend: Free
- **Total: $0/month**

### LLM Costs
- Variable based on usage
- Monitor in analytics dashboard

**Estimated Total: $20-50/month** (depending on LLM usage)

---

**Ready to deploy!** Choose your platform and follow the steps above.
