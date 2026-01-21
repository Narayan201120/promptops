from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Prompt, PromptVersion, TestRun, BatchRun, GitHubIntegration
from .services.llm_client import LLMClient

User = get_user_model()
from .utils import get_embedding


@shared_task
def run_llm_test(prompt_id, provider, model, variables, user_id, api_key=None, benchmark_id=None, batch_run_id=None):
    try:
        prompt = Prompt.objects.get(id=prompt_id)
        version = prompt.versions.first()
        client = LLMClient(api_key=api_key, provider=provider)
        
        if provider == 'openai':
            result = client.test_openai(prompt.content, model, variables)
        elif provider == 'gemini':
            result = client.test_gemini(prompt.content, model, variables)
        elif provider == 'grok':
            result = client.test_grok(prompt.content, model, variables)
        elif provider == 'anthropic':
            result = client.test_anthropic(prompt.content, model, variables)
        elif provider == 'cohere':
            result = client.test_cohere(prompt.content, model, variables)
        elif provider == 'mistral':
            result = client.test_mistral(prompt.content, model, variables)
        elif provider == 'perplexity':
            result = client.test_perplexity(prompt.content, model, variables)
        elif provider == 'groq':
            result = client.test_groq(prompt.content, model, variables)
        else:
            raise ValueError(f'Unknown provider: {provider}')
        
        # Calculate detailed cost breakdown
        from .token_utils import count_tokens
        from .cost_utils import calculate_cost
        
        # Count tokens for input and output
        prompt_text = prompt.content
        for key, value in variables.items():
            prompt_text = prompt_text.replace(f'{{{{{key}}}}}', str(value))
        
        input_tokens = count_tokens(prompt_text, provider, model)
        output_tokens = count_tokens(result['response'], provider, model)
        
        cost_data = calculate_cost(input_tokens, output_tokens, provider, model)
        
        test_run = TestRun.objects.create(
            prompt=prompt,
            version=version,
            benchmark_id=benchmark_id,
            batch_run_id=batch_run_id,
            provider=provider,
            model=model,
            input_variables=variables,
            response=result['response'],
            input_tokens=cost_data['input_tokens'],
            output_tokens=cost_data['output_tokens'],
            tokens_used=cost_data['total_tokens'],
            input_cost=cost_data['input_cost'],
            output_cost=cost_data['output_cost'],
            cost=cost_data['total_cost'],
            latency_ms=result['latency_ms'],
            created_by_id=user_id,
        )
        
        # Trigger embedding generation for the test run
        update_test_run_embedding.delay(test_run.id)
        
        return {
            'status': 'success',
            'test_run_id': str(test_run.id),
            'response': result['response'],
            'input_tokens': cost_data['input_tokens'],
            'output_tokens': cost_data['output_tokens'],
            'tokens': cost_data['total_tokens'],
            'input_cost': float(cost_data['input_cost']),
            'output_cost': float(cost_data['output_cost']),
            'cost': float(cost_data['total_cost']),
            'latency_ms': result['latency_ms'],
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
        }


@shared_task
def run_llm_comparison(prompt_id, providers, variables, api_keys, user_id):
    """Run tests across multiple providers in parallel and return comparison"""
    from celery import group
    import time
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting comparison for prompt {prompt_id} with providers: {providers}")
    
    try:
        prompt = Prompt.objects.get(id=prompt_id)
        logger.info(f"Found prompt: {prompt.title}")
        
        # Get default models for each provider
        provider_models = {
            'openai': 'gpt-3.5-turbo',
            'gemini': 'gemini-2.5-flash',
            'grok': 'grok-4-1-fast-reasoning',
            'anthropic': 'claude-3-5-sonnet-20241022',
            'cohere': 'command-r-plus',
            'mistral': 'mistral-large-latest',
            'perplexity': 'sonar',
            'groq': 'llama-3.1-70b-versatile',
        }
        
        results = {}
        start_time = time.time()
        
        # Run tests sequentially to avoid overwhelming APIs
        for provider in providers:
            model = provider_models.get(provider, 'default')
            api_key = api_keys.get(provider)
            
            try:
                # Call the existing test task
                result = run_llm_test(
                    prompt_id,
                    provider,
                    model,
                    variables,
                    user_id,
                    api_key
                )
                results[provider] = {
                    **result,
                    'provider': provider,
                    'model': model
                }
            except Exception as e:
                results[provider] = {
                    'status': 'error',
                    'error': str(e),
                    'provider': provider,
                    'model': model
                }
        
        total_time = int((time.time() - start_time) * 1000)
        
        # Find winners
        successful_results = {k: v for k, v in results.items() if v.get('status') == 'success'}
        
        winners = {
            'cheapest': None,
            'fastest': None,
        }
        
        if successful_results:
            # Find cheapest
            cheapest = min(successful_results.items(), key=lambda x: x[1].get('cost', float('inf')))
            winners['cheapest'] = cheapest[0]
            
            # Find fastest
            fastest = min(successful_results.items(), key=lambda x: x[1].get('latency_ms', float('inf')))
            winners['fastest'] = fastest[0]
        
        return {
            'status': 'success',
            'results': results,
            'winners': winners,
            'total_time_ms': total_time,
            'providers_count': len(providers)
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task
def update_prompt_embedding(prompt_id):
    try:
        prompt = Prompt.objects.get(id=prompt_id)
        # Combine title and description for embedding
        text = f"{prompt.title}\n{prompt.description}"
        embedding = get_embedding(text)
        if embedding:
            prompt.embedding = embedding
            prompt.save(update_fields=['embedding'])
    except Prompt.DoesNotExist:
        pass


@shared_task
def update_version_embedding(version_id):
    try:
        version = PromptVersion.objects.get(id=version_id)
        embedding = get_embedding(version.content)
        if embedding:
            version.embedding = embedding
            version.save(update_fields=['embedding'])
    except PromptVersion.DoesNotExist:
        pass


@shared_task
def update_test_run_embedding(test_run_id):
    try:
        test_run = TestRun.objects.get(id=test_run_id)
        # Combine input and response for embedding
        text = f"Input: {test_run.input_variables}\nResponse: {test_run.response}"
        embedding = get_embedding(text)
        if embedding:
            test_run.embedding = embedding
            test_run.save(update_fields=['embedding'])
    except TestRun.DoesNotExist:
        pass


@shared_task
def execute_batch_run(batch_run_id, variable_mapping, provider, model):
    try:
        batch_run = BatchRun.objects.get(id=batch_run_id)
        batch_run.status = 'running'
        batch_run.save()
        
        dataset = batch_run.dataset
        prompt = batch_run.prompt
        
        for row in dataset.data:
            # Map dataset columns to prompt variables
            variables = {}
            for prompt_var, csv_col in variable_mapping.items():
                if csv_col in row:
                    variables[prompt_var] = row[csv_col]
            
            # Run test
            run_llm_test.delay(
                str(prompt.id),
                provider,
                model,
                variables,
                batch_run.created_by.id if batch_run.created_by else None,
                batch_run_id=str(batch_run.id)
            )
            
        batch_run.status = 'completed'
        batch_run.completed_at = timezone.now()
        batch_run.save()
        
    except Exception as e:
        if 'batch_run' in locals():
            batch_run.status = 'failed'
            batch_run.save()
        raise e


@shared_task
def push_to_github_task(prompt_id, commit_message, user_id):
    try:
        from github import Github
        import yaml
        
        prompt = Prompt.objects.get(id=prompt_id)
        version = prompt.versions.first()
        user = User.objects.get(id=user_id)
        integration = GitHubIntegration.objects.filter(tenant=user.tenant).first()
        
        if not integration:
            return {'status': 'error', 'error': 'GitHub integration not configured'}
            
        g = Github(integration.access_token)
        repo = g.get_repo(integration.repository)
        
        # Prepare YAML content
        data = {
            'name': prompt.title,
            'description': prompt.description,
            'version': version.version_number,
            'variables': version.variables,
            'template': version.content,
            'meta': {
                'created_at': str(version.created_at),
                'author': version.created_by.email if version.created_by else 'unknown'
            }
        }
        
        yaml_content = yaml.dump(data, sort_keys=False)
        
        from django.utils.text import slugify
        file_path = f"{integration.base_path.rstrip('/')}/{slugify(prompt.title)}.yaml"
        
        print(f"GitHub Sync Attempt:")
        print(f"  Repository: {integration.repository}")
        print(f"  Branch: {integration.branch}")
        print(f"  File Path: {file_path}")
        
        try:
            contents = repo.get_contents(file_path, ref=integration.branch)
            repo.update_file(
                file_path,
                commit_message,
                yaml_content,
                contents.sha,
                branch=integration.branch
            )
            action = 'updated'
        except Exception as e:
            print(f"Update failed (file might not exist): {e}")
            try:
                repo.create_file(
                    file_path,
                    commit_message,
                    yaml_content,
                    branch=integration.branch
                )
                action = 'created'
            except Exception as create_error:
                print(f"Create failed: {create_error}")
                raise create_error
            
        return {'status': 'success', 'action': action, 'path': file_path}
        
    except Exception as e:
        print(f"GitHub Sync Error: {e}")
        return {'status': 'error', 'error': str(e)}

