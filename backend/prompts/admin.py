from django.contrib import admin
from .models import Prompt, PromptVersion, TestRun


@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = ['title', 'tenant', 'created_by', 'created_at', 'is_archived']
    list_filter = ['is_archived', 'tenant']
    search_fields = ['title', 'description']


@admin.register(PromptVersion)
class PromptVersionAdmin(admin.ModelAdmin):
    list_display = ['prompt', 'version_number', 'created_by', 'created_at']
    list_filter = ['prompt']


@admin.register(TestRun)
class TestRunAdmin(admin.ModelAdmin):
    list_display = ['prompt', 'provider', 'model', 'tokens_used', 'cost', 'created_at']
    list_filter = ['provider', 'model']
