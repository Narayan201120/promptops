import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Mail, Lock, Building, UserPlus } from 'lucide-react';
import styles from './Register.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    organization_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <GlassCard className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logo}>P</div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Get started with PromptOps</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            icon={User}
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <Input
            icon={Mail}
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className={styles.row}>
            <Input
              placeholder="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="flex-1"
            />
            <Input
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="flex-1"
            />
          </div>

          <Input
            icon={Building}
            placeholder="Organization Name"
            value={formData.organization_name}
            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            icon={UserPlus}
          >
            Register
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account?
          <Link to="/login" className={styles.link}>Sign in</Link>
        </div>
      </GlassCard>
    </div>
  );
}
