import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, ExternalLink, RefreshCw, Package } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { portalAuthGateway } from '../../api/portalAuthGateway';
import type { PortalCartItemDto } from '../../api/portalAuthGateway';

/**
 * صفحة السلة/المرتجعات (§4.4): قراءة مقيّدة بالعميل عبر `listCustomerCart`.
 * Cart / returns page: customer-scoped read-only list via listCustomerCart. No cost, profit, or internal identifiers.
 */
export default function CartPage() {
  const { isRtl } = usePortalTheme();
  const [items, setItems] = useState<PortalCartItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    if (!portalAuthGateway) { setItems([]); setLoading(false); return; }
    try {
      setItems(await portalAuthGateway.listCustomerCart());
    } catch {
      setError(label('تعذّر تحميل السلة.', 'Failed to load cart.'));
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShoppingCart size={16} /> {label('سلتي / المرتجعات', 'My Cart / Returns')}
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()}>
          <RefreshCw size={14} /> {label('تحديث', 'Refresh')}
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={32} />
          <p>{label('سلتك فارغة حالياً.', 'Your cart is empty.')}</p>
        </div>
      ) : (
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="portal-table">
            <thead>
              <tr>
                <th>{label('المنتج', 'Product')}</th>
                <th>{label('الكمية', 'Qty')}</th>
                <th>{label('الطلب', 'Order')}</th>
                <th>{label('الحالة', 'Status')}</th>
                <th>{label('التاريخ', 'Date')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.returnId}>
                  <td style={{ fontWeight: 700 }}>
                    {it.productName}
                    {it.productUrl && (
                      <a href={it.productUrl} target="_blank" rel="noopener noreferrer"
                        style={{ marginInlineStart: '0.4rem', color: 'var(--gold)', fontSize: '0.7rem' }}>
                        <ExternalLink size={11} style={{ display: 'inline' }} />
                      </a>
                    )}
                  </td>
                  <td style={{ direction: 'ltr' }}>{it.quantity}</td>
                  <td style={{ direction: 'ltr', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{it.orderNumber || '—'}</td>
                  <td><span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{it.returnStatus || '—'}</span></td>
                  <td style={{ direction: 'ltr', fontSize: '0.78rem' }}>{new Date(it.returnedAt || 0).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
