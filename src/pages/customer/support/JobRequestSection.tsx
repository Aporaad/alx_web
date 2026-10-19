import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Plus, RefreshCw, Clock } from 'lucide-react';
import { usePortalAuth } from '../../../context/PortalAuthContext';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { portalAuthGateway } from '../../../api/portalAuthGateway';
import type { PortalJobRequestDto, PortalJobRequestInput } from '../../../api/portalAuthGateway';

/**
 * قسم طلب التوظيف (§4.8/D5): قراءة/كتابة `jobs_req` عبر البوابة. الطلب يُنسب للمستخدم المصادَق؛
 * العميل يرى طلباته فقط، والحالة يحددها الموظف (لا يتحكم بها العميل).
 * Job-request section: customer submits an application; ownership is enforced server-side by created_by.
 */
export default function JobRequestSection() {
  const { user } = usePortalAuth();
  const { isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const [list, setList] = useState<PortalJobRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<PortalJobRequestInput>({
    fullName: user?.fullName ?? '', phone: user?.phone ?? '', email: user?.email ?? '',
    jobPosition: '', category: '', city: '', qualification: '', experienceYears: undefined, notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    if (!portalAuthGateway) { setList([]); setLoading(false); return; }
    try { setList(await portalAuthGateway.listJobRequests()); }
    catch { setError(label('تعذّر تحميل الطلبات.', 'Failed to load requests.')); }
    finally { setLoading(false); }
  }, [isRtl]);

  useEffect(() => { void load(); }, [load]);

  const set = <K extends keyof PortalJobRequestInput>(k: K, v: PortalJobRequestInput[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalAuthGateway) { setError('PORTAL_API_NOT_CONFIGURED'); return; }
    if (!form.fullName.trim() || !form.phone.trim() || !form.jobPosition.trim()) {
      setError(label('الاسم والهاتف والمسمى مطلوب.', 'Name, phone and position are required.'));
      return;
    }
    setBusy(true); setError('');
    try {
      const payload: PortalJobRequestInput = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        jobPosition: form.jobPosition.trim(),
        ...(form.email?.trim() ? { email: form.email.trim() } : {}),
        ...(form.category?.trim() ? { category: form.category.trim() } : {}),
        ...(form.city?.trim() ? { city: form.city.trim() } : {}),
        ...(form.qualification?.trim() ? { qualification: form.qualification.trim() } : {}),
        ...(form.experienceYears != null && Number.isFinite(form.experienceYears) ? { experienceYears: form.experienceYears } : {}),
        ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
      };
      await portalAuthGateway.createJobRequest(payload);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || label('فشل إرسال الطلب.', 'Failed to submit.'));
    } finally { setBusy(false); }
  };

  const statusTone = (s: string) =>
    s === 'approved' ? 'delivered' : s === 'rejected' ? 'cancelled' : s === 'under_review' ? 'in_progress' : 'pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Briefcase size={15} /> {label('طلبات التوظيف', 'Job Applications')}
        </h4>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => void load()}><RefreshCw size={14} /></button>
          <button className="btn btn-gold btn-sm" onClick={() => setShowForm(v => !v)}><Plus size={14} /> {label('طلب جديد', 'New')}</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form onSubmit={submit} className="glass-card animate-scale-in" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('الاسم الكامل', 'Full Name')} *</label>
            <input className="form-input" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('الهاتف', 'Phone')} *</label>
            <input className="form-input" dir="ltr" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('البريد الإلكتروني', 'Email')}</label>
            <input className="form-input" dir="ltr" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('المسمى الوظيفي', 'Position')} *</label>
            <input className="form-input" value={form.jobPosition} onChange={e => set('jobPosition', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('المدينة', 'City')}</label>
            <input className="form-input" value={form.city ?? ''} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('المؤهل', 'Qualification')}</label>
            <input className="form-input" value={form.qualification ?? ''} onChange={e => set('qualification', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label('سنوات الخبرة', 'Experience Years')}</label>
            <input className="form-input" type="number" min={0} max={60} dir="ltr"
              value={form.experienceYears ?? ''} onChange={e => set('experienceYears', e.target.value === '' ? undefined : Number(e.target.value))} />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label className="form-label">{label('ملاحظات', 'Notes')}</label>
            <textarea className="form-input" rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-gold btn-full" disabled={busy}>
              {busy ? <div className="spinner" /> : <Briefcase size={16} />}
              {label('إرسال الطلب', 'Submit Application')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state"><Briefcase size={30} /><p>{label('لا توجد طلبات توظيف بعد.', 'No job applications yet.')}</p></div>
      ) : (
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th>{label('المسمى', 'Position')}</th>
                <th>{label('المدينة', 'City')}</th>
                <th>{label('الحالة', 'Status')}</th>
                <th>{label('التاريخ', 'Date')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.jobPosition || '—'}</td>
                  <td>{r.city || '—'}</td>
                  <td><span className={`badge status-${statusTone(r.status)}`} style={{ fontSize: '0.7rem' }}>{r.status}</span></td>
                  <td style={{ direction: 'ltr', fontSize: '0.78rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={11} />{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
