from decouple import config
import time
import hashlib
import json
from django.core.cache import cache
import google.generativeai as genai
import openai


class LLMClient:
    def __init__(self, api_key=None, provider=None):
        """
        Initialize LLM Client
        Args:
            api_key: Optional API key from request (takes priority)
            provider: Provider name to use the api_key for
        """
        # Use provided key if available, otherwise fall back to env
        if api_key and provider:
            # Set the specific provider key, others from env
            self.openai_key = api_key if provider == 'openai' else config('OPENAI_API_KEY', default='')
            self.gemini_key = api_key if provider == 'gemini' else config('GEMINI_API_KEY', default='')
            self.grok_key = api_key if provider == 'grok' else config('GROK_API_KEY', default='')
            self.anthropic_key = api_key if provider == 'anthropic' else config('ANTHROPIC_API_KEY', default='')
            self.cohere_key = api_key if provider == 'cohere' else config('COHERE_API_KEY', default='')
            self.mistral_key = api_key if provider == 'mistral' else config('MISTRAL_API_KEY', default='')
            self.perplexity_key = api_key if provider == 'perplexity' else config('PERPLEXITY_API_KEY', default='')
            self.groq_key = api_key if provider == 'groq' else config('GROQ_API_KEY', default='')
        else:
            # No API key provided, use env variables
            self.openai_key = config('OPENAI_API_KEY', default='')
            self.gemini_key = config('GEMINI_API_KEY', default='')
            self.grok_key = config('GROK_API_KEY', default='')
            self.anthropic_key = config('ANTHROPIC_API_KEY', default='')
            self.cohere_key = config('COHERE_API_KEY', default='')
            self.mistral_key = config('MISTRAL_API_KEY', default='')
            self.perplexity_key = config('PERPLEXITY_API_KEY', default='')
            self.groq_key = config('GROQ_API_KEY', default='')
        
        self.cache_ttl = 86400  # 24 hours
    
    def _generate_cache_key(self, provider, model, content, variables):
        """Generate deterministic cache key for LLM responses"""
        # Combine all inputs
        cache_data = {
            'provider': provider,
            'model': model,
            'content': content,
            'variables': variables or {}
        }
        
        # Create hash
        content_str = json.dumps(cache_data, sort_keys=True)
        return f"llm_response_{hashlib.md5(content_str.encode()).hexdigest()}"
    
    def _replace_variables(self, content, variables):
        """Replace {{variable}} placeholders with actual values"""
        for key, value in variables.items():
            content = content.replace(f'{{{{{key}}}}}', str(value))
        return content
    
    def test_grok(self, prompt_content, model='grok-4-1-fast-reasoning', variables=None):
        if not self.grok_key:
            raise ValueError('Grok API key not configured')
        
        # Generate cache key
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('grok', model, prompt_content, variables)
        
        # Check cache first
        cached_response = cache.get(cache_key)
        if cached_response:
            return {
                **cached_response,
                'cached': True,
                'cache_hit': True
            }
        
        # Call Grok API (using OpenAI-compatible client)
        client = openai.OpenAI(
            api_key=self.grok_key,
            base_url="https://api.x.ai/v1"
        )
        
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'cost': self._calculate_grok_cost(model, response.usage),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        # Cache the response
        cache.set(cache_key, result, timeout=self.cache_ttl)
        
        return result
    
    def test_anthropic(self, prompt_content, model='claude-3-5-sonnet-20241022', variables=None):
        if not hasattr(self, 'anthropic_key') or not self.anthropic_key:
            raise ValueError('Anthropic API key not configured')
        
        # Generate cache key
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('anthropic', model, prompt_content, variables)
        
        # Check cache first
        cached_response = cache.get(cache_key)
        if cached_response:
            return {
                **cached_response,
                'cached': True,
                'cache_hit': True
            }
        
        # Call Anthropic API
        try:
            from anthropic import Anthropic
        except ImportError:
            raise ValueError('anthropic package not installed. Run: pip install anthropic')
        
        client = Anthropic(api_key=self.anthropic_key)
        
        start_time = time.time()
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "user", "content": content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.content[0].text,
            'tokens': response.usage.input_tokens + response.usage.output_tokens,
            'cost': self._calculate_anthropic_cost(model, response.usage),
           'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        # Cache the response
        cache.set(cache_key, result, timeout=self.cache_ttl)
        
        return result
    
    def test_cohere(self, prompt_content, model='command-r-plus', variables=None):
        if not self.cohere_key:
            raise ValueError('Cohere API key not configured')
        
        import cohere
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('cohere', model, prompt_content, variables)
        
        cached_response = cache.get(cache_key)
        if cached_response:
            return {**cached_response, 'cached': True, 'cache_hit': True}
        
        client = cohere.Client(self.cohere_key)
        start_time = time.time()
        response = client.chat(model=model, message=content)
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.text,
            'tokens': response.meta.tokens.input_tokens + response.meta.tokens.output_tokens if hasattr(response.meta, 'tokens') else 0,
            'cost': self._calculate_cohere_cost(model, response.meta.tokens if hasattr(response.meta, 'tokens') else None),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        cache.set(cache_key, result, timeout=self.cache_ttl)
        return result
    
    def test_mistral(self, prompt_content, model='mistral-large-latest', variables=None):
        if not self.mistral_key:
            raise ValueError('Mistral API key not configured')
        
        from mistralai import Mistral
        
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('mistral', model, prompt_content, variables)
        
        cached_response = cache.get(cache_key)
        if cached_response:
            return {**cached_response, 'cached': True, 'cache_hit': True}
        
        client = Mistral(api_key=self.mistral_key)
        start_time = time.time()
        response = client.chat.complete(
            model=model,
            messages=[{"role": "user", "content": content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'cost': self._calculate_mistral_cost(model, response.usage),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        cache.set(cache_key, result, timeout=self.cache_ttl)
        return result
    
    def test_perplexity(self, prompt_content, model='sonar', variables=None):
        if not self.perplexity_key:
            raise ValueError('Perplexity API key not configured')
        
        import openai
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('perplexity', model, prompt_content, variables)
        
        cached_response = cache.get(cache_key)
        if cached_response:
            return {**cached_response, 'cached': True, 'cache_hit': True}
        
        client = openai.OpenAI(api_key=self.perplexity_key, base_url="https://api.perplexity.ai")
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'cost': self._calculate_perplexity_cost(model, response.usage),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        cache.set(cache_key, result, timeout=self.cache_ttl)
        return result
    
    def test_groq(self, prompt_content, model='llama-3.1-70b-versatile', variables=None):
        if not self.groq_key:
            raise ValueError('Groq API key not configured')
        
        from groq import Groq
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('groq', model, prompt_content, variables)
        
        cached_response = cache.get(cache_key)
        if cached_response:
            return {**cached_response, 'cached': True, 'cache_hit': True}
        
        client = Groq(api_key=self.groq_key)
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'cost': self._calculate_groq_cost(model, response.usage),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
       
        cache.set(cache_key, result, timeout=self.cache_ttl)
        return result
    
    def test_openai(self, prompt_content, model='gpt-3.5-turbo', variables=None):
        if not self.openai_key:
            raise ValueError('OpenAI API key not configured')
        
        # Generate cache key
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('openai', model, prompt_content, variables)
        
        # Check cache first
        cached_response = cache.get(cache_key)
        if cached_response:
            return {
                **cached_response,
                'cached': True,
                'cache_hit': True
            }
        
        # Call OpenAI API
        client = openai.OpenAI(api_key=self.openai_key)
        
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        result = {
            'response': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'cost': self._calculate_openai_cost(model, response.usage),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        # Cache the response
        cache.set(cache_key, result, timeout=self.cache_ttl)
        
        return result
    
    def test_gemini(self, prompt_content, model='gemini-2.5-flash', variables=None):
        if not self.gemini_key:
            raise ValueError('Gemini API key not configured')
        
        # Generate cache key
        content = self._replace_variables(prompt_content, variables or {})
        cache_key = self._generate_cache_key('gemini', model, prompt_content, variables)
        
        # Check cache first
        cached_response = cache.get(cache_key)
        if cached_response:
            return {
                **cached_response,
'cached': True,
                'cache_hit': True
            }
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_key)
        model_instance = genai.GenerativeModel(model)
        
        start_time = time.time()
        response = model_instance.generate_content(content)
        latency = int((time.time() - start_time) * 1000)
        
        # Calculate tokens (approximate for Gemini)
        result = {
            'response': response.text,
            'tokens': response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else len(content.split()),
            'cost': self._calculate_gemini_cost(model, response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else len(content.split())),
            'latency_ms': latency,
            'cached': False,
            'cache_hit': False
        }
        
        # Cache the response
        cache.set(cache_key, result, timeout=self.cache_ttl)
        
        return result
    
    def _calculate_openai_cost(self, model, usage):
        costs = {
            'gpt-3.5-turbo': {'input': 0.50, 'output': 1.50},
            'gpt-4': {'input': 30.00, 'output': 60.00},
            'gpt-4-turbo': {'input': 10.00, 'output': 30.00},
        }
        rates = costs.get(model, costs['gpt-3.5-turbo'])
        return (usage.prompt_tokens * rates['input'] + usage.completion_tokens * rates['output']) / 1000000
    
    def _calculate_gemini_cost(self, model, tokens):
        rate = {
            'gemini-2.5-flash': {'per_million': 0.075},
            'gemini-2.5-pro': {'per_million': 1.25},
        }
        rate = rate.get(model, rate['gemini-2.5-flash'])
        return (tokens * rate['per_million']) / 1000000
    
    def _calculate_grok_cost(self, model, usage):
        # Grok pricing (as per xAI documentation)
        costs = {
            'grok-4-1-fast-reasoning': {'input': 0.20, 'output': 0.50},
            'grok-4-fast-reasoning': {'input': 0.20, 'output': 0.50},
            'grok-3': {'input': 3.00, 'output': 15.00},
            'grok-3-mini': {'input': 0.30, 'output': 0.50},
            'grok-2-vision-1212': {'input': 2.00, 'output': 10.00},
        }
        rates = costs.get(model, costs['grok-4-1-fast-reasoning'])
        return (usage.prompt_tokens * rates['input'] + usage.completion_tokens * rates['output']) / 1000000
    
    def _calculate_anthropic_cost(self, model, usage):
        # Anthropic pricing (per million tokens)
        costs = {
            'claude-3-5-sonnet-20241022': {'input': 3.00, 'output': 15.00},
            'claude-3-opus-20240229': {'input': 15.00, 'output': 75.00},
            'claude-3-haiku-20240307': {'input': 0.25, 'output': 1.25},
            'claude-3-sonnet-20240229': {'input': 3.00, 'output': 15.00},
        }
        rates = costs.get(model, costs['claude-3-5-sonnet-20241022'])
        return (usage.input_tokens * rates['input'] + usage.output_tokens * rates['output']) / 1000000

    def _calculate_cohere_cost(self, model, tokens):
        # Cohere pricing (per million tokens)
        costs = {
            'command-r-plus': {'input': 3.00, 'output': 15.00},
            'command-r': {'input': 0.50, 'output': 1.50},
        }
        rates = costs.get(model, costs['command-r-plus'])
        if tokens:
            return (tokens.input_tokens * rates['input'] + tokens.output_tokens * rates['output']) / 1000000
        return 0.0
    
    def _calculate_mistral_cost(self, model, usage):
        # Mistral pricing (per million tokens)
        costs = {
            'mistral-large-latest': {'input': 3.00, 'output': 9.00},
            'mistral-medium-latest': {'input': 2.70, 'output': 8.10},
            'mixtral-8x7b': {'input': 0.70, 'output': 0.70},
        }
        rates = costs.get(model, costs['mistral-large-latest'])
        return (usage.prompt_tokens * rates['input'] + usage.completion_tokens * rates['output']) / 1000000
    
    
    def _calculate_perplexity_cost(self, model, usage):
        # Perplexity pricing (per million tokens)
        costs = {
            'sonar': {'input': 0.20, 'output': 0.20},
            'sonar-pro': {'input': 3.00, 'output': 15.00},
        }
        rates = costs.get(model, costs['sonar'])
        return (usage.prompt_tokens * rates['input'] + usage.completion_tokens * rates['output']) / 1000000
    
    def _calculate_groq_cost(self, model, usage):
        # Groq pricing (per million tokens) - ultra-fast inference, very competitive
        costs = {
            'llama-3.1-70b-versatile': {'input': 0.59, 'output': 0.79},
            'mixtral-8x7b-32768': {'input': 0.24, 'output': 0.24},
            'gemma-7b-it': {'input': 0.07, 'output': 0.07},
        }
        rates = costs.get(model, costs['llama-3.1-70b-versatile'])
        return (usage.prompt_tokens * rates['input'] + usage.completion_tokens * rates['output']) / 1000000
