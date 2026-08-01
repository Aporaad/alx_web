import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';

export default function LoginPage() {
  const { login } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setLoading(true);
    setError('');

    try {
      await login(identifier, password);
      // Navigation is handled inside Auth context or App.tsx based on role
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || tr('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-root)',
      padding: '2rem 1.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ambient Glows */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 440, padding: '2.5rem 2rem', position: 'relative' }}>
        <div className="gold-line-top" />

        {/* Back Link */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 600 }}>
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          {tr('home')}
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.02))',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem'
          }}>
            📦
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {tr('login')}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'مرحباً بك مجدداً في بوابة الخدمات الموحدة' : 'Welcome back to the client services portal'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">{tr('emailOrPhone')}</label>
            <div className="form-input-icon-wrapper">
              <Mail className="form-input-icon" />
              <input
                type="text"
                required
                className="form-input"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={isRtl ? 'البريد أو رقم الهاتف...' : 'Email or phone...'}
                dir="ltr"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">{tr('password')}</label>
              <Link to="/auth/forgot-password" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                {tr('forgotPassword')}
              </Link>
            </div>
            <div className="form-input-icon-wrapper" style={{ position: 'relative' }}>
              <Lock className="form-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{ paddingInlineEnd: '2.5rem' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  insetInlineEnd: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-gold btn-full btn-lg" style={{ marginTop: '0.5rem' }}>
            {loading ? <div className="spinner" /> : <LogIn size={16} />}
            {tr('login')}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bg-border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {tr('noAccount')}{' '}
          <Link to="/auth/register" style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'none', marginInlineStart: '0.3rem' }}>
            {tr('register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
