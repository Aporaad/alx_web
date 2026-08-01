import React, { useState } from 'react';
import { Briefcase, X, CheckCircle2, User, Phone, Mail, MapPin, Award, Clock, FileText, Send, AlertCircle } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { insertDoc } from '../../lib/supabase';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobApplicationModal({ isOpen, onClose }: JobApplicationModalProps) {
  const { isRtl } = usePortalTheme();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    jobPosition: 'local_courier',
    qualification: 'Bachelor',
    experienceYears: 1,
    idNumber: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.city.trim()) {
      setErrorMsg(isRtl ? 'يرجى تعبئة الحقول الأساسية المطلوب الاحتفاظ بها' : 'Please fill required fields');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const now = Date.now();
      const RND = Math.floor(1000 + Math.random() * 9000);
      const jobId = `job_${now}_${RND}`;
      const refCode = `JOB-${new Date().getFullYear()}-${RND}`;

      const payload = {
        id: jobId,
        refCode,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        jobPosition: formData.jobPosition,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears) || 0,
        idNumber: formData.idNumber.trim(),
        notes: formData.notes.trim(),
        status: 'pending_review',
        createdAt: now,
        updatedAt: now,
      };

      await insertDoc('jobs_req', jobId, payload);

      setSuccessMsg(refCode);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        jobPosition: 'local_courier',
        qualification: 'Bachelor',
        experienceYears: 1,
        idNumber: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('[JobApplicationModal] Error submitting job request:', err);
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء تقديم الطلب، يرجى المحاولة لاحقاً' : 'Error submitting application'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'} style={{ zIndex: 100 }}>
      <div className="modal-box animate-scale-in" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="gold-line-top" />
        <div style={{ padding: '1.5rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '0.6rem',
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)'
              }}>
                <Briefcase size={20} />
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                  {isRtl ? 'طلب تقديم على وظيفة' : 'Job Application Form'}
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {isRtl ? 'انضم إلى فريق ALX Delivery — لا يتطلب تسجيل الدخول' : 'Join ALX Delivery team — No login required'}
                </p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Success screen */}
          {successMsg ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <CheckCircle2 size={54} style={{ color: '#34d399', margin: '0 auto 1rem' }} />
              <h4 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isRtl ? 'تم تقديم طلب التوظيف بنجاح!' : 'Application Submitted Successfully!'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {isRtl ? 'شغفكم محل تقديرنا. سيقوم فريق الموارد البشرية بمراجعة طلبك والتواصل معك.' : 'Your application has been received. Our HR team will contact you soon.'}
              </p>
              <div style={{
                display: 'inline-block', padding: '0.6rem 1.2rem', borderRadius: '0.6rem',
                background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.9rem'
              }}>
                {isRtl ? 'رقم المرجع: ' : 'Ref Code: '}{successMsg}
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-gold" onClick={() => setSuccessMsg(null)}>
                  {isRtl ? 'تقديم طلب آخر' : 'Submit Another Application'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {errorMsg && (
                <div className="alert alert-error"><AlertCircle size={14} /> {errorMsg}</div>
              )}

              {/* Grid 1: Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'الاسم الكامل *' : 'Full Name *'}</label>
                  <input
                    type="text" required className="form-input"
                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={isRtl ? 'أدخل اسمك الثلاثي أو الرباعي' : 'e.g. Arslan Al-Shamari'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp *'}</label>
                  <input
                    type="tel" required className="form-input" dir="ltr"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +967 77X XXX XXX"
                  />
                </div>
              </div>

              {/* Grid 2: Email & City */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input
                    type="email" className="form-input" dir="ltr"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. candidate@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'المدينة *' : 'City *'}</label>
                  <input
                    type="text" required className="form-input"
                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder={isRtl ? 'مثال: صنعاء، عدن، تعز، الرياض...' : 'e.g. Sanaa, Aden, Riyadh'}
                  />
                </div>
              </div>

              {/* Grid 3: Job Position & Qualification */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'الوظيفة المطلوبة *' : 'Desired Position *'}</label>
                  <select
                    className="form-select"
                    value={formData.jobPosition}
                    onChange={e => setFormData({ ...formData, jobPosition: e.target.value })}
                  >
                    <option value="local_courier">{isRtl ? '🚚 مندوب توصيل شحنات محلي' : 'Local Delivery Courier'}</option>
                    <option value="sourcing_courier">{isRtl ? '📦 مندوب شراء وتوريد مصانع' : 'Sourcing & Import Courier'}</option>
                    <option value="customer_service">{isRtl ? '🎧 موظف استقبال وخدمة عملاء' : 'Receptionist / Customer Service'}</option>
                    <option value="accountant">{isRtl ? '📊 محاسب مالي' : 'Financial Accountant'}</option>
                    <option value="warehouse_manager">{isRtl ? '🏬 أمين مستودع ولوجستيات' : 'Warehouse Specialist'}</option>
                    <option value="branch_manager">{isRtl ? '🏢 مدير فرع' : 'Branch Manager'}</option>
                    <option value="other">{isRtl ? '💼 وظيفة أخرى' : 'Other Role'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'المؤهل العلمي' : 'Qualification'}</label>
                  <select
                    className="form-select"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                  >
                    <option value="Bachelor">{isRtl ? 'بكالوريوس' : 'Bachelor Degree'}</option>
                    <option value="Diploma">{isRtl ? 'دبلوم متوسط' : 'Diploma'}</option>
                    <option value="HighSchool">{isRtl ? 'ثانوية عامة' : 'High School'}</option>
                    <option value="Master">{isRtl ? 'ماجستير / أعلى' : 'Master / Higher'}</option>
                    <option value="Other">{isRtl ? 'مؤهل آخر' : 'Other'}</option>
                  </select>
                </div>
              </div>

              {/* Grid 4: Experience Years & ID Number */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">{isRtl ? 'سنوات الخبرة' : 'Experience Years'}</label>
                  <input
                    type="number" min="0" max="40" className="form-input" dir="ltr"
                    value={formData.experienceYears}
                    onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isRtl ? 'رقم الهوية / الهوية الوطنية' : 'ID / National Number'}</label>
                  <input
                    type="text" className="form-input" dir="ltr"
                    value={formData.idNumber}
                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder={isRtl ? 'رقم البطاقة الشخصية أو جواز السفر' : 'ID / Passport Number'}
                  />
                </div>
              </div>

              {/* Notes & Resume Summary */}
              <div className="form-group">
                <label className="form-label">{isRtl ? 'نبذة عن الخبرات والمهارات / رابط السيرة الذاتية' : 'Resume / Skills Summary'}</label>
                <textarea
                  className="form-input" rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={isRtl ? 'اكتب نبذة عن مهاراتك، خبراتك السابقة، أو رابط السيرة الذاتية (Google Drive / LinkedIn)...' : 'Briefly describe your skills, previous roles, or CV link...'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={submitting} className="btn btn-gold" style={{ minWidth: 160, gap: '0.4rem' }}>
                  {submitting ? <div className="spinner" /> : <Send size={16} />}
                  {isRtl ? 'إرسال طلب التوظيف' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
