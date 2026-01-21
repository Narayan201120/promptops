"""Token counting utilities for different LLM providers"""
import tiktoken


def count_tokens_openai(text, model='gpt-4'):
    """
    Count tokens for OpenAI models using tiktoken
    
    Args:
        text: Input text to count tokens for
        model: OpenAI model name
        
    Returns:
        int: Number of tokens
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # Fallback to cl100k_base for newer models
        encoding = tiktoken.get_encoding("cl100k_base")
    
    return len(encoding.encode(text))


def count_tokens_gemini(text):
    """
    Estimate tokens for Gemini models
    
    Gemini uses approximately 4 characters per token
    This is an approximation since exact tokenizer isn't public
    
    Args:
        text: Input text to estimate tokens for
        
    Returns:
        int: Estimated number of tokens
    """
    # Rough estimate: 4 chars = 1 token
    return max(1, len(text) // 4)


def count_tokens(text, provider, model):
    """
    Count tokens based on provider
    
    Args:
        text: Input text
        provider: LLM provider (openai, gemini, grok)
        model: Model name
        
    Returns:
        int: Number of tokens
    """
    if not text:
        return 0
    
    if provider == 'openai':
        return count_tokens_openai(text, model)
    elif provider == 'gemini':
        return count_tokens_gemini(text)
    elif provider == 'grok':
        # Grok uses OpenAI-compatible tokenizer
        return count_tokens_openai(text, 'gpt-4')
    
    # Fallback: rough estimate
    return len(text) // 4
