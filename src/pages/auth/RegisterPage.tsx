import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Truck, Factory, UserCheck, ArrowLeft, ArrowRight, ShieldAlert, MapPin, FileText } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import type { PortalRole, RegisterFormData } from '../../types/portalTypes';

export default function RegisterPage() {
  const { register } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();
  const navigate = useNavigate();

  // Common fields
  const [role, setRole] = useState<PortalRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');

  // Courier-specific
  const [courierType, setCourierType] = useState<'local' | 'sourcing'>('local');
  const [identityDocNote, setIdentityDocNote] = useState('');

  // Supplier-specific
  const [companyName, setCompanyName] = useState('');
  const [commercialRegister, setCommercialRegister] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setError(tr('required'));
      return;
    }
    if (password !== confirmPassword) {
      setError(tr('passwordsNotMatch'));
      return;
    }
    if (password.length < 8) {
      setError(tr('passwordTooShort'));
      return;
    }

    setLoading(true);
    setError('');

    const formData: RegisterFormData = {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      portalRole: role,
      address,
      // Courier
      courierType:       role === 'courier' ? courierType : undefined,
      identityDocNote:   role === 'courier' ? identityDocNote : undefined,
      // Supplier
      companyName:       role === 'supplier' ? companyName : undefined,
      commercialRegister: role === 'supplier' ? commercialRegister : undefined,
    };

    try {
      const res = await register(formData);
      if (res.pendingApproval) {
        navigate('/auth/pending');
      } else {
        navigate('/portal/customer');
      }
    } catch (err: any) {
      setError(err.message || tr('error'));
    } finally {
      setLoading(false);
    }
  };

  // Role card config
  const roleCards = [
    { id: 'customer', label: tr('customer'), icon: <User size={18} />, color: 'var(--gold)' },
    { id: 'courier',  label: tr('courier'),  icon: <Truck size={18} />, color: '#34d399' },
    { id: 'supplier', label: tr('supplier'), icon: <Factory size={18} />, color: '#a78bfa' },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-root)',
      padding: '2.5rem 1.25rem',
    }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 580, padding: '2.5rem 2rem', position: 'relative' }}>
        <div className="gold-line-top" />

        {/* Back Link */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 600 }}>
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          {tr('home')}
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            {tr('register')}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'أنشئ حسابك الجديد للانضمام إلى منصتنا' : 'Create your new account to join our platform'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Role Selection ─────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">{tr('iAm')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {roleCards.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id as PortalRole)}
                  id={`role-${item.id}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: '0.75rem',
                    background: role === item.id ? 'rgba(212,175,55,0.08)' : 'var(--bg-input)',
                    border: `1.5px solid ${role === item.id ? item.color : 'var(--bg-border)'}`,
                    color: role === item.id ? item.color : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {item.icon}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Approval notice for non-customer roles */}
            {role !== 'customer' && (
              <div className="alert alert-warning" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                <span>
                  {isRtl
                    ? 'تنبيه: حساب المناديب والموردين يتطلب مراجعة وموافقة إدارة الشركة قبل التفعيل.'
                    : 'Notice: Courier and Supplier accounts require admin approval before activation.'}
                </span>
              </div>
            )}
          </div>

          {/* ── Basic Fields ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{tr('fullName')}</label>
              <input
                id="reg-fullName"
                type="text" required className="form-input"
                value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder={isRtl ? 'الاسم الكامل...' : 'Full Name...'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{tr('phone')}</label>
              <input
                id="reg-phone"
                type="tel" required className="form-input"
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="05XXXXXXXX" dir="ltr"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{tr('email')}</label>
            <input
              id="reg-email"
              type="email" required className="form-input"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com" dir="ltr"
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} />
              {tr('address')}
            </label>
            <input
              id="reg-address"
              type="text" className="form-input"
              value={address} onChange={e => setAddress(e.target.value)}
              placeholder={isRtl ? 'المدينة / الحي / الشارع...' : 'City / District / Street...'}
            />
          </div>

          {/* ── Courier-specific fields ──────────────────────────────────── */}
          {role === 'courier' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'نوع مهام التوصيل' : 'Delivery Task Type'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: 'local',    label: isRtl ? 'توصيل محلي' : 'Local Delivery' },
                    { id: 'sourcing', label: isRtl ? 'توريد / استلام' : 'Sourcing / Pickup' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      id={`courierType-${opt.id}`}
                      onClick={() => setCourierType(opt.id as 'local' | 'sourcing')}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '0.6rem',
                        background: courierType === opt.id ? 'rgba(52,211,153,0.1)' : 'var(--bg-input)',
                        border: `1px solid ${courierType === opt.id ? '#34d399' : 'var(--bg-border)'}`,
                        color: courierType === opt.id ? '#34d399' : 'var(--text-secondary)',
                        fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={12} />
                  {isRtl ? 'بيانات الهوية الوطنية (اختياري)' : 'ID Document Info (optional)'}
                </label>
                <input
                  id="reg-identityDocNote"
                  type="text" className="form-input"
                  value={identityDocNote} onChange={e => setIdentityDocNote(e.target.value)}
                  placeholder={isRtl ? 'رقم الهوية: 123456789...' : 'ID Number: 123456789...'}
                  dir="ltr"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  {isRtl ? 'يمكنك رفع صورة الهوية لاحقاً من صفحة الملف الشخصي.' : 'You can upload your ID photo later from your profile.'}
                </span>
              </div>
            </div>
          )}

          {/* ── Supplier-specific fields ─────────────────────────────────── */}
          {role === 'supplier' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'اسم المصنع / الشركة' : 'Company / Factory Name'}</label>
                <input
                  id="reg-companyName"
                  type="text" className="form-input"
                  value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder={isRtl ? 'شركة التوريد المتقدم...' : 'Advanced Supply Co.'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{isRtl ? 'رقم السجل التجاري' : 'Commercial Reg #'}</label>
                <input
                  id="reg-commercialRegister"
                  type="text" className="form-input"
                  value={commercialRegister} onChange={e => setCommercialRegister(e.target.value)}
                  placeholder="1010XXXXXX" dir="ltr"
                />
              </div>
            </div>
          )}

          {/* ── Passwords ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{tr('password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required className="form-input"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" dir="ltr"
                  style={{ paddingInlineEnd: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', insetInlineEnd: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Lock size={14} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{tr('confirmPassword')}</label>
              <input
                id="reg-confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required className="form-input"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-register-submit"
            disabled={loading}
            className="btn btn-gold btn-full btn-lg"
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? <div className="spinner" /> : <UserCheck size={16} />}
            {tr('register')}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bg-border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {tr('haveAccount')}{' '}
          <Link to="/auth/login" style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'none', marginInlineStart: '0.3rem' }}>
            {tr('login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
