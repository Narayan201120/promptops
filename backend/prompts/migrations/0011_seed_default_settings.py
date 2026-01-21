# Generated data migration for seeding default system settings

from django.db import migrations


def seed_default_settings(apps, schema_editor):
    """Seed default system settings"""
    SystemSetting = apps.get_model('prompts', 'SystemSetting')
    
    default_settings = [
        {
            'key': 'default_provider',
            'value': 'gemini',
            'description': 'Default LLM provider for new tests',
            'is_public': True,
            'category': 'defaults'
        },
        {
            'key': 'default_model',
            'value': 'gemini-2.5-flash',
            'description': 'Default model for new tests',
            'is_public': True,
            'category': 'defaults'
        },
        {
            'key': 'cost_alert_threshold',
            'value': 10.0,
            'description': 'Alert when costs exceed this amount (USD)',
            'is_public': False,
            'category': 'limits'
        },
        {
            'key': 'max_batch_size',
            'value': 500,
            'description': 'Maximum number of items in a batch test',
            'is_public': False,
            'category': 'limits'
        },
        {
            'key': 'available_providers',
            'value': ['openai', 'gemini'],
            'description': 'List of available LLM providers',
            'is_public': True,
            'category': 'features'
        },
        {
            'key': 'available_models',
            'value': {
                'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                'gemini': ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']
            },
            'description': 'Available models per provider',
            'is_public': True,
            'category': 'features'
        },
        {
            'key': 'feature_flags',
            'value': {
                'semantic_search': True,
                'batch_testing': True,
                'benchmarking': True,
                'github_sync': True,
                'audit_logs': True
            },
            'description': 'Feature toggles',
            'is_public': True,
            'category': 'features'
        },
        {
            'key': 'rate_limits',
            'value': {
                'test_per_minute': 60,
                'benchmark_per_minute': 20,
                'batch_per_minute': 10,
                'github_sync_per_minute': 30
            },
            'description': 'API rate limits per endpoint',
            'is_public': False,
            'category': 'limits'
        }
    ]
    
    for setting_data in default_settings:
        SystemSetting.objects.get_or_create(
            key=setting_data['key'],
            defaults=setting_data
        )


def reverse_seed(apps, schema_editor):
    """Remove seeded settings"""
    SystemSetting = apps.get_model('prompts', 'SystemSetting')
    keys = [
        'default_provider', 'default_model', 'cost_alert_threshold',
        'max_batch_size', 'available_providers', 'available_models',
        'feature_flags', 'rate_limits'
    ]
    SystemSetting.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('prompts', '0010_systemsetting'),
    ]

    operations = [
        migrations.RunPython(seed_default_settings, reverse_seed),
    ]
