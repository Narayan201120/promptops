from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User, Tenant
from .models import Prompt, PromptVersion


class PromptTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Org')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!',
            tenant=self.tenant
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_prompt(self):
        data = {
            'title': 'Test Prompt',
            'description': 'A test prompt',
            'content': 'Write a story about {{topic}}'
        }
        response = self.client.post('/api/prompts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prompt.objects.count(), 1)
        self.assertEqual(PromptVersion.objects.count(), 1)
    
    def test_update_prompt_creates_version(self):
        prompt = Prompt.objects.create(
            tenant=self.tenant,
            title='Test Prompt',
            content='Original content',
            created_by=self.user
        )
        PromptVersion.objects.create(
            prompt=prompt,
            content='Original content',
            version_number=1,
            created_by=self.user
        )
        
        data = {'content': 'Updated content'}
        response = self.client.patch(f'/api/prompts/{prompt.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(prompt.versions.count(), 2)
        self.assertEqual(prompt.versions.first().version_number, 2)
