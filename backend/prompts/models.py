from django.db import models
from pgvector.django import VectorField, HnswIndex
from accounts.models import User, Tenant
import uuid


class Prompt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='prompts')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content = models.TextField()
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='prompts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            HnswIndex(
                name='prompt_embedding_idx',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops']
            )
        ]

    def __str__(self):
        return self.title


class PromptVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='versions')
    content = models.TextField()
    variables = models.JSONField(default=dict)
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    version_number = models.IntegerField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ['prompt', 'version_number']
        indexes = [
            HnswIndex(
                name='version_embedding_idx',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops']
            )
        ]

    def __str__(self):
        return f"{self.prompt.title} v{self.version_number}"


class Benchmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='benchmarks')
    version = models.ForeignKey(PromptVersion, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Benchmark {self.created_at} - {self.prompt.title}"


class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='datasets')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    data = models.JSONField(default=list)  # List of dictionaries
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class GitHubIntegration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='github_integrations')
    access_token = models.CharField(max_length=255)  # In real app, encrypt this!
    repository = models.CharField(max_length=255)  # "owner/repo"
    branch = models.CharField(max_length=255, default='main')
    base_path = models.CharField(max_length=255, default='prompts/')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"GitHub {self.repository}"


class BatchRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='batch_runs')
    version = models.ForeignKey(PromptVersion, on_delete=models.SET_NULL, null=True)
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=50, default='pending')  # pending, running, completed, failed
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Batch {self.created_at} - {self.prompt.title}"


class TestRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='test_runs')
    version = models.ForeignKey(PromptVersion, on_delete=models.SET_NULL, null=True)
    benchmark = models.ForeignKey(Benchmark, on_delete=models.CASCADE, related_name='test_runs', null=True, blank=True)
    batch_run = models.ForeignKey(BatchRun, on_delete=models.CASCADE, related_name='test_runs', null=True, blank=True)
    provider = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    input_variables = models.JSONField(default=dict)
    response = models.TextField()
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    
    # Token usage tracking
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    tokens_used = models.IntegerField(default=0)  # Total tokens (kept for backwards compatibility)
    
    # Cost tracking (in USD)
    input_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    output_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=6, default=0)  # Total cost (kept for backwards compatibility)
    
    latency_ms = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            HnswIndex(
                name='testrun_embedding_idx',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops']
            )
        ]

    def __str__(self):
        return f"{self.prompt.title} - {self.provider}/{self.model}"


class AuditLog(models.Model):
    """Track all user actions for security and debugging"""
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('TEST', 'Test Run'),
        ('BENCHMARK', 'Benchmark Run'),
        ('BATCH', 'Batch Run'),
        ('SYNC', 'GitHub Sync'),
        ('ERROR', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['tenant', '-timestamp']),
            models.Index(fields=['model_name', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} {self.model_name} at {self.timestamp}"


class SystemSetting(models.Model):
    """Global system settings for configuration management"""
    key = models.CharField(max_length=100, unique=True, primary_key=True)
    value = models.JSONField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False, help_text="Can be accessed by frontend without authentication")
    category = models.CharField(max_length=50, default='general', help_text="Settings category (general, features, limits, etc.)")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['category', 'key']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.key}: {self.value}"
