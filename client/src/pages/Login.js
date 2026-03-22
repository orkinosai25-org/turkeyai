import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google', icon: 'G', bg: '#4285F4', color: 'white' },
  { id: 'facebook', label: 'Facebook', icon: 'f', bg: '#1877F2', color: 'white' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', bg: '#0A66C2', color: 'white' },
];

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const inputStyle = {
    width: '100%', padding: '0.75rem 0.9rem', border: '1.5px solid var(--warm-sand)',
    borderRadius: '8px', fontSize: '0.9rem', outline: 'none',
    background: 'white', transition: 'border 0.2s',
  };

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('turkiyeai_token', res.data.token);
      localStorage.setItem('turkiyeai_user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider) {
    setError('');
    setLoading(true);
    try {
      // In production: trigger OAuth flow (e.g., window.location.href = `/api/auth/${provider}/oauth`)
      // For demo/development, show a friendly message.
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login requires OAuth configuration. Please use email login or create an account.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', padding: '2rem', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🇹🇷</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Welcome Back</h1>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Sign in to TurkiyAI Holidays</p>
        </div>

        <div style={{ padding: '2rem' }}>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#c53030', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Forgot Password Mode ── */}
          {forgotMode ? (
            <>
              <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Reset Password</h2>
              <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Enter your email address and we'll send you a reset link.
              </p>

              {forgotSuccess ? (
                <div style={{ background: '#f0fff4', border: '1px solid #68d391', borderRadius: '8px', padding: '1rem', color: '#276749', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  ✅ {forgotSuccess}
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--warm-slate-700)' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      style={inputStyle}
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.85rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {loading ? '⏳ Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setForgotMode(false); setForgotSuccess(''); setError(''); }}
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.7rem', background: 'transparent', color: 'var(--aegean-blue)', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
              >
                ← Back to Login
              </button>
            </>
          ) : (
            /* ── Login Mode ── */
            <>
              {/* Social Login */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {SOCIAL_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    disabled={loading}
                    onClick={() => handleSocial(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #ddd',
                      cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                      background: 'white', color: 'var(--warm-charcoal)', width: '100%',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f8f8f8'; e.currentTarget.style.borderColor = p.bg; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ddd'; }}
                  >
                    <span style={{ width: 28, height: 28, borderRadius: '4px', background: p.bg, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{p.icon}</span>
                    Continue with {p.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--warm-sand)' }} />
                <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>or sign in with email</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--warm-sand)' }} />
              </div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--warm-slate-700)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    style={inputStyle}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--warm-slate-700)' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--aegean-blue)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: '3rem' }}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-slate-500)', padding: 0 }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '0.85rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer', marginTop: '0.5rem' }}
                >
                  {loading ? '⏳ Signing in...' : '🔐 Sign In'}
                </button>
              </form>
            </>
          )}

          {/* Register link */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--warm-slate-500)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--aegean-blue)', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
