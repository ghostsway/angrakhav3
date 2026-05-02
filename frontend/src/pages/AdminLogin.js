import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, checkAuth, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && user.is_admin) {
      navigate('/admin');
    }
  }, [user, authLoading, navigate]);

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/api/admin/login`,
        { username, password },
        { withCredentials: true }
      );
      toast.success('Admin login successful');
      await checkAuth();
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center pt-16">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-light text-foreground mb-2">Admin Access</h1>
          <p className="text-sm font-sans text-muted-foreground">Sign in to manage the store</p>
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-brand-surface px-2 text-muted-foreground text-xs uppercase tracking-widest">
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="w-full border border-brand-border text-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:border-primary transition-all disabled:opacity-50"
        >
          Google Sign-In
        </button>
      </div>
    </div>
  );
}
