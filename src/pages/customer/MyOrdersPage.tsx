/**
 * MyOrdersPage.tsx — قائمة طلبات العميل (Portal). الإنشاء صار نافذة منبثقة مطابقة للنظام.
 * Customer orders list. Creation is now a POP-UP modal (CreateOrderModal) mirroring the core
 * system — the old "new order" tab and one-page/wizard form are removed.
 *
 * KEY RULES:
 *  - Reads/writes use ONLY the `orders` table. portal_orders is DEPRECATED.
 *  - Customer-pending edit (D7) touches contact fields only; never status/amount/items.
 *  - No client-side pricing here; the modal defers money math to the server quote.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Search, Eye, X, PlusCircle, Trash2,
  FileText, ExternalLink, RefreshCw, Truck, Pencil, Save,
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { portalAuthGateway, type PortalCustomerOrderUpdateFields } from '../../api/portalAuthGateway';
import CustomerTrackModal from '../../components/customer/CustomerTrackModal';
import CreateOrderModal from './orders/CreateOrderModal';

export default function MyOrdersPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  // الإنشاء عبر نافذة منبثقة بدل تبويبة «طلب جديد».
  const [createOpen, setCreateOpen] = useState(false);

  // ── List state ──────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderStatuses] = useState<any[]>([
    { id: '1', nameAr: 'معلق', nameEn: 'Pending' },
    { id: '2', nameAr: 'قيد المعالجة', nameEn: 'Processing' },
    { id: '3', nameAr: 'تم التسليم', nameEn: 'Delivered' },
    { id: '4', nameAr: 'مرتجع', nameEn: 'Returned' },
  ]);
  const [detailsOrder, setDetailsOrder] = useState<any | null>(null);
  const [trackModalNum, setTrackModalNum] = useState<string | null>(null);

  // D7: تعديل/حذف الطلب المملوك فقط عندما تكون الحالة "معلق".
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [editFields, setEditFields] = useState<PortalCustomerOrderUpdateFields>({});
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      if (!portalAuthGateway) throw new Error('PORTAL_API_NOT_CONFIGURED');
      setOrders(await portalAuthGateway.listCustomerOrders());
    } catch (err) {
      console.error('[MyOrdersPage] Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  const isPending = (ord: any): boolean =>
    (ord?.status === 'pending' || ord?.orderStatus === 'معلق' || !ord?.status);

  const openEdit = (ord: any) => {
    setMutationError('');
    setEditFields({
      recipientName: ord?.recipientName || '',
      recipientPhone: ord?.recipientPhone || '',
      recipientAddress: ord?.recipientAddress || '',
      deliveryCity: ord?.deliveryCity || '',
      goodsDescription: ord?.goodsDescription || '',
    });
    setEditOrder(ord);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalAuthGateway || !editOrder) return;
    setMutating(true);
    setMutationError('');
    try {
      const trimmed: PortalCustomerOrderUpdateFields = {};
      for (const [k, v] of Object.entries(editFields)) {
        const s = (v ?? '').toString().trim();
        if (s) (trimmed as Record<string, string>)[k] = s;
      }
      await portalAuthGateway.updateCustomerOrder(editOrder.id, trimmed);
      setEditOrder(null);
      await loadOrders();
    } catch (err: any) {
      setMutationError(err.message || tr('error'));
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (ord: any) => {
    if (!portalAuthGateway) return;
    const ok = window.confirm(isRtl
      ? 'هل تريد حذف هذا الطلب المعلَّق؟ لا يمكن التراجع.'
      : 'Delete this pending order? This cannot be undone.');
    if (!ok) return;
    setMutating(true);
    setMutationError('');
    try {
      await portalAuthGateway.deleteCustomerOrder(ord.id);
      await loadOrders();
    } catch (err: any) {
      setMutationError(err.message || tr('error'));
    } finally {
      setMutating(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      const matchQ = !q ||
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        (o.goodsDescription || '').toLowerCase().includes(q) ||
        (o.orderSourceName || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' ||
        o.status === statusFilter ||
        o.orderStatus === statusFilter;
      return matchQ && matchStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── الترويسة + زر إنشاء طلب (نافذة منبثقة) ─────────────────────────── */}
      <div className="glass-card" style={{
        padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', position: 'relative',
      }}>
        <div className="gold-line-top" />
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{tr('myOrders')}</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {isRtl ? 'متابعة حالة وفاتورة جميع شحناتك المسجلة في النظام' : 'Track status and invoices of all your registered orders'}
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => setCreateOpen(true)}>
          <PlusCircle size={16} /> {tr('newOrder')}
        </button>
      </div>

      {/* ── أدوات البحث والفلترة ─────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-input-icon-wrapper" style={{ flex: 1, minWidth: 180 }}>
          <Search className="form-input-icon" />
          <input type="text" className="form-input" value={search}
            onChange={e => setSearch(e.target.value)} placeholder={tr('search')} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 170 }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">{isRtl ? 'الكل' : 'All Statuses'}</option>
          {orderStatuses.map(st => (
            <option key={st.id} value={st.nameAr}>
              {isRtl ? st.nameAr : st.nameEn}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={loadOrders}><RefreshCw size={14} /></button>
      </div>

      {/* ── الجدول ──────────────────────────────────────────────────────────── */}
      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loadingOrders ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package size={42} style={{ opacity: 0.5 }} />
            <p>{tr('noOrders')}</p>
            <button className="btn btn-gold btn-sm" style={{ marginTop: '0.6rem' }} onClick={() => setCreateOpen(true)}>
              <PlusCircle size={14} /> {tr('newOrder')}
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('trackingNumber')}</th>
                  <th>{tr('orderDate')}</th>
                  <th>{isRtl ? 'مصدر الشراء' : 'Source'}</th>
                  <th>{tr('status')}</th>
                  <th>{isRtl ? 'الإجمالي' : 'Total'}</th>
                  <th>{isRtl ? 'المدفوع' : 'Paid'}</th>
                  <th>{isRtl ? 'المتبقي' : 'Due'}</th>
                  <th>{tr('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(ord => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {ord.orderNumber || ord.trackingNumber || ord.id?.slice(0, 10)}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{new Date(ord.createdAt || Date.now()).toLocaleDateString('en-GB')}</td>
                    <td><span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{ord.orderSourceName || ord.orderSourceType || 'عام'}</span></td>
                    <td><span className={`badge status-${ord.status || 'pending'}`} style={{ fontSize: '0.7rem' }}>{ord.orderStatus || ord.status || 'معلق'}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.8rem' }}>{(ord.totalCostYER || ord.totalOrderYER || 0).toLocaleString()}</td>
                    <td style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>{(ord.amountPaid || 0).toLocaleString()}</td>
                    <td style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>{(ord.amountRemaining || 0).toLocaleString()}</td>
                    <td style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setTrackModalNum(ord.orderNumber || ord.trackingNumber || ord.id)} title={tr('trackOrder')}><Truck size={13} style={{ color: 'var(--gold)' }} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetailsOrder(ord)}><Eye size={13} /> {tr('viewDetails')}</button>
                      {isPending(ord) && (
                        <>
                          <button className="btn btn-ghost btn-sm" disabled={mutating} onClick={() => openEdit(ord)} title={isRtl ? 'تعديل' : 'Edit'}><Pencil size={13} /></button>
                          <button className="btn btn-ghost btn-sm" disabled={mutating} onClick={() => handleDelete(ord)} title={isRtl ? 'حذف' : 'Delete'}><Trash2 size={13} style={{ color: '#f87171' }} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة إنشاء الطلب (منبثقة، مطابقة للنظام) */}
      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); void loadOrders(); }} />

      {/* Track Modal */}
      {trackModalNum && <CustomerTrackModal trackingNum={trackModalNum} onClose={() => setTrackModalNum(null)} />}

      {/* DETAILS MODAL */}
      {detailsOrder && (
        <div className="modal-backdrop" onClick={() => setDetailsOrder(null)} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontWeight: 900, fontSize: '1rem', margin: 0 }}>{isRtl ? 'تفاصيل الطلب' : 'Order Details'}</h3>
                  <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{detailsOrder.orderNumber || detailsOrder.trackingNumber}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setDetailsOrder(null)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={`badge status-${detailsOrder.status || 'pending'}`}>{detailsOrder.orderStatus || detailsOrder.status}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{(detailsOrder.totalCostYER || detailsOrder.totalOrderYER || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="section-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                  {[
                    [isRtl ? 'رقم الطلب' : 'Order #', detailsOrder.orderNumber],
                    [isRtl ? 'تاريخ الإنشاء' : 'Created', new Date(detailsOrder.createdAt || 0).toLocaleDateString('en-GB')],
                    [isRtl ? 'مصدر الشراء' : 'Source', detailsOrder.orderSourceName || 'عام'],
                    [isRtl ? 'نوع التغليف' : 'Packaging', detailsOrder.packagingType || 'عادي'],
                    [isRtl ? 'طريقة الدفع' : 'Payment Method', detailsOrder.paymentMethod || '—'],
                    [isRtl ? 'حالة الدفع' : 'Payment Status', detailsOrder.paymentStatus || '—'],
                  ].map(([l, v]) => (
                    <div key={l as string}><span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{l}</span><div style={{ fontWeight: 700 }}>{v || '—'}</div></div>
                  ))}
                </div>
                <div className="section-card" style={{ fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 800, color: 'var(--gold)', marginBottom: '0.6rem' }}>{isRtl ? 'ملخص الفاتورة المالي' : 'Financial Summary'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {[
                      [isRtl ? 'إجمالي الطلب' : 'Total', (detailsOrder.totalCostYER || detailsOrder.totalOrderYER || 0).toLocaleString()],
                      [isRtl ? 'المبلغ المدفوع' : 'Amount Paid', (detailsOrder.amountPaid || 0).toLocaleString()],
                      [isRtl ? 'المتبقي للدفع' : 'Amount Remaining', (detailsOrder.amountRemaining || 0).toLocaleString()],
                    ].map(([l, v]) => (
                      <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--bg-border)', paddingBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{l}</span><strong style={{ fontFamily: 'var(--font-mono)' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                {Array.isArray(detailsOrder.items) && detailsOrder.items.length > 0 && (
                  <div className="section-card" style={{ fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold)', marginBottom: '0.5rem' }}>
                      <FileText size={13} style={{ display: 'inline', marginInlineEnd: '0.3rem' }} />{isRtl ? 'الأصناف والمنتجات:' : 'Items & Products:'}
                    </div>
                    <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                      {detailsOrder.items.map((item: any, i: number) => (
                        <li key={i} style={{ marginBottom: '0.3rem' }}>
                          <strong>{item.productName}</strong>
                          {item.quantity ? ` × ${item.quantity}` : ''}
                          {item.productUrl && (<a href={item.productUrl} target="_blank" rel="noopener noreferrer" style={{ marginInlineStart: '0.4rem', color: 'var(--gold)', fontSize: '0.7rem' }}><ExternalLink size={11} style={{ display: 'inline' }} /></a>)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(detailsOrder.customerNote || detailsOrder.notes) && (
                  <div className="section-card" style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'ملاحظات:' : 'Notes:'}</span>
                    <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{detailsOrder.customerNote || detailsOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D7 EDIT MODAL — حقول تواصل فقط. */}
      {editOrder && (
        <div className="modal-backdrop" onClick={() => setEditOrder(null)} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1rem', margin: 0 }}>{isRtl ? 'تعديل الطلب المعلَّق' : 'Edit Pending Order'}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditOrder(null)}><X size={16} /></button>
              </div>
              {mutationError && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{mutationError}</div>}
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { k: 'recipientName' as const, l: isRtl ? 'اسم المستلم' : 'Recipient Name', dir: undefined },
                  { k: 'recipientPhone' as const, l: isRtl ? 'هاتف المستلم' : 'Recipient Phone', dir: 'ltr' as const },
                  { k: 'recipientAddress' as const, l: isRtl ? 'عنوان التوصيل' : 'Delivery Address', dir: undefined },
                  { k: 'deliveryCity' as const, l: isRtl ? 'مدينة التوصيل' : 'Delivery City', dir: undefined },
                ].map(({ k, l, dir }) => (
                  <div key={k} className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{l}</label>
                    <input className="form-input" dir={dir} value={editFields[k] || ''} onChange={e => setEditFields(f => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
                <button type="submit" className="btn btn-gold btn-full" disabled={mutating}>
                  {mutating ? <div className="spinner" /> : <Save size={16} />} {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
