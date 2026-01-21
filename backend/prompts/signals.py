from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Prompt, PromptVersion, TestRun, Benchmark, BatchRun
from .tasks import update_prompt_embedding, update_version_embedding, update_test_run_embedding
from .audit import create_audit_log

@receiver(post_save, sender=Prompt)
def prompt_saved(sender, instance, created, **kwargs):
    # Always update embedding on save, as title/description might change
    from django.db import transaction
    transaction.on_commit(lambda: update_prompt_embedding.delay(instance.id))
    
    # Audit log
    action = 'CREATE' if created else 'UPDATE'
    if hasattr(instance, '_audit_user'):
        create_audit_log(
            user=instance._audit_user,
            tenant=instance.tenant,
            action=action,
            model_name='Prompt',
            object_id=instance.id,
            changes={'title': instance.title, 'description': instance.description}
        )

@receiver(post_delete, sender=Prompt)
def prompt_deleted(sender, instance, **kwargs):
    if hasattr(instance, '_audit_user'):
        create_audit_log(
            user=instance._audit_user,
            tenant=instance.tenant,
            action='DELETE',
            model_name='Prompt',
            object_id=instance.id,
            changes={'title': instance.title}
        )

@receiver(post_save, sender=PromptVersion)
def version_saved(sender, instance, created, **kwargs):
    if created:
        from django.db import transaction
        transaction.on_commit(lambda: update_version_embedding.delay(instance.id))

@receiver(post_save, sender=TestRun)
def test_run_saved(sender, instance, created, **kwargs):
    if created:
        from django.db import transaction
        transaction.on_commit(lambda: update_test_run_embedding.delay(instance.id))
        
        # Audit log for test runs
        if hasattr(instance, '_audit_user'):
            create_audit_log(
                user=instance._audit_user,
                tenant=instance.prompt.tenant,
                action='TEST',
                model_name='TestRun',
                object_id=instance.id,
                metadata={
                    'prompt': str(instance.prompt.id),
                    'provider': instance.provider,
                    'model': instance.model,
                    'status': instance.status
                }
            )

@receiver(post_save, sender=BatchRun)
def batch_run_saved(sender, instance, created, **kwargs):
    if created and hasattr(instance, '_audit_user'):
        create_audit_log(
            user=instance._audit_user,
            tenant=instance.prompt.tenant,
            action='BATCH',
            model_name='BatchRun',
            object_id=instance.id,
            metadata={
                'prompt': str(instance.prompt.id),
                'dataset': str(instance.dataset.id)
            }
        )

@receiver(post_save, sender=Benchmark)
def benchmark_saved(sender, instance, created, **kwargs):
    if created and hasattr(instance, '_audit_user'):
        create_audit_log(
            user=instance._audit_user,
            tenant=instance.prompt.tenant,
            action='BENCHMARK',
            model_name='Benchmark',
            object_id=instance.id,
            metadata={
                'prompt': str(instance.prompt.id),
                'name': instance.name
            }
        )
