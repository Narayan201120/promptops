# PromptOps

A comprehensive platform for creating, versioning, testing, and analyzing prompts for large language models.

## Features

### Core Platform

- **Prompt Version Control** - Full history tracking with revert capability
- **Semantic Search** - Find prompts using AI-powered embeddings
- **Test Sandbox** - Real-time prompt testing with any provider
- **Batch Testing** - Test prompts across multiple inputs with CSV upload
- **GitHub Sync** - Sync prompts with your repositories

### Multi-Provider Comparison

- Compare responses across multiple LLM providers simultaneously
- Side-by-side response display with full markdown rendering
- Automatic winner detection (cheapest and fastest)
- Cost, latency, and token usage tracking per provider
- Two-column layout with provider selection sidebar

### Supported LLM Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku |
| Google Gemini | Gemini 1.5 Pro, Gemini 1.5 Flash |
| Mistral AI | Mistral Large, Mistral Medium, Mistral Small |
| Cohere | Command R+, Command R |
| Perplexity | Sonar Pro, Sonar |
| Grok | Grok (via xAI) |

## Tech Stack

**Backend:** Django 5, Django REST Framework, Celery, Redis, PostgreSQL  
**Frontend:** React 18, Vite, TanStack Query, Framer Motion, React Markdown

## Backend Features

### Authentication

- JWT token-based authentication with access/refresh tokens
- Google OAuth integration
- Secure session management

### API Security

- Rate limiting on all endpoints (configurable per endpoint)
- CORS configuration with custom header support
- Audit logging for user actions

### Performance

- Redis-based caching layer for LLM responses
- Cache hit/miss tracking with configurable TTL
- Async task processing with Celery

### Monitoring

- Health check endpoint with dependency status
- Database, Redis, and Celery connectivity checks

### Cost Management

- Per-provider cost calculation based on token usage
- Real-time cost estimation before execution

## Frontend Features

### UI/UX

- Enterprise-grade dark theme
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Full markdown rendering for responses

### Pages

- **Dashboard** - Overview of all prompts with search and filters
- **Prompt Editor** - Create and edit prompts with live preview
- **Test Sandbox** - Quick testing with any configured provider
- **Compare View** - Multi-provider comparison modal
- **Settings** - API key management and preferences
- **Analytics** - Usage statistics and insights

### Security

- Zero-trust API key management (client-side storage only)
- Keys passed via headers, never stored on server
- Encrypted localStorage for sensitive data

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Redis
- PostgreSQL

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Celery Worker (separate terminal)

```bash
cd backend
.venv\Scripts\Activate.ps1
celery -A config worker -l info -P solo -c 1
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost:5432/promptops
REDIS_URL=redis://localhost:6379/0

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

## API Endpoints

### Authentication

- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Token refresh
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/google/` - Google OAuth

### Prompts

- `GET/POST /api/prompts/` - List/create prompts
- `GET/PATCH/DELETE /api/prompts/{id}/` - CRUD operations
- `GET /api/prompts/{id}/versions/` - Version history
- `POST /api/prompts/{id}/revert/` - Revert to version
- `POST /api/prompts/{id}/test/` - Test prompt
- `POST /api/prompts/{id}/compare/` - Multi-provider comparison

### System

- `GET /api/tasks/{id}/` - Async task status
- `GET /api/health/` - Health check

## Project Structure

```
promptops/
├── backend/
│   ├── accounts/           # Authentication
│   ├── config/             # Django settings
│   └── prompts/
│       ├── models.py       # Data models
│       ├── views.py        # API views
│       ├── tasks.py        # Celery tasks
│       ├── services/       # LLM client
│       ├── cache_utils.py  # Caching layer
│       └── cost_utils.py   # Cost calculation
├── frontend/
│   └── src/
│       ├── api/            # API client
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── context/        # React context
│       ├── utils/          # Utilities
│       └── styles/         # Global CSS
└── README.md
```

## Recent Updates

- Multi-provider comparison with side-by-side responses
- Full markdown rendering in comparison view
- Winner badges for cheapest/fastest providers
- Two-column layout for comparison modal
- Enterprise UI theme with dark mode
- Rate limiting and audit logging
- Redis caching for LLM responses
- Health check endpoint
- Cost estimation per provider

## License

MIT
