import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { promptsAPI } from '../api/prompts';
import { tasksAPI } from '../api/tasks';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import Input from './ui/Input';
import { Play, CheckCircle, AlertCircle, Cpu, DollarSign, Clock, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import styles from './TestSandbox.module.css';
import apiKeyManager, { PROVIDERS } from '../utils/apiKeyManager';

export default function TestSandbox({ promptId, promptContent, onResultChange, showResponseInline = true }) {
  const navigate = useNavigate();
  const [availableProviders, setAvailableProviders] = useState([]);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [variables, setVariables] = useState([]);
  const [result, setResult] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [showConfig, setShowConfig] = useState(true);

  // Load configured providers on mount
  useEffect(() => {
    const configured = apiKeyManager.getConfiguredProviders();
    setAvailableProviders(configured);

    if (configured.length > 0 && !provider) {
      const firstProvider = configured[0];
      setProvider(firstProvider.id); // Use .id since it's now an object
      setModel(firstProvider.models[0]); // Use .models from the object
    }
  }, []);

  // Update model when provider changes
  useEffect(() => {
    if (provider && PROVIDERS[provider]) {
      setModel(PROVIDERS[provider].models[0]);
    }
  }, [provider]);

  useEffect(() => {
    const extractVariables = (content) => {
      const matches = content?.match(/\{\{(\w+)\}\}/g);
      if (!matches) return [];
      return [...new Set(matches.map(m => m.slice(2, -2)))];
    };

    const varNames = extractVariables(promptContent);
    setVariables(varNames.map(name => ({
      key: name,
      value: ''
    })));
  }, [promptContent]);

  const testMutation = useMutation({
    mutationFn: (data) => promptsAPI.test(promptId, data),
    onSuccess: (response) => {
      setTaskId(response.data.task_id);
      setResult({ status: 'pending' });
    },
  });

  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await tasksAPI.getStatus(taskId);
        if (data.status === 'completed') {
          const newResult = data.result;
          setResult(newResult);
          setTaskId(null);
          if (onResultChange) {
            onResultChange(newResult);
          }
        } else if (data.status === 'failed') {
          const errorResult = { status: 'error', error: data.error };
          setResult(errorResult);
          setTaskId(null);
          if (onResultChange) {
            onResultChange(errorResult);
          }
        }
      } catch (error) {
        console.error('Error checking task status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId, onResultChange]);

  const handleTest = () => {
    setResult(null);
    const variablesObject = variables.reduce((acc, curr) => {
      if (curr.key) acc[curr.key] = curr.value;
      return acc;
    }, {});

    testMutation.mutate({ provider, model, variables: variablesObject });
  };

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '' }]);
  };

  const updateVariable = (index, field, value) => {
    const newVars = [...variables];
    newVars[index][field] = value;
    setVariables(newVars);
  };

  const removeVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const parseBulkVariables = (text) => {
    // Parse text in format: KEY=VALUE or KEY: VALUE (one per line)
    // Also handles quoted keys/values: "KEY"="VALUE" or KEY="VALUE WITH SPACES"
    const lines = text.split('\n').filter(line => line.trim());
    const parsed = [];

    const stripQuotes = (str) => {
      str = str.trim();
      // Remove surrounding quotes (single or double)
      if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1);
      }
      return str;
    };

    for (const line of lines) {
      // Try KEY=VALUE format
      let match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        parsed.push({
          key: stripQuotes(match[1]),
          value: stripQuotes(match[2])
        });
        continue;
      }

      // Try KEY: VALUE format
      match = line.match(/^([^:]+):(.*)$/);
      if (match) {
        parsed.push({
          key: stripQuotes(match[1]),
          value: stripQuotes(match[2])
        });
        continue;
      }
    }

    return parsed;
  };

  const handleBulkPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const parsed = parseBulkVariables(text);

    if (parsed.length > 0) {
      // Replace all variables with parsed ones
      setVariables(parsed);
    } else {
      // If parsing failed, just add as normal
      return true;
    }
  };

  return (
    <GlassCard className={styles.container}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={styles.title}>Test Sandbox</h2>
        {result && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-slate-400 hover:text-cyan-400 transition-colors p-2"
            type="button"
          >
            {showConfig ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {showConfig && (
        <div className={styles.configSection}>
          {availableProviders.length === 0 ? (
            <div className={styles.noKeysMessage}>
              <p>No API keys configured. Please add your API keys to start testing.</p>
              <Button
                onClick={() => navigate('/settings')}
                icon={Settings}
                size="sm"
              >
                Configure API Keys
              </Button>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                <div>
                  <label className={styles.label}>Provider</label>
                  <select
                    className={styles.select}
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    {availableProviders.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Model</label>
                  <select
                    className={styles.select}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {provider && PROVIDERS[provider]?.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {variables.length > 0 && (
                <div className={styles.variables} onPaste={handleBulkPaste}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className={styles.variablesTitle}>Variables</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addVariable}
                      type="button"
                    >
                      + Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {variables.map((variable, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Name"
                          value={variable.key}
                          onChange={(e) => updateVariable(index, 'key', e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                        <Input
                          placeholder="Value"
                          value={variable.value}
                          onChange={(e) => updateVariable(index, 'value', e.target.value)}
                          className="flex-[2]"
                        />
                        <button
                          onClick={() => removeVariable(index)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleTest}
                loading={testMutation.isPending || result?.status === 'pending'}
                className="w-full"
                icon={Play}
                type="button"
                disabled={!provider || !model}
              >
                {result?.status === 'pending' ? 'Running...' : 'Run Test'}
              </Button>
            </>
          )}
        </div>
      )}

      {testMutation.isError && (
        <div className={styles.error}>
          {testMutation.error.response?.data?.detail || 'Failed to start test'}
        </div>
      )}

      {showResponseInline && result && result.status === 'success' && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <div className={styles.resultTitle}>
              <CheckCircle size={18} /> Response
            </div>
          </div>

          <pre className={styles.resultContent}>{result.response}</pre>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}><Cpu size={12} className="inline mr-1" /> Tokens</div>
              <div className={styles.metricValue}>{result.tokens}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}><DollarSign size={12} className="inline mr-1" /> Cost</div>
              <div className={styles.metricValue}>${result.cost.toFixed(4)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}><Clock size={12} className="inline mr-1" /> Latency</div>
              <div className={styles.metricValue}>{result.latency_ms}ms</div>
            </div>
          </div>
        </div>
      )}

      {showResponseInline && result && result.status === 'error' && (
        <div className={styles.error}>
          <div className="flex items-center gap-2 mb-2 font-bold">
            <AlertCircle size={18} /> Error
          </div>
          {result.error}
        </div>
      )}
    </GlassCard>
  );
}
