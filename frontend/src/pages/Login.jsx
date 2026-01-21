import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Lock, LogIn } from 'lucide-react';
import styles from './Login.module.css';

function LoginContent() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(credentials);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await api.post('/auth/google/', {
        token: credentialResponse.credential
      });

      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);

      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Google login failed:', error);
      setError(error.response?.data?.error || 'Google login failed');
    }
  };

  return (
    <div className={styles.container}>
      <GlassCard className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logo}>P</div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to PromptOps</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            icon={User}
            placeholder="Username or Email"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            required
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            icon={LogIn}
          >
            Sign In
          </Button>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className={styles.divider}>
                <span className={styles.dividerText}>Or continue with</span>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  width="350"
                />
              </div>
            </>
          )}
        </form>

        <div className={styles.footer}>
          Don't have an account?
          <Link to="/register" className={styles.link}>Register</Link>
        </div>
      </GlassCard>
    </div>
  );
}

export default function Login() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
