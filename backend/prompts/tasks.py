from celery import shared_task
from .models import Prompt, PromptVersion, TestRun
from .services.llm_client import LLMClient


@shared_task
def run_llm_test(prompt_id, provider, model, variables, user_id):
    try:
        prompt = Prompt.objects.get(id=prompt_id)
        version = prompt.versions.first()
        client = LLMClient()
        
        if provider == 'openai':
            result = client.test_openai(prompt.content, model, variables)
        elif provider == 'anthropic':
            result = client.test_anthropic(prompt.content, model, variables)
        else:
            raise ValueError(f'Unknown provider: {provider}')
        
        test_run = TestRun.objects.create(
            prompt=prompt,
            version=version,
            provider=provider,
            model=model,
            input_variables=variables,
            response=result['response'],
            tokens_used=result['tokens'],
            cost=result['cost'],
            latency_ms=result['latency_ms'],
            created_by_id=user_id,
        )
        
        return {
            'status': 'success',
            'test_run_id': str(test_run.id),
            'response': result['response'],
            'tokens': result['tokens'],
            'cost': float(result['cost']),
            'latency_ms': result['latency_ms'],
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
        }
