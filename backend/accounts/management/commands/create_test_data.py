from django.core.management.base import BaseCommand
from accounts.models import User, Tenant
from prompts.models import Prompt, PromptVersion


class Command(BaseCommand):
    help = 'Create test data for development'

    def handle(self, *args, **kwargs):
        tenant = Tenant.objects.create(name='Demo Organization')
        
        user = User.objects.create_user(
            username='demo',
            email='demo@promptops.com',
            password='demo123',
            first_name='Demo',
            last_name='User',
            tenant=tenant,
            role='admin'
        )
        
        prompts_data = [
            {
                'title': 'Blog Post Writer',
                'description': 'Generate engaging blog posts',
                'content': 'Write a blog post about {{topic}} in {{tone}} tone. Include an introduction, 3 main points, and a conclusion.'
            },
            {
                'title': 'Code Reviewer',
                'description': 'Review code for best practices',
                'content': 'Review the following code and provide feedback on:\n1. Code quality\n2. Best practices\n3. Potential bugs\n\nCode:\n{{code}}'
            },
            {
                'title': 'Email Generator',
                'description': 'Create professional emails',
                'content': 'Write a professional email to {{recipient}} about {{subject}}. Tone: {{tone}}'
            }
        ]
        
        for data in prompts_data:
            prompt = Prompt.objects.create(
                tenant=tenant,
                created_by=user,
                **data
            )
            PromptVersion.objects.create(
                prompt=prompt,
                content=data['content'],
                version_number=1,
                created_by=user
            )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created test data'))
        self.stdout.write(f'Username: demo')
        self.stdout.write(f'Password: demo123')
