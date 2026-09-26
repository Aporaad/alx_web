import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Ruler, Grid, Share2, Check, ArrowRight, ArrowLeft,
  User, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import LocationMapPicker from '../../components/LocationMapPicker';
import type { CustomerDetails, LocationDetails, BodyDetails, AcquisitionSource } from '../../types/portalTypes';
import toast from 'react-hot-toast';

export default function CustomerOnboardingPage() {
  const { user, saveCustomerDetails } = usePortalAuth();
  const { isRtl } = usePortalTheme();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Privacy Policy
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Step 2: Personal & Location Details (Required)
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<number | ''>(25);
  const [location, setLocation] = useState<LocationDetails>({
    country: 'اليمن',
    governorate: '',
    city: '',
    street: '',
    addressDetails: '',
    lat: null,
    lng: null,
  });

  // Step 3: Body & Fit Measurements (Optional)
  const [bodyDetails, setBodyDetails] = useState<BodyDetails>({
    heightCm: undefined,
    weightKg: undefined,
    coatSize: 'L',
    pantsSize: '32',
    shortsSize: 'L',
    shoeSize: '42',
    preferredColors: ['أسود', 'كحلي', 'أبيض'],
  });

  // Step 4: Product Category Preferences (Optional)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    'ملابس رجالية',
    'أحذية وحقائب',
    'ساعات وإكسسوارات',
  ]);

  // Step 5: Acquisition Source / Referral (Optional)
  const [acquisitionSource, setAcquisitionSource] = useState<AcquisitionSource>({
    joinBy: 'facebook',
    referrerId: '',
    notes: '',
  });

  // Category options
  const categoryOptions = [
    { id: 'ملابس رجالية', icon: '👔', label: 'ملابس رجالية' },
    { id: 'ملابس نسائية', icon: '👗', label: 'ملابس نسائية' },
    { id: 'أحذية وحقائب', icon: '👟', label: 'أحذية وحقائب' },
    { id: 'ساعات وإكسسوارات', icon: '⌚', label: 'ساعات وإكسسوارات' },
    { id: 'إلكترونيات وأجهزة', icon: '📱', label: 'إلكترونيات وأجهزة' },
    { id: 'عطور ومستحضرات', icon: '🧴', label: 'عطور ومستحضرات تجميل' },
    { id: 'مستلزمات رياضية', icon: '🏋️', label: 'مستلزمات رياضية' },
    { id: 'منزل وديكور', icon: '🏠', label: 'منزل ومستلزمات معيشة' },
  ];

  // Color options
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

  // Source options
  const sourceOptions = [
    { id: 'facebook', label: 'منشور / إعلان فيسبوك', desc: 'Facebook' },
    { id: 'instagram', label: 'انستقرام', desc: 'Instagram' },
    { id: 'ad', label: 'إعلان ممول آخر', desc: 'Paid Ad' },
    { id: 'friend', label: 'عبر صديق', desc: 'Friend Referral', requiresId: true, placeholder: 'أدخل المعرف الخاص بالصديق (ID / هاتف)' },
    { id: 'courier', label: 'عبر مندوب توصيل', desc: 'Courier', requiresId: true, placeholder: 'أدخل المعرف الخاص بالمندوب (Courier ID)' },
    { id: 'employee', label: 'عبر موظف بالشركة', desc: 'Employee', requiresId: true, placeholder: 'أدخل المعرف الخاص بالموظف' },
    { id: 'other', label: 'طريقة أخرى', desc: 'Other' },
  ];

  // Step Nav validation
  const canGoNext = () => {
    if (currentStep === 1) return privacyAgreed;
    if (currentStep === 2) {
      return (
        location.country.trim() !== '' &&
        location.governorate.trim() !== '' &&
        location.city.trim() !== '' &&
        location.street.trim() !== '' &&
        location.lat !== null &&
        location.lng !== null
      );
    }
    return true;
  };

  const handleNextStep = () => {
    if (!canGoNext()) {
      if (currentStep === 1) {
        toast.error('يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة');
      } else if (currentStep === 2) {
        toast.error('يرجى تعبئة كافة بيانات العنوان وتثبيت موقعك على الخريطة');
      }
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleCompleteOnboarding();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryToggle = (catId: string) => {
    setPreferredCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleColorToggle = (colorName: string) => {
    const current = bodyDetails.preferredColors || [];
    const updated = current.includes(colorName)
      ? current.filter((c) => c !== colorName)
      : [...current, colorName];
    setBodyDetails({ ...bodyDetails, preferredColors: updated });
  };

  const handleCompleteOnboarding = async () => {
    setSubmitting(true);
    try {
      await saveCustomerDetails({
        privacyPolicyAgreed: privacyAgreed,
        privacyPolicyAgreedAt: Date.now(),
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

      toast.success('تم حفظ تفاصيل حسابك بنجاح! مرحباً بك في ALX Delivery');
      navigate('/portal/customer', { replace: true });
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      toast.error(err.message || 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, title: 'الخصوصية الشروط', icon: <ShieldCheck size={16} />, req: true },
    { num: 2, title: 'العنوان والخريطة', icon: <MapPin size={16} />, req: true },
    { num: 3, title: 'المقاسات والجسم', icon: <Ruler size={16} />, req: false },
    { num: 4, title: 'الفئات المفضلة', icon: <Grid size={16} />, req: false },
    { num: 5, title: 'طريقة التعرف', icon: <Share2 size={16} />, req: false },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-root)',
        color: 'var(--text-primary)',
        padding: '2rem 1rem 4rem 1rem',
        fontFamily: 'Cairo, Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Top Header Card */}
        <div
          className="glass-card animate-scale-in"
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            position: 'relative',
          }}
        >
          <div className="gold-line-top" />
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.12)',
              border: '1.5px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'var(--gold)',
            }}
          >
            <Sparkles size={26} />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.4rem' }}>
            أهلاً بك يا <span style={{ color: 'var(--gold)' }}>{user?.fullName || 'عميلنا العزيز'}</span>!
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto' }}>
            يسعدنا انضمامك إلى منصتنا! يُرجى استكمال التفاصيل أدناه لتخصيص تجربة الشحن والتسوق واقتراح أفضل المنتجات المخصصة لك.
          </p>
        </div>

        {/* Multi-step Stepper Indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            background: 'var(--bg-surface)',
            padding: '0.85rem 1rem',
            borderRadius: '1rem',
            border: '1px solid var(--bg-border)',
            overflowX: 'auto',
            gap: '0.5rem',
          }}
        >
          {stepsHeader.map((st) => {
            const isActive = currentStep === st.num;
            const isDone = currentStep > st.num;
            return (
              <div
                key={st.num}
                onClick={() => isDone && setCurrentStep(st.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isActive || isDone ? 1 : 0.45,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: isDone
                      ? 'var(--gold)'
                      : isActive
                        ? 'rgba(212,175,55,0.2)'
                        : 'var(--bg-input)',
                    border: `1.5px solid ${isActive || isDone ? 'var(--gold)' : 'var(--bg-border)'}`,
                    color: isDone ? '#000' : isActive ? 'var(--gold)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                  }}
                >
                  {isDone ? <Check size={14} /> : st.num}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--gold)' : 'var(--text-secondary)' }}>
                  {st.title} {st.req && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                {st.num < 5 && (
                  <div
                    style={{
                      width: '1rem',
                      height: '2px',
                      background: isDone ? 'var(--gold)' : 'var(--bg-border)',
                      marginInlineStart: '0.25rem',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Privacy Policy & Terms ────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="glass-card animate-scale-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} /> 1. الموافقة على شروط الاستخدام وسياسة الخصوصية (إلزامي)
            </h2>

            <div
              style={{
                background: 'var(--bg-input)',
                padding: '1.25rem',
                borderRadius: '0.85rem',
                border: '1px solid var(--bg-border)',
                maxHeight: '260px',
                overflowY: 'auto',
                fontSize: '0.82rem',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                مرحباً بك في منصة ALX Delivery لخدمات الشحن والتسوق الذكي:
              </p>
              <ul style={{ paddingInlineStart: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>نحن نلتزم بحماية خصوصيتك وبياناتك الشخصية والعنوان بدقة عالية وعدم مشاركتها مع أي أطراف غير مصرح لها.</li>
                <li>تستخدم بيانات الموقع الجغرافي والمقاسات المقترحة لغرض تحسين دقة توصيل الشحنات واقتراح المنتجات المتطابقة مع احتياجاتك.</li>
                <li>يحق للعميل تعديل كافة بياناته ومقاساته الشخصية أو إلغاء حسابه في أي وقت عبر إعدادات الملف الشخصي.</li>
                <li>تضمن المنصة سلامة الشحنات وسرية التعاملات المالية وكشوفات الحساب.</li>
              </ul>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                background: privacyAgreed ? 'rgba(212,175,55,0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${privacyAgreed ? 'var(--gold)' : 'var(--bg-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--gold)' }}
              />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                قرأت وأوافق على كافة الشروط وسياسة الخصوصية الخاصة بـ ALX Delivery
              </span>
            </label>
          </div>
        )}

        {/* ── STEP 2: Personal Info & Precise Map Location ───────────────────── */}
        {currentStep === 2 && (
          <div className="glass-card animate-scale-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} /> 2. التفاصيل الشخصية والموقع الجغرافي بالظبط (أساسي ومهم)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              تأكيد عنوانك بدقة وتحديد مكانك على الخريطة يضمن وصول المندوب والشحنات إليك في الوقت المحدد بدون أي تأخير.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">الجنس <span style={{ color: 'var(--gold)' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: 'male', label: 'ذكر 👨' },
                    { id: 'female', label: 'أنثى 👩' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id as any)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.6rem',
                        background: gender === g.id ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                        border: `1.5px solid ${gender === g.id ? 'var(--gold)' : 'var(--bg-border)'}`,
                        color: gender === g.id ? 'var(--gold)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">العمر <span style={{ color: 'var(--gold)' }}>*</span></label>
                <input
                  type="number"
                  required
                  min={12}
                  max={100}
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="مثال: 25"
                />
              </div>
            </div>

            {/* Map Picker Component */}
            <LocationMapPicker location={location} onChange={setLocation} isRtl={isRtl} />
          </div>
        )}

        {/* ── STEP 3: Body Measurements & Color Preferences (Optional) ─────────── */}
        {currentStep === 3 && (
          <div className="glass-card animate-scale-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ruler size={20} /> 3. تفاصيل الجسم والمقاسات (اختياري)
              </h2>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>
                اختياري
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              نستخدم هذه المقاسات لاقتراح الملابس والأحذية المناسبة لجسدك ومقاسك بدقة أثناء التسوق.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">الطول (سم)</label>
                <input
                  type="number"
                  className="form-input"
                  value={bodyDetails.heightCm || ''}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, heightCm: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="مثال: 175"
                />
              </div>

              <div className="form-group">
                <label className="form-label">الوزن / العرض (كجم)</label>
                <input
                  type="number"
                  className="form-input"
                  value={bodyDetails.weightKg || ''}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, weightKg: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="مثال: 70"
                />
              </div>

              <div className="form-group">
                <label className="form-label">مقاس الكوت / الجاكيت</label>
                <select
                  className="form-input"
                  value={bodyDetails.coatSize || 'L'}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, coatSize: e.target.value })}
                >
                  {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">مقاس البنطال</label>
                <select
                  className="form-input"
                  value={bodyDetails.pantsSize || '32'}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, pantsSize: e.target.value })}
                >
                  {['28', '30', '32', '34', '36', '38', '40', '42'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">مقاس الشورت</label>
                <select
                  className="form-input"
                  value={bodyDetails.shortsSize || 'L'}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, shortsSize: e.target.value })}
                >
                  {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">مقاس الحذاء</label>
                <select
                  className="form-input"
                  value={bodyDetails.shoeSize || '42'}
                  onChange={(e) => setBodyDetails({ ...bodyDetails, shoeSize: e.target.value })}
                >
                  {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Colors Selection */}
            <div className="form-group">
              <label className="form-label">الألوان المفضلة لديك</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {colorOptions.map((c) => {
                  const isSelected = (bodyDetails.preferredColors || []).includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleColorToggle(c.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '2rem',
                        background: isSelected ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                        border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--bg-border)'}`,
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: c.hex,
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                      />
                      {c.name}
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Preferred Product Categories (Optional) ──────────────────── */}
        {currentStep === 4 && (
          <div className="glass-card animate-scale-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Grid size={20} /> 4. فئات المنتجات المفضلة لديك (اختياري)
              </h2>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>
                اختياري
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              حدد الفئات التي تثير اهتمامك لتقديم عروض وخصومات مخصصة لك على لوحة تحكمك.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {categoryOptions.map((cat) => {
                const isSelected = preferredCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '1.25rem 0.85rem',
                      borderRadius: '0.85rem',
                      background: isSelected ? 'rgba(212,175,55,0.1)' : 'var(--bg-input)',
                      border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--bg-border)'}`,
                      color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{cat.label}</span>
                    {isSelected && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={12} /> تم التحديد
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 5: Acquisition Source & Referral ID (Optional) ──────────────── */}
        {currentStep === 5 && (
          <div className="glass-card animate-scale-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} /> 5. كيف تعرفت علينا؟
              </h2>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>
                اختياري
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              ساعدنا في معرفة كيفية وصولك إلينا، وإذا سجلت عبر توصية صديق أو مندوب يمكنك إدخال معرفه للحصول على المكافآت.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {sourceOptions.map((opt) => {
                const isSelected = acquisitionSource.joinBy === opt.id;
                return (
                  <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAcquisitionSource({ ...acquisitionSource, joinBy: opt.id })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderRadius: '0.75rem',
                        background: isSelected ? 'rgba(212,175,55,0.1)' : 'var(--bg-input)',
                        border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--bg-border)'}`,
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        textAlign: 'start',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '1rem',
                            height: '1rem',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--text-muted)'}`,
                            background: isSelected ? 'var(--gold)' : 'transparent',
                          }}
                        />
                        <span>{opt.label}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                    </button>

                    {/* Referrer ID Input if required */}
                    {isSelected && opt.requiresId && (
                      <div className="form-group animate-scale-in" style={{ paddingInlineStart: '1.5rem' }}>
                        <label className="form-label" style={{ color: 'var(--gold)', fontSize: '0.78rem' }}>
                          المعرف الخاص بالموصي (Referrer ID)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={acquisitionSource.referrerId || ''}
                          onChange={(e) => setAcquisitionSource({ ...acquisitionSource, referrerId: e.target.value })}
                          placeholder={opt.placeholder}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={submitting}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              السابق
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStep}
            disabled={submitting}
            className="btn btn-gold btn-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', paddingInline: '2rem' }}
          >
            {submitting ? (
              <div className="spinner" />
            ) : currentStep === 5 ? (
              <>
                <CheckCircle2 size={18} /> إكمال وإنهاء الإعداد
              </>
            ) : (
              <>
                التالي
                {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
