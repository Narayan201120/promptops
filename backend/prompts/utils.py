import os
from openai import OpenAI
from django.conf import settings

def get_embedding(text, model="text-embedding-3-small"):
    """
    Generates an embedding for the given text using OpenAI.
    """
    if not text:
        return None
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    try:
        text = text.replace("\n", " ")
        response = client.embeddings.create(
            input=[text], 
            model=model
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None
