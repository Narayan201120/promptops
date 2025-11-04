from decouple import config
import openai
import anthropic
import time


class LLMClient:
    def __init__(self):
        self.openai_key = config('OPENAI_API_KEY', default='')
        self.anthropic_key = config('ANTHROPIC_API_KEY', default='')
    
    def test_openai(self, prompt_content, model='gpt-3.5-turbo', variables=None):
        if not self.openai_key:
            raise ValueError('OpenAI API key not configured')
        
        client = openai.OpenAI(api_key=self.openai_key)
        content = self._replace_variables(prompt_content, variables or {})
        
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{'role': 'user', 'content': content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        return {
            'response': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'cost': self._calculate_openai_cost(model, response.usage),
            'latency_ms': latency,
        }
    
    def test_anthropic(self, prompt_content, model='claude-3-haiku-20240307', variables=None):
        if not self.anthropic_key:
            raise ValueError('Anthropic API key not configured')
        
        client = anthropic.Anthropic(api_key=self.anthropic_key)
        content = self._replace_variables(prompt_content, variables or {})
        
        start_time = time.time()
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[{'role': 'user', 'content': content}]
        )
        latency = int((time.time() - start_time) * 1000)
        
        return {
            'response': response.content[0].text,
            'tokens': response.usage.input_tokens + response.usage.output_tokens,
            'cost': self._calculate_anthropic_cost(model, response.usage),
            'latency_ms': latency,
        }
    
    def _replace_variables(self, content, variables):
        for key, value in variables.items():
            content = content.replace(f'{{{{{key}}}}}', str(value))
        return content
    
    def _calculate_openai_cost(self, model, usage):
        costs = {
            'gpt-3.5-turbo': {'input': 0.0005, 'output': 0.0015},
            'gpt-4': {'input': 0.03, 'output': 0.06},
            'gpt-4-turbo': {'input': 0.01, 'output': 0.03},
        }
        rates = costs.get(model, costs['gpt-3.5-turbo'])
        return (usage.prompt_tokens * rates['input'] + usage.completion_tokens * rates['output']) / 1000
    
    def _calculate_anthropic_cost(self, model, usage):
        costs = {
            'claude-3-haiku-20240307': {'input': 0.00025, 'output': 0.00125},
            'claude-3-sonnet-20240229': {'input': 0.003, 'output': 0.015},
            'claude-3-opus-20240229': {'input': 0.015, 'output': 0.075},
        }
        rates = costs.get(model, costs['claude-3-haiku-20240307'])
        return (usage.input_tokens * rates['input'] + usage.output_tokens * rates['output']) / 1000
