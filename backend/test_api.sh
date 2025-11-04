#!/bin/bash
# PromptOps API Test Script

BASE_URL="http://localhost:8000/api"

echo "=== Testing PromptOps API ==="
echo

# 1. Register a new user
echo "1. Registering new user..."
curl -X POST $BASE_URL/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "tenant_name": "Test Company"
  }'
echo -e "\n"

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123"
  }')
echo $LOGIN_RESPONSE
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access":"[^"]*' | cut -d'"' -f4)
echo -e "\n"

# 3. Get profile
echo "3. Getting user profile..."
curl -X GET $BASE_URL/auth/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo -e "\n"

# 4. Create a prompt
echo "4. Creating a prompt..."
curl -X POST $BASE_URL/prompts/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Prompt",
    "description": "A test prompt",
    "content": "Write about {{topic}}"
  }'
echo -e "\n"

# 5. List prompts
echo "5. Listing prompts..."
curl -X GET $BASE_URL/prompts/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo -e "\n"

echo "=== Tests Complete ==="
