import React, { useState, useEffect } from 'react';
import { User, Lock, Globe, Sun, Moon, Check, Save, MapPin, Ruler, Grid, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import LocationMapPicker from '../../components/LocationMapPicker';
import type { LocationDetails, BodyDetails, AcquisitionSource } from '../../types/portalTypes';
import toast from 'react-hot-toast';

type ProfileTab = 'personal' | 'about' | 'security';

export default function ProfilePage() {
  const { user, customerDetails, updateProfile, saveCustomerDetails, changePassword } = usePortalAuth();
  const { tr, theme, lang, toggleTheme, toggleLang, isRtl } = usePortalTheme();

  const isCustomer = user?.portalRole === 'customer';
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  // Basic Info state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  // Customer Details states
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(customerDetails?.gender || 'male');
  const [age, setAge] = useState<number | ''>(customerDetails?.age || 25);
  const [location, setLocation] = useState<LocationDetails>(customerDetails?.location || {
    country: 'اليمن',
    governorate: '',
    city: '',
    street: '',
    addressDetails: '',
    lat: null,
    lng: null,
  });

  const [bodyDetails, setBodyDetails] = useState<BodyDetails>(customerDetails?.bodyDetails || {
    heightCm: undefined,
    weightKg: undefined,
    coatSize: 'L',
    pantsSize: '32',
    shortsSize: 'L',
    shoeSize: '42',
    preferredColors: ['أسود', 'كحلي', 'أبيض'],
  });

  const [preferredCategories, setPreferredCategories] = useState<string[]>(
    customerDetails?.preferredCategories || ['ملابس رجالية', 'أحذية وحقائب']
  );

  const [acquisitionSource, setAcquisitionSource] = useState<AcquisitionSource>(
    customerDetails?.acquisitionSource || {
      joinBy: user?.joinBy || 'facebook',
      referrerId: user?.referrerId || '',
      notes: '',
    }
  );

  // Sync state when customerDetails updates
  useEffect(() => {
    if (customerDetails) {
      if (customerDetails.gender) setGender(customerDetails.gender);
      if (customerDetails.age) setAge(customerDetails.age);
      if (customerDetails.location) setLocation(customerDetails.location);
      if (customerDetails.bodyDetails) setBodyDetails(customerDetails.bodyDetails);
      if (customerDetails.preferredCategories) setPreferredCategories(customerDetails.preferredCategories);
      if (customerDetails.acquisitionSource) setAcquisitionSource(customerDetails.acquisitionSource);
    }
  }, [customerDetails]);

  // Security state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [custDetailsSaving, setCustDetailsSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  // Colors & Categories options
  const colorOptions = [
    { name: 'أسود', hex: '#000000' },
    { name: 'أبيض', hex: '#ffffff' },
    { name: 'كحلي', hex: '#1e3a8a' },
    { name: 'رمادي', hex: '#64748b' },
    { name: 'زيتي', hex: '#3f6212' },
    { name: 'بيج', hex: '#d97706' },
    { name: 'نبيذي', hex: '#881337' },
    { name: 'بني', hex: '#78350f' },
    { name: 'أزرق', hex: '#2563eb' },
  ];

  const categoryOptions = [
    { id: 'ملابس رجالية', icon: '👔', label: 'ملابس رجالية' },
    { id: 'ملابس نسائية', icon: '👗', label: 'ملابس نسائية' },
    { id: 'أحذية وحقائب', icon: '👟', label: 'أحذية وحقائب' },
    { id: 'ساعات وإكسسوارات', icon: '⌚', label: 'ساعات وإكسسوارات' },
    { id: 'إلكترونيات وأجهزة', icon: '📱', label: 'إلكترونيات وأجهزة' },
    { id: 'عطور ومستحضرات', icon: '🧴', label: 'عطور ومستحضرات' },
    { id: 'مستلزمات رياضية', icon: '🏋️', label: 'مستلزمات رياضية' },
    { id: 'منزل وديكور', icon: '🏠', label: 'منزل وديكور' },
  ];

  const sourceOptions = [
    { id: 'facebook', label: 'منشور / إعلان فيسبوك' },
    { id: 'instagram', label: 'انستقرام' },
    { id: 'ad', label: 'إعلان ممول آخر' },
    { id: 'friend', label: 'عبر صديق', requiresId: true, placeholder: 'معرف الصديق (Referrer ID)' },
    { id: 'courier', label: 'عبر مندوب توصيل', requiresId: true, placeholder: 'معرف المندوب (Courier ID)' },
    { id: 'employee', label: 'عبر موظف بالشركة', requiresId: true, placeholder: 'معرف الموظف' },
    { id: 'other', label: 'طريقة أخرى' },
  ];

  const handleSaveBasicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({ fullName, phone, address });
      toast.success(tr('savedSuccessfully'));
    } catch (err: any) {
      toast.error(err.message || tr('error'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustDetailsSaving(true);
    try {
      await saveCustomerDetails({
        privacyPolicyAgreed: true,
        gender,
        age: typeof age === 'number' ? age : undefined,
        location,
        bodyDetails,
        preferredCategories,
        acquisitionSource,
        joinBy: acquisitionSource.joinBy,
        referrerId: acquisitionSource.referrerId,
        onboardingCompleted: true,
      });

      // Sync address text with basic profile if modified
      if (location.city || location.street) {
        const fullAddrStr = [location.country, location.governorate, location.city, location.street, location.addressDetails].filter(Boolean).join(' - ');
        await updateProfile({ address: fullAddrStr });
        setAddress(fullAddrStr);
      }

      toast.success('تم تحديث جميع تفاصيل العميل والموقع والمقاسات بنجاح!');
    } catch (err: any) {
      toast.error(err.message || tr('error'));
    } finally {
      setCustDetailsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error(tr('passwordsNotMatch'));
      return;
    }
    if (newPwd.length < 8) {
      toast.error(tr('passwordTooShort'));
      return;
    }

    setPwdSaving(true);
    try {
      await changePassword(currentPwd, newPwd);
      toast.success(tr('savedSuccessfully'));
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      toast.error(err.message || tr('error'));
    } finally {
      setPwdSaving(false);
    }
  };

  const handleCategoryToggle = (catId: string) => {
    setPreferredCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleColorToggle = (colorName: string) => {
    const current = bodyDetails.preferredColors || [];
    const updated = current.includes(colorName)
      ? current.filter(c => c !== colorName)
      : [...current, colorName];
    setBodyDetails({ ...bodyDetails, preferredColors: updated });
  };

  const tabsConfig = [
    {
      id: 'personal' as ProfileTab,
      label: isRtl ? '1. المعلومات الشخصية والمظهر' : '1. Personal Info & Theme',
      icon: <User size={18} />,
    },
    {
      id: 'about' as ProfileTab,
      label: isRtl ? '2. تفاصيل عني (العنوان والجسم والمنتجات)' : '2. About Me (Address, Fit & Preferences)',
      icon: <Sparkles size={18} />,
    },
    {
      id: 'security' as ProfileTab,
      label: isRtl ? '3. إعدادات الأمان' : '3. Security Settings',
      icon: <Lock size={18} />,
    },
  ];

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>{tr('profile')}</h1>
        <p>{isRtl ? 'إدارة بياناتك الشخصية، الخريطة والموقع، المقاسات المفضلة، والأمان' : 'Manage personal info, location map, preferences, and security'}</p>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          padding: '0.6rem',
          borderRadius: '1rem',
          border: '1px solid var(--bg-border)',
        }}
      >
        {tabsConfig.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                background: isActive ? 'rgba(212,175,55,0.15)' : 'var(--bg-input)',
                border: `1.5px solid ${isActive ? 'var(--gold)' : 'var(--bg-border)'}`,
                color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: المعلومات الشخصية واعدادات المظهر واللغة ───────────────────── */}
      {activeTab === 'personal' && (
        <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Info Form */}
          <form onSubmit={handleSaveBasicProfile} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
            <div className="gold-line-top" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

          {/* UI Theme & Language Settings */}
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
                <button type="button" className="btn btn-ghost" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>

              <div className="section-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tr('language')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'ar' ? tr('arabic') : tr('english')}</div>
                </div>
                <button type="button" className="btn btn-ghost" onClick={toggleLang}>
                  <Globe size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: تفاصيل عني (العنوان والجسم والألوان والمنتجات) ─────────────── */}
      {activeTab === 'about' && (
        <div className="animate-scale-in">
          {isCustomer ? (
            <form onSubmit={handleSaveCustomerDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Location & Interactive Map Picker Card */}
              <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                <div className="gold-line-top" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} /> تفاصيل العنوان والموقع الجغرافي بالظبط (الخريطة)
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">الجنس</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {[
                        { id: 'male', label: 'ذكر 👨' },
                        { id: 'female', label: 'أنثى 👩' },
                      ].map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGender(g.id as any)}
                          style={{
                            padding: '0.6rem',
                            borderRadius: '0.5rem',
                            background: gender === g.id ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                            border: `1.5px solid ${gender === g.id ? 'var(--gold)' : 'var(--bg-border)'}`,
                            color: gender === g.id ? 'var(--gold)' : 'var(--text-secondary)',
                            fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                          }}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">العمر</label>
                    <input
                      type="number"
                      className="form-input"
                      value={age}
                      onChange={e => setAge(e.target.value ? parseInt(e.target.value) : '')}
                    />
                  </div>
                </div>

                {/* Interactive Leaflet Location Map Picker */}
                <LocationMapPicker location={location} onChange={setLocation} isRtl={isRtl} />
              </div>

              {/* Body Measurements & Fit Card */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Ruler size={18} /> تفاصيل الجسم والمقاسات والألوان المفضلة
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">الطول (سم)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={bodyDetails.heightCm || ''}
                      onChange={e => setBodyDetails({ ...bodyDetails, heightCm: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="175"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">الوزن / العرض (كجم)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={bodyDetails.weightKg || ''}
                      onChange={e => setBodyDetails({ ...bodyDetails, weightKg: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="70"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">مقاس الكوت / الجاكيت</label>
                    <select className="form-input" value={bodyDetails.coatSize || 'L'} onChange={e => setBodyDetails({ ...bodyDetails, coatSize: e.target.value })}>
                      {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">مقاس البنطال</label>
                    <select className="form-input" value={bodyDetails.pantsSize || '32'} onChange={e => setBodyDetails({ ...bodyDetails, pantsSize: e.target.value })}>
                      {['28', '30', '32', '34', '36', '38', '40', '42'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">مقاس الشورت</label>
                    <select className="form-input" value={bodyDetails.shortsSize || 'L'} onChange={e => setBodyDetails({ ...bodyDetails, shortsSize: e.target.value })}>
                      {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">مقاس الحذاء</label>
                    <select className="form-input" value={bodyDetails.shoeSize || '42'} onChange={e => setBodyDetails({ ...bodyDetails, shoeSize: e.target.value })}>
                      {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Colors */}
                <div className="form-group">
                  <label className="form-label">الألوان المفضلة لديك</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {colorOptions.map(c => {
                      const isSelected = (bodyDetails.preferredColors || []).includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleColorToggle(c.name)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.4rem 0.75rem', borderRadius: '1.5rem',
                            background: isSelected ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                            border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--bg-border)'}`,
                            color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(255,255,255,0.3)' }} />
                          {c.name}
                          {isSelected && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Categories & Acquisition Source Card */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Grid size={18} /> فئات المنتجات المفضلة وطريقة التسجيل
                </h2>

                {/* Category Cards */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>اختر فئات المنتجات التي تهتم بها:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                    {categoryOptions.map(cat => {
                      const isSelected = preferredCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryToggle(cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 0.85rem', borderRadius: '0.6rem',
                            background: isSelected ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                            border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--bg-border)'}`,
                            color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textAlign: 'start'
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Acquisition Source & Referral ID (Disabled fields) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">تسجيل بواسطة</label>
                    <select
                      className="form-input"
                      value={acquisitionSource.joinBy}
                      onChange={e => setAcquisitionSource({ ...acquisitionSource, joinBy: e.target.value })}
                      disabled={true}
                    >
                      {sourceOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">معرف الشخص المُوصِي</label>
                    <input
                      type="text"
                      className="form-input"
                      value={acquisitionSource.referrerId || ''}
                      onChange={e => setAcquisitionSource({ ...acquisitionSource, referrerId: e.target.value })}
                      placeholder="ID الشخص أو المندوب أو الموظف"
                      disabled={true}
                    />
                  </div>
                </div>

                <button type="submit" disabled={custDetailsSaving} className="btn btn-gold" style={{ marginTop: '1.25rem' }}>
                  {custDetailsSaving ? <div className="spinner" /> : <Save size={16} />}
                  حفظ وتحديث تفاصيل العميل بالكامل
                </button>
              </div>
            </form>
          ) : (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <Sparkles size={32} style={{ color: 'var(--gold)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>تفاصيل العميل المخصصة</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                قسم "تفاصيل عني" مخصص للحسابات من نوع عميل لإدارة الموقع والمقاسات المفضلة.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: إعدادات الأمان ────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="glass-card animate-scale-in" style={{ padding: '1.5rem', position: 'relative' }}>
          <div className="gold-line-top" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
      )}
    </div>
  );
}
