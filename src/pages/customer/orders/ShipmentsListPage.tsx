/**
 * ShipmentsListPage.tsx — تبويب الشحنات (§4.2-ب): عرض لوجستي مقيّد بالعميل + إنشاء + بحث/فلترة/فرز.
 * Shipments tab: customer-scoped logistics via listCustomerShipments, now with a create-shipment
 * POP-UP (mirrors the system ShipmentFormModal) plus search / status filter / column sort.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Truck, Search, RefreshCw, PlusCircle, ArrowUpDown } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { portalAuthGateway } from '../../../api/portalAuthGateway';
import type { PortalShipmentDto } from '../../../api/portalAuthGateway';
import CreateShipmentModal from './CreateShipmentModal';

type SortKey = 'trackingNumber' | 'orderNumber' | 'status' | 'createdAt';

export default function ShipmentsListPage() {
  const { tr, isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const [shipments, setShipments] = useState<PortalShipmentDto[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // تُحمَّل الشحنات مرة واحدة؛ البحث/الفلترة/الفرز تُطبَّق محليًا على النتيجة المملوكة.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    if (!portalAuthGateway) { setShipments([]); setLoading(false); return; }
    try {
      setShipments(await portalAuthGateway.listCustomerShipments());
    } catch {
      setError(label('تعذّر تحميل الشحنات.', 'Failed to load shipments.'));
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => { void load(); }, [load]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    shipments.forEach(s => { if (s.status) set.add(s.status); });
    return Array.from(set);
  }, [shipments]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = shipments.filter(s => {
      const matchQ = !q ||
        (s.trackingNumber || '').toLowerCase().includes(q) ||
        (s.orderNumber || '').toLowerCase().includes(q) ||
        (s.source || '').toLowerCase().includes(q) ||
        (s.destination || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchQ && matchStatus;
    });
    list = [...list].sort((a, b) => {
      const av = String((a as any)[sortKey] ?? '');
      const bv = String((b as any)[sortKey] ?? '');
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [shipments, search, statusFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortHeader = ({ k, ar, en }: { k: SortKey; ar: string; en: string }) => (
    <th onClick={() => toggleSort(k)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>{isRtl ? ar : en}<ArrowUpDown size={12} style={{ opacity: sortKey === k ? 1 : 0.4 }} /></span>
    </th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* الترويسة + زر إنشاء شحنة */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900 }}>{label('الشحنات', 'Shipments')}</h3>
        <button className="btn btn-gold btn-sm" onClick={() => setCreateOpen(true)}><PlusCircle size={15} /> {label('إنشاء شحنة', 'Create Shipment')}</button>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-input-icon-wrapper" style={{ flex: 1, minWidth: 180 }}>
          <Search className="form-input-icon" />
          <input type="text" className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={label('بحث برقم التتبع/الطلب/الوجهة', 'Search tracking/order/destination')} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">{label('كل الحالات', 'All Statuses')}</option>
          {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : visible.length === 0 ? (
        <div className="empty-state"><Truck size={32} /><p>{label('لا توجد شحنات مطابقة.', 'No matching shipments.')}</p></div>
      ) : (
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <SortHeader k="trackingNumber" ar="التتبع" en="Tracking" />
                  <SortHeader k="orderNumber" ar="رقم الطلب" en="Order #" />
                  <SortHeader k="status" ar="الحالة" en="Status" />
                  <th>{label('المصدر', 'From')}</th>
                  <th>{label('الوجهة', 'To')}</th>
                  <th>{label('القطع', 'Cartons')}</th>
                  <SortHeader k="createdAt" ar="التاريخ" en="Date" />
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.shipmentId}>
                    <td style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>{s.trackingNumber || '—'}</td>
                    <td style={{ direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>{s.orderNumber || '—'}</td>
                    <td><span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{s.status || '—'}</span></td>
                    <td>{s.source ?? '—'}</td>
                    <td>{s.destination ?? '—'}</td>
                    <td style={{ direction: 'ltr' }}>{s.cartonCount ?? '—'}</td>
                    <td style={{ direction: 'ltr', fontSize: '0.75rem' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateShipmentModal open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); void load(); }} />
    </div>
  );
}
