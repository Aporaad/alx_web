/**
 * PreviousProductPickerModal.tsx — نافذة منبثقة للاختيار من منتجات العميل السابقة مع بحث داخلي.
 * Searchable popup to pick from the customer's OWN previous products (mirrors the system's ProductPickerModal,
 * adapted to the portal's inline-style + CSS-token design). Ownership is enforced by the API (listCustomerPreviousProducts).
 */

import React, { useMemo, useState, useEffect } from 'react';
import { X, Search, Plus, History, Loader2 } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalPreviousProductDto } from '../../../api/portalAuthGateway';

export default function PreviousProductPickerModal({
  open, loading, products, onClose, onSelect,
}: {
  open: boolean;
  loading: boolean;
  products: PortalPreviousProductDto[];
  onClose: () => void;
  onSelect: (product: PortalPreviousProductDto) => void;
}) {
  const { isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);
  const [query, setQuery] = useState('');

  // إعادة ضبط البحث عند كل فتح.
  useEffect(() => { if (open) setQuery(''); }, [open]);

  // تصفية نصية على اسم المنتج فقط (المنتجات كلها مملوكة للعميل أصلًا).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => String(p.productName ?? '').toLowerCase().includes(q));
  }, [products, query]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" dir={isRtl ? 'rtl' : 'ltr'} style={{ zIndex: 130 }}>
      <div
        className="modal-box animate-scale-in"
        style={{
          maxWidth: 720, maxHeight: '82vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid var(--gold-border)',
        }}
      >
        <div className="gold-line-top" />

        {/* ترويسة ثابتة + زر إغلاق (الخلفية لا تغلق). */}
        <div style={{ flexShrink: 0, padding: '1rem 1.25rem', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 34, height: 34, borderRadius: '0.7rem', display: 'grid', placeItems: 'center', background: 'rgba(212,175,55,0.12)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}><History size={17} /></span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900 }}>{label('اختيار منتج سابق', 'Pick a Previous Product')}</h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label('من سجل منتجات حسابك فقط — انقر لإضافته إلى السلة.', 'From your account history only — click to add to the cart.')}</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="close"><X size={16} /></button>
        </div>

        {/* شريط البحث. */}
        <div style={{ flexShrink: 0, padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', insetInlineStart: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" className="form-input" autoFocus value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={label('ابحث باسم المنتج…', 'Search by product name…')}
              style={{ paddingInlineStart: '2.4rem' }}
            />
          </div>
        </div>

        {/* قائمة قابلة للتمرير. */}
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}><Loader2 size={15} className="animate-spin" /> {label('جارٍ التحميل…', 'Loading…')}</div>
          ) : filtered.length === 0 ? (
            <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1.5rem 0' }}>
              {products.length === 0 ? label('لا منتجات سابقة في سجل حسابك.', 'No previous products in your history.') : label('لا نتائج مطابقة للبحث.', 'No matching results.')}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.6rem' }}>
              {filtered.map((p, i) => (
                <button
                  key={`${p.productName}-${i}`} type="button" onClick={() => onSelect(p)}
                  className="section-card"
                  style={{ padding: '0.85rem', textAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderColor: 'var(--bg-border)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{p.productName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ×{p.quantity}
                    {p.unitWeight ? ` · ${p.unitWeight}kg` : ''}
                    {p.productPrice ? ` · ${p.productPrice.toLocaleString()}` : ''}
                  </div>
                  <span style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800 }}><Plus size={13} /> {label('إضافة', 'Add')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* تذييل بعدد النتائج. */}
        <div style={{ flexShrink: 0, padding: '0.7rem 1.25rem', borderTop: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span className="mono">{label(`النتائج: ${filtered.length}`, `Results: ${filtered.length}`)}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>{label('إغلاق', 'Close')}</button>
        </div>
      </div>
    </div>
  );
}
