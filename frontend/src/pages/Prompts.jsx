import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Plus, Search, Filter } from 'lucide-react';
import styles from './Prompts.module.css';

export default function Prompts() {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['prompts', search],
        queryFn: () => promptsAPI.list({ search }).then(res => res.data),
    });

    return (
        <Layout>
            <div className={styles.header}>
                <h1 className={styles.title}>Prompt Library</h1>
                <Link to="/prompts/new">
                    <Button icon={Plus}>New Prompt</Button>
                </Link>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Input
                        icon={Search}
                        placeholder="Search prompts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="secondary" icon={Filter}>Filter</Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className={styles.grid}>
                    {data?.results?.map((prompt) => (
                        <Link key={prompt.id} to={`/prompts/${prompt.id}`}>
                            <GlassCard hoverable className={styles.card}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={styles.cardTitle}>{prompt.title}</h3>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">
                                        v{prompt.current_version}
                                    </span>
                                </div>
                                <p className={styles.cardDesc}>
                                    {prompt.description || 'No description provided.'}
                                </p>
                                <div className={styles.cardFooter}>
                                    <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
                                    <div className="flex gap-2">
                                        {prompt.tags?.map(tag => (
                                            <span key={tag} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            )}
        </Layout>
    );
}
