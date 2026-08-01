import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const { tr, isRtl } = usePortalTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      if (error) throw error;
      setSent(true);
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
      padding: '2rem 1.25rem'
    }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 420, padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div className="gold-line-top" />

        <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 600 }}>
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          {tr('login')}
        </Link>

        {sent ? (
          <div>
            <CheckCircle2 size={48} style={{ color: '#34d399', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {isRtl ? 'تم إرسال رابط التعيين' : 'Reset Link Sent'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {isRtl
                ? `تم إرسال تعليمات إعادة تعيين كلمة المرور إلى ${email}`
                : `Password reset instructions sent to ${email}`}
            </p>
            <Link to="/auth/login" className="btn btn-gold btn-full">{tr('login')}</Link>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>{tr('forgotPassword')}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {isRtl ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور' : 'Enter your email and we will send a reset link'}
            </p>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <div className="form-input-icon-wrapper">
                  <Mail className="form-input-icon" />
                  <input type="email" required className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-gold btn-full btn-lg">
                {loading ? <div className="spinner" /> : null}
                {isRtl ? 'إرسال رابط التعيين' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
