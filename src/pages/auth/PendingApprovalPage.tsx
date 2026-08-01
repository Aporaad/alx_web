import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';

export default function PendingApprovalPage() {
  const { user, refreshUser, logout } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshUser();
      if (user?.approvalStatus === 'approved') {
        const dest = user.portalRole === 'courier' ? '/portal/courier' : '/portal/supplier';
        navigate(dest);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-root)',
      padding: '2rem 1.25rem',
      textAlign: 'center'
    }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 480, padding: '3rem 2rem', position: 'relative' }}>
        <div className="gold-line-top" />

        {/* Icon */}
        <div style={{
          width: 72, height: 72,
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#fbbf24'
        }}>
          <Clock size={36} className="animate-pulse" />
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          {tr('pendingTitle')}
        </h1>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
          {tr('pendingMsg')}
        </p>

        {/* User Badge */}
        <div className="section-card" style={{ marginBottom: '2rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={18} style={{ color: '#fbbf24' }} />
          <div style={{ textAlign: 'start' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email} • ({user?.portalRole === 'courier' ? tr('courier') : tr('supplier')})</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn btn-gold btn-full btn-lg" onClick={handleRefresh} disabled={checking}>
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {tr('checkStatus')}
          </button>
          <button className="btn btn-ghost btn-full" onClick={handleLogout}>
            <LogOut size={16} />
            {tr('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
