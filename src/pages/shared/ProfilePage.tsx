import React, { useState } from 'react';
import { User, Lock, Globe, Sun, Moon, Check, Save } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = usePortalAuth();
  const { tr, theme, lang, toggleTheme, toggleLang, isRtl } = usePortalTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ fullName, phone, address });
      setMessage(tr('savedSuccessfully'));
    } catch (err: any) {
      setError(err.message || tr('error'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setError(tr('passwordsNotMatch'));
      return;
    }
    if (newPwd.length < 8) {
      setError(tr('passwordTooShort'));
      return;
    }

    setPwdSaving(true);
    setMessage('');
    setError('');
    try {
      await changePassword(currentPwd, newPwd);
      setMessage(tr('savedSuccessfully'));
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      setError(err.message || tr('error'));
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <h1>{tr('profile')}</h1>
        <p>{isRtl ? 'إدارة معلوماتك الشخصية، إعدادات الأمان، والمظهر' : 'Manage personal info, security settings, and appearance'}</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Personal Info Card */}
      <form onSubmit={handleSaveProfile} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
        <div className="gold-line-top" />
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} /> {tr('personalInfo')}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">{tr('fullName')}</label>
            <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{tr('phone')}</label>
            <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">{tr('address')}</label>
            <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={profileSaving} className="btn btn-gold">
          {profileSaving ? <div className="spinner" /> : <Save size={16} />}
          {tr('saveChanges')}
        </button>
      </form>

      {/* Security & Password Card */}
      <form onSubmit={handleChangePassword} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} /> {tr('securitySettings')}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">{tr('currentPassword')}</label>
            <input type="password" required className="form-input" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">{tr('newPassword')}</label>
            <input type="password" required className="form-input" value={newPwd} onChange={e => setNewPwd(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">{tr('confirmPassword')}</label>
            <input type="password" required className="form-input" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} dir="ltr" />
          </div>
        </div>

        <button type="submit" disabled={pwdSaving} className="btn btn-gold">
          {pwdSaving ? <div className="spinner" /> : <Lock size={16} />}
          {tr('changePassword')}
        </button>
      </form>

      {/* UI Controls Card */}
      <div className="section-card">
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sun size={18} /> {tr('uiSettings')}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="section-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tr('theme')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{theme === 'dark' ? tr('darkMode') : tr('lightMode')}</div>
            </div>
            <button className="btn btn-ghost" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="section-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tr('language')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? tr('arabic') : tr('english')}</div>
            </div>
            <button className="btn btn-ghost" onClick={toggleLang}>
              <Globe size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
