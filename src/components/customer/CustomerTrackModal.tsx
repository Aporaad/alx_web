import React, { useState, useEffect } from 'react';
import { CheckCircle, ShieldAlert, Package, Clock, AlertTriangle, FileText, X } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { portalGateway } from '../../api/portalGateway';
import type { PublicTrackingDto } from '../../contracts/portal.contracts';

interface CustomerTrackModalProps {
  trackingNum: string;
  onClose: () => void;
}

export default function CustomerTrackModal({ trackingNum, onClose }: CustomerTrackModalProps) {
  const { tr, isRtl } = usePortalTheme();
  const [tracking, setTracking] = useState<PublicTrackingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTracking = async () => {
      if (!trackingNum.trim()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const result = await portalGateway.getPublicTracking({ trackingToken: trackingNum.trim() });
        if (!isMounted) return;
        if (!result) {
          setNotFound(true);
        } else {
          setTracking(result);
        }
      } catch (error) {
        console.error('[CustomerTrackModal] Portal tracking request failed:', error);
        if (isMounted) setAccessDenied(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void loadTracking();
    return () => { isMounted = false; };
  }, [trackingNum]);

  const currentStatusRaw = (tracking?.status || 'pending').toLowerCase();
  let currentIdx = 0;
  if (currentStatusRaw.includes('تسليم') || currentStatusRaw.includes('delivered')) currentIdx = 4;
  else if (currentStatusRaw.includes('توصيل') || currentStatusRaw.includes('transit') || currentStatusRaw.includes('out')) currentIdx = 3;
  else if (currentStatusRaw.includes('تجهيز') || currentStatusRaw.includes('progress') || currentStatusRaw.includes('processing')) currentIdx = 2;
  else if (currentStatusRaw.includes('قبول') || currentStatusRaw.includes('accepted')) currentIdx = 1;

  const steps = [
    { key: 'pending', label: isRtl ? 'تسجيل الطلب' : 'Order Placed' },
    { key: 'accepted', label: isRtl ? 'تم القبول' : 'Accepted' },
    { key: 'in_progress', label: isRtl ? 'جاري التجهيز' : 'Processing' },
    { key: 'out_for_delivery', label: isRtl ? 'خرج للتوصيل' : 'Out for Delivery' },
    { key: 'delivered', label: isRtl ? 'تم التسليم' : 'Delivered' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'} style={{ zIndex: 9999 }}>
      <div className="modal-box animate-scale-in" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="gold-line-top" />
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--bg-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}><Package size={18} /></div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{isRtl ? 'تتبع الشحنة' : 'Shipment Tracking'}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{trackingNum}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '0.4rem' }}><X size={16} /></button>
          </div>

          {loading && <div className="empty-state" style={{ padding: '3rem 1rem' }}><div className="spinner spinner-lg" /><p style={{ fontSize: '0.82rem', marginTop: '0.75rem', color: 'var(--text-muted)' }}>{isRtl ? 'جاري التحقق والتتبع...' : 'Verifying and fetching tracking info...'}</p></div>}
          {notFound && !loading && <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1rem', gap: '0.75rem' }}><AlertTriangle size={36} /><div><div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{isRtl ? 'رقم التتبع غير موجود' : 'Tracking Number Not Found'}</div><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{isRtl ? 'لم يتم العثور على شحنة بهذا الرقم.' : 'No shipment matches this tracking code.'}</p></div></div>}
          {accessDenied && !loading && <div className="glass-card" style={{ padding: '2rem 1.25rem', textAlign: 'center', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.04)' }}><ShieldAlert size={28} color="#f87171" /><h4 style={{ fontWeight: 900, fontSize: '1.05rem', color: '#f87171', marginBottom: '0.5rem' }}>{isRtl ? 'تعذر التحقق من التتبع' : 'Tracking verification failed'}</h4><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 1.25rem', lineHeight: 1.6 }}>{tr('notYourOrderError')}</p></div>}

          {tracking && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="section-card" style={{ padding: '1.25rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                  {steps.map((step, index) => <React.Fragment key={step.key}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1, zIndex: 2 }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: index <= currentIdx ? 'var(--gold)' : 'var(--bg-border)', color: index <= currentIdx ? '#111' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{index <= currentIdx ? <CheckCircle size={16} /> : <Clock size={15} />}</div><span style={{ fontSize: '0.62rem', textAlign: 'center', color: index <= currentIdx ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: index <= currentIdx ? 800 : 500 }}>{step.label}</span></div>{index < steps.length - 1 && <div style={{ flex: 1, height: 3, background: index < currentIdx ? 'var(--gold)' : 'var(--bg-border)', marginBottom: '1.3rem', transition: 'background 0.3s ease' }} />}</React.Fragment>)}
                </div>
              </div>
              <div className="section-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-border)', paddingBottom: '0.5rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={13} /> {isRtl ? 'حالة الشحنة' : 'Shipment Status'}</span><span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>{tracking.status}</span></div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{isRtl ? 'يتم عرض حالة الشحنة العامة فقط حفاظاً على الخصوصية.' : 'Only the public shipment status is shown to protect privacy.'}</p>
                {tracking.events.length > 0 && <div style={{ display: 'grid', gap: '0.45rem' }}>{tracking.events.map((event, index) => <div key={`${event.status}-${event.occurredAt ?? index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem' }}><span>{event.status}</span><span style={{ color: 'var(--text-muted)' }}>{event.occurredAt ? new Date(event.occurredAt).toLocaleDateString('en-GB') : '—'}</span></div>)}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
