/**
 * API Key Manager - Client-Side Storage
 * Stores API keys in localStorage with optional encryption
 * Zero-trust: Backend never stores keys
 */

const STORAGE_KEY = 'promptops_api_keys';

// Simple encryption for localStorage (optional layer of security)
const encrypt = (text) => {
    try {
        return btoa(encodeURIComponent(text));
    } catch {
        return text;
    }
};

const decrypt = (text) => {
    try {
        return decodeURIComponent(atob(text));
    } catch {
        return text;
    }
};

export const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        placeholder: 'sk-proj-...',
        docsUrl: 'https://platform.openai.com/api-keys',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    gemini: {
        name: 'Google Gemini',
        placeholder: 'AIza...',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        models: ['gemini-2.5-flash', 'gemini-2.5-pro']
    },
    grok: {
        name: 'xAI Grok',
        placeholder: 'xai-...',
        docsUrl: 'https://console.x.ai/',
        models: ['grok-4-1-fast-reasoning', 'grok-4-fast-reasoning', 'grok-3', 'grok-3-mini']
    },
    anthropic: {
        name: 'Anthropic',
        placeholder: 'sk-ant-...',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
    },
    cohere: {
        name: 'Cohere',
        placeholder: 'co-...',
        docsUrl: 'https://dashboard.cohere.com/api-keys',
        models: ['command-r-plus', 'command-r']
    },
    mistral: {
        name: 'Mistral AI',
        placeholder: 'mis-...',
        docsUrl: 'https://console.mistral.ai/api-keys/',
        models: ['mistral-large-latest', 'mistral-medium-latest', 'mixtral-8x7b']
    },
    perplexity: {
        name: 'Perplexity',
        placeholder: 'pplx-...',
        docsUrl: 'https://www.perplexity.ai/settings/api',
        models: ['sonar', 'sonar-pro']
    },
    groq: {
        name: 'Groq',
        placeholder: 'gsk_...',
        docsUrl: 'https://console.groq.com/keys',
        models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768']
    }
};

class APIKeyManager {
    constructor() {
        this.keys = this.loadKeys();
    }

    /**
     * Load all API keys from localStorage
     */
    loadKeys() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return {};

            const decrypted = decrypt(stored);
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Failed to load API keys:', error);
            return {};
        }
    }

    /**
     * Save all API keys to localStorage
     */
    saveKeys() {
        try {
            const json = JSON.stringify(this.keys);
            const encrypted = encrypt(json);
            localStorage.setItem(STORAGE_KEY, encrypted);
        } catch (error) {
            console.error('Failed to save API keys:', error);
        }
    }

    /**
     * Set an API key for a provider
     */
    setKey(provider, apiKey) {
        if (!PROVIDERS[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        this.keys[provider] = {
            key: apiKey,
            addedAt: new Date().toISOString()
        };

        this.saveKeys();
    }

    /**
     * Get an API key for a provider
     */
    getKey(provider) {
        return this.keys[provider]?.key || null;
    }

    /**
     * Get masked key for display (e.g., sk-***xyz)
     */
    getMaskedKey(provider) {
        const key = this.getKey(provider);
        if (!key) return null;

        if (key.length > 8) {
            return `${key.slice(0, 3)}***${key.slice(-4)}`;
        }
        return `***${key.slice(-4)}`;
    }

    /**
     * Delete an API key
     */
    deleteKey(provider) {
        delete this.keys[provider];
        this.saveKeys();
    }

    /**
     * Get all configured providers with full info
     */
    getConfiguredProviders() {
        return Object.keys(this.keys)
            .filter(id => PROVIDERS[id]) // Only include known providers
            .map(id => ({
                id,
                ...PROVIDERS[id],
                configured: true,
                maskedKey: this.getMaskedKey(id)
            }));
    }

    /**
     * Check if a provider is configured
     */
    hasKey(provider) {
        return !!this.keys[provider];
    }

    /**
     * Get all available providers (configured + unconfigured)
     */
    getAllProviders() {
        return Object.entries(PROVIDERS).map(([id, info]) => ({
            id,
            ...info,
            configured: this.hasKey(id),
            maskedKey: this.getMaskedKey(id)
        }));
    }

    /**
     * Export all keys as JSON (for backup)
     */
    exportKeys() {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            keys: this.keys
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptops-api-keys-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import keys from JSON file
     */
    async importKeys(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data.keys || typeof data.keys !== 'object') {
                        throw new Error('Invalid import file format');
                    }

                    // Merge imported keys with existing
                    this.keys = { ...this.keys, ...data.keys };
                    this.saveKeys();

                    resolve(Object.keys(data.keys).length);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Clear all API keys
     */
    clearAll() {
        this.keys = {};
        this.saveKeys();
    }

    /**
     * Get headers for API request (to send keys to backend)
     */
    getAuthHeaders(provider) {
        const key = this.getKey(provider);
        if (!key) return {};

        return {
            'X-API-Provider': provider,
            'X-API-Key': key
        };
    }
}

// Export singleton instance
export const apiKeyManager = new APIKeyManager();

export default apiKeyManager;
