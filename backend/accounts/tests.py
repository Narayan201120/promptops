from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User, Tenant


class AuthenticationTests(APITestCase):
    def test_register_user(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'tenant_name': 'Test Org'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())
        self.assertTrue(Tenant.objects.filter(name='Test Org').exists())
    
    def test_login_user(self):
        tenant = Tenant.objects.create(name='Test Org')
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!',
            tenant=tenant
        )
        data = {'username': 'testuser', 'password': 'TestPass123!'}
        response = self.client.post('/api/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
