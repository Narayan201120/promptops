"""Cost calculation utilities for LLM API usage"""
from .settings_utils import get_setting


def get_pricing(provider, model):
    """
    Get pricing for a specific provider and model
    
    Returns dict with 'input' and 'output' prices per 1M tokens
    """
    # Get pricing from system settings
    all_pricing = get_setting('model_pricing', {})
    
    if provider in all_pricing and model in all_pricing[provider]:
        return all_pricing[provider][model]
    
    # Fallback pricing if not in settings
    default_pricing = {
        'openai': {
            'gpt-4': {'input': 30.00, 'output': 60.00},
            'gpt-4-turbo': {'input': 10.00, 'output': 30.00},
            'gpt-3.5-turbo': {'input': 0.50, 'output': 1.50},
        },
        'gemini': {
            'gemini-2.5-flash': {'input': 0.075, 'output': 0.30},
            'gemini-2.5-pro': {'input': 1.25, 'output': 5.00},
            'gemini-2.0-flash': {'input': 0.10, 'output': 0.40},
        },
        'grok': {
            'grok-4-1-fast-reasoning': {'input': 0.20, 'output': 0.50},
            'grok-4-fast-reasoning': {'input': 0.20, 'output': 0.50},
            'grok-3': {'input': 3.00, 'output': 15.00},
            'grok-3-mini': {'input': 0.30, 'output': 0.50},
            'grok-2-vision-1212': {'input': 2.00, 'output': 10.00},
        }
    }
    
    if provider in default_pricing and model in default_pricing[provider]:
        return default_pricing[provider][model]
    
    # Ultimate fallback
    return {'input': 1.0, 'output': 2.0}


def calculate_cost(input_tokens, output_tokens, provider, model):
    """
    Calculate cost in USD for token usage
    
    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        provider: LLM provider
        model: Model name
        
    Returns:
        dict with cost breakdown
    """
    pricing = get_pricing(provider, model)
    
    # Calculate costs (pricing is per 1M tokens)
    input_cost = (input_tokens / 1_000_000) * pricing['input']
    output_cost = (output_tokens / 1_000_000) * pricing['output']
    total_cost = input_cost + output_cost
    
    return {
        'input_cost': round(input_cost, 6),
        'output_cost': round(output_cost, 6),
        'total_cost': round(total_cost, 6),
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
        'total_tokens': input_tokens + output_tokens,
        'pricing': pricing
    }


def estimate_cost(prompt_text, provider, model, max_tokens=1000):
    """
    Estimate cost before running a test
    
    Args:
        prompt_text: The prompt text
        provider: LLM provider
        model: Model name
        max_tokens: Maximum expected output tokens
        
    Returns:
        dict with estimated costs
    """
    from .token_utils import count_tokens
    
    input_tokens = count_tokens(prompt_text, provider, model)
    estimated_output_tokens = max_tokens
    
    cost_data = calculate_cost(input_tokens, estimated_output_tokens, provider, model)
    cost_data['is_estimate'] = True
    cost_data['max_tokens'] = max_tokens
    
    return cost_data
