import React, { useCallback, useEffect, useState } from 'react';
import { Package, Search, RefreshCw } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { portalAuthGateway } from '../../../api/portalAuthGateway';
import type { PortalCustomerOrderItemDto } from '../../../api/portalAuthGateway';

/**
 * تبويب «منتجاتي» (§4.2-ج): أصناف order_items العائدة لطلبات العميل فقط — بلا مصدر داخلي/تكلفة/ربح.
 * My Products tab: only the customer's own order_items — no internal source id, cost, or profit.
 * تُعرض الأسعار كأرقام محايدة (بلا تسمية عملة ثابتة — D2)؛ الرمز يُحلّ في شاشة المالية/العرض لاحقًا.
 * Prices render as neutral numbers (no hard-coded currency label — D2); the symbol resolves in the finance view.
 */
export default function MyProductsListPage() {
  const { tr, isRtl } = usePortalTheme();
  const [items, setItems] = useState<PortalCustomerOrderItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    if (!portalAuthGateway) { setItems([]); setLoading(false); return; }
    try {
      setItems(await portalAuthGateway.listCustomerOrderItems(search.trim() || undefined));
    } catch {
      setError(isRtl ? 'تعذّر تحميل المنتجات.' : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, isRtl]);

  useEffect(() => { void load(); }, [load]);

  const label = (ar: string, en: string) => (isRtl ? ar : en);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-input-icon-wrapper" style={{ flex: 1, minWidth: 180 }}>
          <Search className="form-input-icon" />
          <input type="text" className="form-input" value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder={label('بحث باسم المنتج', 'Search product name')} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()}>
          <RefreshCw size={14} /> {tr('actions')}
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={32} />
          <p>{label('لا توجد منتجات بعد.', 'No products yet.')}</p>
        </div>
      ) : (
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th>{label('المنتج', 'Product')}</th>
                <th>{label('الكمية', 'Qty')}</th>
                <th>{label('سعر الوحدة', 'Unit Price')}</th>
                <th>{label('وزن الوحدة', 'Unit Weight')}</th>
                <th>{label('حجم الوحدة (م³)', 'Unit CBM')}</th>
                <th>{label('التتبع', 'Tracking')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.orderItemId}>
                  <td>{it.productName}</td>
                  <td style={{ direction: 'ltr' }}>{it.quantity}</td>
                  <td style={{ direction: 'ltr' }}>{it.productPrice}</td>
                  <td style={{ direction: 'ltr' }}>{it.unitWeight}</td>
                  <td style={{ direction: 'ltr' }}>{it.unitCbm}</td>
                  <td style={{ direction: 'ltr' }}>{it.trackingNumber ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
