import React, { useState, useEffect } from 'react';
import { Factory, Edit3, X, Check } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { queryCollection, updateDocData } from '../../lib/supabase';
import type { SupplierOrder, SupplierOrderStage } from '../../types/portalTypes';

export default function SupplierOrdersPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOrder, setModalOrder] = useState<SupplierOrder | null>(null);

  const [cbmInput, setCbmInput] = useState<number>(0);
  const [weightInput, setWeightInput] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const cbmOrders = await queryCollection('portal_orders', 'packageType', 'factory_cbm');
      cbmOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      const list: SupplierOrder[] = cbmOrders.map((o: any) => ({
        id: o.id,
        trackingNumber: o.trackingNumber || o.id.slice(0, 8),
        description: o.goodsDescription,
        weightKg: o.weightKg || 100,
        cbmVolume: o.cbmVolume || 1.5,
        stage: o.status === 'delivered' ? 'delivered' : 'manufacturing',
        sourceId: o.customerUid,
        requestedAt: o.createdAt,
        updatedAt: o.updatedAt,
      }));

      setOrders(list);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ord: SupplierOrder) => {
    setModalOrder(ord);
    setCbmInput(ord.cbmVolume || 0);
    setWeightInput(ord.weightKg || 0);
  };

  const handleUpdateOrder = async () => {
    if (!modalOrder) return;
    setUpdating(true);
    try {
      await updateDocData('portal_orders', modalOrder.id, {
        cbmVolume: cbmInput,
        weightKg: weightInput,
        updatedAt: Date.now(),
      });
      await updateDocData('orders', modalOrder.id, {
        cbmVolume: cbmInput,
        weightKg: weightInput,
        updatedAt: Date.now(),
      });

      await loadOrders();
      setModalOrder(null);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <h1>{tr('mySupplyOrders')}</h1>
        <p>{isRtl ? 'إدارة طلبات المصانع وتحديث تفاصيل الشحن والـ CBM والمراحل' : 'Manage factory orders and update shipping details, CBM and stages'}</p>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><Factory size={40} /><p>{tr('noOrders')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('trackingNumber')}</th>
                  <th>{tr('description')}</th>
                  <th>{tr('cbmVolume')}</th>
                  <th>{tr('weightKg')}</th>
                  <th>{tr('status')}</th>
                  <th>{tr('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{ord.trackingNumber}</td>
                    <td>{ord.description}</td>
                    <td style={{ fontWeight: 700 }}>{ord.cbmVolume} m³</td>
                    <td>{ord.weightKg} KG</td>
                    <td><span className="badge badge-info">{tr(`stage_${ord.stage}` as any)}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(ord)}>
                        <Edit3 size={14} /> {tr('updateCBM')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOrder && (
        <div className="modal-backdrop" onClick={() => setModalOrder(null)} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {tr('updateCBM')} — <span style={{ color: 'var(--gold)' }}>{modalOrder.trackingNumber}</span>
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setModalOrder(null)}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{tr('cbmVolume')} (m³)</label>
                  <input type="number" step="0.1" className="form-input" value={cbmInput} onChange={e => setCbmInput(parseFloat(e.target.value) || 0)} dir="ltr" />
                </div>

                <div className="form-group">
                  <label className="form-label">{tr('weightKg')} (KG)</label>
                  <input type="number" step="1" className="form-input" value={weightInput} onChange={e => setWeightInput(parseFloat(e.target.value) || 0)} dir="ltr" />
                </div>

                <button className="btn btn-gold btn-full btn-lg" disabled={updating} onClick={handleUpdateOrder}>
                  {updating ? <div className="spinner" /> : <Check size={16} />}
                  {tr('saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
