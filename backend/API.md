# PromptOps API Documentation

## Base URL
`http://localhost:8000/api`

## Authentication Endpoints

### Register
**POST** `/auth/register/`

Request:
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "tenant_name": "Acme Corp"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "username": "john",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin",
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Login
**POST** `/auth/login/`

Request:
```json
{
  "username": "john",
  "password": "SecurePass123!"
}
```

Response: `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Token
**POST** `/auth/refresh/`

Request:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Get Profile
**GET** `/auth/profile/`

Headers: `Authorization: Bearer {access_token}`

## Prompt Endpoints

### List Prompts
**GET** `/prompts/`

Query params:
- `search` - Search in title/description
- `is_archived` - Filter by archived status
- `ordering` - Sort by field (created_at, updated_at, title)

### Create Prompt
**POST** `/prompts/`

Request:
```json
{
  "title": "Blog Writer",
  "description": "Generate blog posts",
  "content": "Write a blog about {{topic}}"
}
```

### Get Prompt
**GET** `/prompts/{id}/`

### Update Prompt
**PATCH** `/prompts/{id}/`

Note: Updating content automatically creates a new version

### Delete Prompt
**DELETE** `/prompts/{id}/`

### Get Versions
**GET** `/prompts/{id}/versions/`

### Revert to Version
**POST** `/prompts/{id}/revert/`

Request:
```json
{
  "version_id": "uuid"
}
```

## Test Run Endpoints

### List Test Runs
**GET** `/test-runs/`

### Create Test Run
**POST** `/test-runs/`

Request:
```json
{
  "prompt": "uuid",
  "version": "uuid",
  "provider": "openai",
  "model": "gpt-4",
  "input_variables": {"topic": "AI"},
  "response": "Generated text...",
  "tokens_used": 150,
  "cost": 0.003,
  "latency_ms": 1200
}
```
