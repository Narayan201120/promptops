import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Save, X } from 'lucide-react';
import styles from './PromptNew.module.css';

export default function PromptNew() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => promptsAPI.create(data),
    onSuccess: (response) => {
      navigate(`/prompts/${response.data.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Prompt</h1>
          <Button
            variant="ghost"
            onClick={() => navigate('/prompts')}
            icon={X}
          >
            Cancel
          </Button>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Title"
              placeholder="e.g., Customer Support Bot"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Input
              label="Description"
              placeholder="Briefly describe what this prompt does..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className={styles.editorContainer}>
              <label className={styles.label}>Content</label>
              <textarea
                className={styles.editor}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your prompt here... Use {{variable}} for dynamic values."
                spellCheck={false}
              />
            </div>

            {createMutation.isError && (
              <div className={styles.error}>
                {createMutation.error.response?.data?.detail || 'Failed to create prompt'}
              </div>
            )}

            <div className={styles.actions}>
              <Button
                type="submit"
                loading={createMutation.isPending}
                icon={Save}
              >
                Create Prompt
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </Layout>
  );
}
