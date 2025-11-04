# Deploy PromptOps - Step by Step

## Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)

## Step 1: Push to GitHub (5 minutes)

```bash
# Initialize git (if not already done)
cd c:\Users\naray\OneDrive\Desktop\promptops
git init

# Add all files
git add .

# Commit
git commit -m "PromptOps MVP - Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/promptops.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Railway (10 minutes)

### 2.1 Create Railway Project
1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `promptops` repository
5. Railway will detect Django automatically

### 2.2 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create and link it automatically

### 2.3 Add Redis
1. Click "New" again
2. Select "Database" → "Redis"
3. Railway will create and link it automatically

### 2.4 Configure Environment Variables
In Railway dashboard, go to your Django service → Variables:

```
SECRET_KEY=your-random-secret-key-here-make-it-long-and-random
DEBUG=False
ALLOWED_HOSTS=${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_URL=${{DATABASE_URL}}
REDIS_URL=${{REDIS_URL}}
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Generate SECRET_KEY:**
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.5 Add Celery Worker
1. In Railway project, click "New"
2. Select "GitHub Repo" (same repo)
3. In Settings → Start Command, set:
   ```
   cd backend && celery -A config worker -l info
   ```
4. Add same environment variables as Django service

### 2.6 Run Migrations
In Railway Django service → Settings → Deploy:
1. Wait for deployment to complete
2. Go to service → Settings → "Run Command"
3. Run: `python manage.py migrate`
4. Run: `python manage.py create_test_data`

### 2.7 Get Backend URL
- Copy your Railway public domain (e.g., `promptops-production.up.railway.app`)
- Your API will be at: `https://promptops-production.up.railway.app/api`

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Create Vercel Project
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Add Environment Variable
In Vercel project settings → Environment Variables:

```
VITE_API_URL=https://your-railway-domain.up.railway.app/api
```

### 3.3 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Get your Vercel URL (e.g., `promptops.vercel.app`)

## Step 4: Update CORS (2 minutes)

Go back to Railway → Django service → Variables:

Update `CORS_ALLOWED_ORIGINS` with your actual Vercel URL:
```
CORS_ALLOWED_ORIGINS=https://promptops.vercel.app
```

Redeploy the Django service.

## Step 5: Test Production (5 minutes)

1. Visit your Vercel URL
2. Register a new account
3. Create a prompt
4. Test the prompt (make sure Celery worker is running)
5. View analytics

## Troubleshooting

### Backend not starting
- Check Railway logs
- Verify environment variables
- Check DATABASE_URL is set

### Frontend can't connect to backend
- Check VITE_API_URL is correct
- Check CORS_ALLOWED_ORIGINS includes your Vercel URL
- Check backend is running

### Tests not working
- Check Celery worker is running in Railway
- Check REDIS_URL is set
- Check API keys are valid

### Static files not loading
- Run `python manage.py collectstatic` in Railway

## Cost Estimate

**Railway:**
- Hobby Plan: $5/month per service
- Django service: $5
- Celery worker: $5
- PostgreSQL: $5
- Redis: $5
- **Total: $20/month**

**Vercel:**
- Hobby Plan: Free
- **Total: $0/month**

**LLM APIs:**
- Variable based on usage
- Monitor in analytics dashboard

**Grand Total: ~$20-50/month**

## Post-Deployment

### Monitor
- Railway: Check logs for errors
- Vercel: Check deployment logs
- Test all features

### Backup
- Railway provides automatic database backups
- Download backup: Railway → PostgreSQL → Backups

### Update
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Railway and Vercel auto-deploy on push
```

## Success Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL added
- [ ] Redis added
- [ ] Celery worker running
- [ ] Environment variables set
- [ ] Migrations run
- [ ] Frontend deployed to Vercel
- [ ] CORS configured
- [ ] Can register user
- [ ] Can create prompt
- [ ] Can test prompt
- [ ] Analytics working

## Your URLs

**Backend API:** https://_____.up.railway.app/api
**Frontend:** https://_____.vercel.app
**Admin:** https://_____.up.railway.app/admin

---

**🎉 Congratulations! Your app is live! 🎉**

Share your URL and start getting users!
