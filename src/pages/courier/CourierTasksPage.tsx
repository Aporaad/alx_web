import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Phone, CheckCircle, XCircle, X, Check } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { queryByDataField, updateDocData } from '../../lib/supabase';
import type { CourierTask, OrderStatus } from '../../types/portalTypes';

export default function CourierTasksPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [tasks, setTasks] = useState<CourierTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofModal, setProofModal] = useState<CourierTask | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Query system `orders` table where deliveryCourierId matches courier's linkedAccId or uid
      let courierOrders = await queryByDataField('orders', 'deliveryCourierId', user?.linkedAccId || user?.uid);
      if (courierOrders.length === 0) {
        courierOrders = await queryByDataField('orders', 'courierId', user?.linkedAccId || user?.uid);
      }
      courierOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      const list: CourierTask[] = courierOrders.map((o: any) => ({
        orderId: o.id,
        trackingNumber: o.trackingNumber || o.orderNumber || o.id.slice(0, 8),
        customerName: o.customerName || 'عميل البوابة',
        customerPhone: o.customerPhone || '',
        recipientName: o.recipientName || o.customerName || '',
        recipientPhone: o.recipientPhone || o.customerPhone || '',
        recipientAddress: o.deliveryAddress || o.recipientAddress || '',
        deliveryCity: o.deliveryCity || '',
        status: o.status || 'in_progress',
        cashOnDelivery: o.amountRemaining || o.totalPrice || 0,
        currency: o.currency || 'YER',
        assignedAt: o.updatedAt || Date.now(),
      }));

      setTasks(list);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const orderStatusMap: Record<string, string> = {
        delivered: 'تم التسليم',
        returned: 'مرتجع / تعذر التسليم',
        out_for_delivery: 'مع المندوب للتوصيل'
      };

      await updateDocData('orders', orderId, {
        status: newStatus,
        orderStatus: orderStatusMap[newStatus] || newStatus,
        updatedAt: Date.now()
      });

      await loadTasks();
      setProofModal(null);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <h1>{tr('myTasks')}</h1>
        <p>{isRtl ? 'إدارة الشحنات والمهام المسندة لك وتوثيق حالة التسليم ميدانياً' : 'Manage assigned deliveries and update status in field'}</p>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state"><Truck size={40} /><p>{tr('noOrders')}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {tasks.map(task => (
            <div key={task.orderId} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{task.trackingNumber}</span>
                <span className={`badge status-${task.status}`}>{tr(`status_${task.status}` as any) || task.status}</span>
              </div>

              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{task.recipientName}</div>
                <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                  <MapPin size={13} /> {task.deliveryCity} — {task.recipientAddress}
                </div>
              </div>

              <div className="section-card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'المبلغ المطلوب تحصيله' : 'C.O.D Amount'}:</span>
                <span style={{ fontWeight: 800, color: 'var(--gold)' }}>{task.cashOnDelivery} {task.currency}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`tel:${task.recipientPhone}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  <Phone size={13} /> {tr('callCustomer')}
                </a>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(task.recipientAddress + ' ' + task.deliveryCity)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <MapPin size={13} />
                </a>
              </div>

              {task.status !== 'delivered' && task.status !== 'cancelled' && (
                <button className="btn btn-gold btn-full" onClick={() => setProofModal(task)}>
                  <CheckCircle size={15} /> {tr('updateDeliveryStatus')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {proofModal && (
        <div className="modal-backdrop" onClick={() => setProofModal(null)} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {tr('updateDeliveryStatus')} — <span style={{ color: 'var(--gold)' }}>{proofModal.trackingNumber}</span>
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setProofModal(null)}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  className="btn btn-gold btn-full btn-lg"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(proofModal.orderId, 'delivered')}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
                >
                  <Check size={18} />
                  {tr('deliveredSuccessfully')}
                </button>

                <div className="divider" />

                <div className="form-group">
                  <label className="form-label">{tr('failureReason')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={failureReason}
                    onChange={e => setFailureReason(e.target.value)}
                    placeholder={isRtl ? 'العميل لا يجيب، العنوان غير دقيق...' : 'Customer not answering, wrong address...'}
                  />
                </div>

                <button
                  className="btn btn-danger btn-full"
                  disabled={updating || !failureReason}
                  onClick={() => handleUpdateStatus(proofModal.orderId, 'returned')}
                >
                  <XCircle size={16} />
                  {tr('failedDelivery')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
