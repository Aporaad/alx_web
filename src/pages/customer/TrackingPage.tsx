import React, { useCallback, useState } from 'react';
import { Search, Truck, MapPin, CheckCircle2, RefreshCw, Package } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { portalAuthGateway } from '../../api/portalAuthGateway';
import type { PortalShipmentDto } from '../../api/portalAuthGateway';

/**
 * صفحة التتبع (§4.3): بحث برقم تتبع عبر `getTrackingByNumber` — الخادم يفرض ملكية العميل.
 * Tracking page: look up a shipment by tracking number via getTrackingByNumber.
 * The server enforces that the shipment belongs to the signed-in customer — no internal cost or carrier is exposed.
 */
export default function TrackingPage() {
  const { isRtl } = usePortalTheme();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PortalShipmentDto | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const handleTrack = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const num = query.trim();
    if (!num || !portalAuthGateway) { setResult(null); setSearched(!!num); return; }
    setLoading(true);
    setError('');
    try {
      setResult(await portalAuthGateway.getTrackingByNumber(num));
      setSearched(true);
    } catch {
      setError(label('تعذّر تنفيذ التتبع.', 'Tracking lookup failed.'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [query, isRtl]);

  const reset = () => { setQuery(''); setResult(null); setSearched(false); setError(''); };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--gold)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Truck size={16} /> {label('تتبع الشحنة', 'Track a Shipment')}
        </h3>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="form-input-icon-wrapper" style={{ flex: 1, minWidth: 220 }}>
            <Search className="form-input-icon" />
            <input type="text" className="form-input" dir="ltr" value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={label('أدخل رقم التتبع', 'Enter tracking number')} />
          </div>
          <button type="submit" className="btn btn-gold" disabled={loading}>
            {loading ? <div className="spinner" /> : <Search size={16} />}
            {label('تتبع', 'Track')}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : searched && !result ? (
        <div className="empty-state">
          <Package size={32} />
          <p>{label('لا توجد شحنة مطابقة ضمن طلباتك.', 'No matching shipment found in your orders.')}</p>
          <button className="btn btn-ghost btn-sm" onClick={reset}><RefreshCw size={14} /> {label('بحث جديد', 'New search')}</button>
        </div>
      ) : result ? (
        <div className="glass-card animate-scale-in" style={{ padding: '1.5rem', borderColor: 'var(--gold-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem' }}>{label('رقم التتبع', 'Tracking #')}</div>
              <div style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', direction: 'ltr' }}>{result.trackingNumber}</div>
            </div>
            <span className={`badge status-${result.status || 'pending'}`} style={{ fontSize: '0.72rem' }}>
              {result.orderStatus || result.status || '—'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.8rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>{label('رقم الطلب', 'Order #')}</span>
              <div style={{ fontWeight: 700, direction: 'ltr' }}>{result.orderNumber || '—'}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>{label('نوع الشحن', 'Shipping Type')}</span>
              <div style={{ fontWeight: 700 }}>{result.shippingType || '—'}</div></div>
            <div><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} />{label('المصدر', 'From')}</span>
              <div style={{ fontWeight: 700 }}>{result.source || '—'}</div></div>
            <div><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} />{label('الوجهة', 'To')}</span>
              <div style={{ fontWeight: 700 }}>{result.destination || '—'}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>{label('عدد القطع', 'Cartons')}</span>
              <div style={{ fontWeight: 700, direction: 'ltr' }}>{result.cartonCount ?? '—'}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>{label('الوزن', 'Weight')}</span>
              <div style={{ fontWeight: 700, direction: 'ltr' }}>{result.weight ?? '—'}</div></div>
          </div>

          {/* خط زمني لوجستي بسيط — بلا تفاصيل داخلية. / Simple logistics timeline — no internal detail. */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { ar: 'تم إنشاء الطلب', en: 'Order created', at: result.createdAt, done: true },
              { ar: 'تم الشحن', en: 'Shipped', at: result.shippedAt, done: !!result.shippedAt },
              { ar: 'الوصول المتوقع', en: 'Expected arrival', at: result.expectedArrival, done: !!result.expectedArrival },
              { ar: 'تم التسليم', en: 'Delivered', at: result.deliveredAt, done: !!result.deliveredAt },
            ].map(step => (
              <div key={step.ar} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <CheckCircle2 size={15} style={{ color: step.done ? '#34d399' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: step.done ? 700 : 500, color: step.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {isRtl ? step.ar : step.en}
                </span>
                <span style={{ marginInlineStart: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', direction: 'ltr' }}>
                  {step.at ? new Date(step.at).toLocaleDateString('en-GB') : '—'}
                </span>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost btn-sm" style={{ marginTop: '1.25rem' }} onClick={reset}>
            <RefreshCw size={14} /> {label('تتبع شحنة أخرى', 'Track another')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
