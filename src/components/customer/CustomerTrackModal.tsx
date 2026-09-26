import React, { useState, useEffect } from 'react';
import {
  CheckCircle, ShieldAlert, Package, Clock, MapPin,
  User, Truck, AlertTriangle, FileText, Search, X, CheckCircle2
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { getCollection, supabase } from '../../lib/supabase';

interface CustomerTrackModalProps {
  trackingNum: string;
  onClose: () => void;
}

export default function CustomerTrackModal({ trackingNum, onClose }: CustomerTrackModalProps) {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getCollection('order_status').then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const map: Record<string, string> = {};
        data.forEach((st: any) => {
          if (st.nameAr || st.name_ar) {
            map[st.nameAr || st.name_ar] = st.nameEn || st.name_en || st.nameAr || st.name_ar;
          }
        });
        setStatusMap(map);
      }
    }).catch(err => console.error("Error fetching order_status:", err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const findOrder = async () => {
      if (!trackingNum || !user) {
        setLoading(false);
        return;
      }

      const searchVal = trackingNum.trim().toLowerCase();

      try {
        // Query `orders` collection
        const allOrders = await getCollection('orders');
        let matched = allOrders.find((ord: any) => {
          const num = String(ord.orderNumber || '').toLowerCase();
          const trk = String(ord.trackingNumber || '').toLowerCase();
          const id = String(ord.id || '').toLowerCase();
          return num === searchVal || trk === searchVal || id === searchVal || id.slice(0, 10) === searchVal;
        });

        // Fallback query to portal_orders if not found in orders
        if (!matched) {
          const { data } = await supabase
            .from('portal_orders')
            .select('*')
            .or(`tracking_number.eq.${searchVal},order_number.eq.${searchVal},id.eq.${searchVal}`)
            .maybeSingle();
          if (data) matched = data;
        }

        if (!matched) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        // ── STRICT OWNERSHIP CHECK ──────────────────────────────────────────
        const linkedAccId = (user.linkedAccId || user.linkedCustomerId || '').toLowerCase();
        const uid = (user.uid || '').toLowerCase();
        const fullName = (user.fullName || '').trim().toLowerCase();
        const phone = (user.phone || '').replace(/\s+/g, '').toLowerCase();
        const email = (user.email || '').toLowerCase();

        const custId = String(matched.customerId || matched.customer_id || '').toLowerCase();
        const custUid = String(matched.customerUid || matched.customer_uid || matched.user_id || '').toLowerCase();
        const custName = String(matched.customerName || matched.customer_name || matched.recipient_name || '').trim().toLowerCase();
        const custPhone = String(matched.customerPhone || matched.customer_phone || matched.phone || '').replace(/\s+/g, '').toLowerCase();
        const custEmail = String(matched.customerEmail || matched.customer_email || matched.email || '').toLowerCase();
        const portalUid = String(matched.portalUid || matched.portal_uid || '').toLowerCase();

        const isOwner = (
          (linkedAccId && (custId === linkedAccId || custUid === linkedAccId)) ||
          (uid && (custId === uid || custUid === uid || portalUid === uid)) ||
          (fullName && custName === fullName) ||
          (phone && phone.length >= 7 && custPhone === phone) ||
          (email && custEmail === email)
        );

        if (!isOwner) {
          if (isMounted) {
            setAccessDenied(true);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setOrder(matched);
          setLoading(false);
        }
      } catch (err) {
        console.error('[CustomerTrackModal] Error finding order:', err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };

    findOrder();
    return () => { isMounted = false; };
  }, [trackingNum, user]);

  const steps = [
    { key: 'pending',           label: isRtl ? 'تسجيل الطلب' : 'Order Placed' },
    { key: 'accepted',          label: isRtl ? 'تم القبول' : 'Accepted' },
    { key: 'in_progress',       label: isRtl ? 'جاري التجهيز' : 'Processing' },
    { key: 'out_for_delivery',  label: isRtl ? 'خرج للتوصيل' : 'Out for Delivery' },
    { key: 'delivered',         label: isRtl ? 'تم التسليم' : 'Delivered' },
  ];

  const currentStatusRaw = (order?.orderStatus || order?.status || 'pending').toLowerCase();
  
  let currentIdx = 0;
  if (currentStatusRaw.includes('تسليم') || currentStatusRaw.includes('delivered')) {
    currentIdx = 4;
  } else if (currentStatusRaw.includes('توصيل') || currentStatusRaw.includes('transit') || currentStatusRaw.includes('out')) {
    currentIdx = 3;
  } else if (currentStatusRaw.includes('تجهيز') || currentStatusRaw.includes('progress') || currentStatusRaw.includes('processing')) {
    currentIdx = 2;
  } else if (currentStatusRaw.includes('قبول') || currentStatusRaw.includes('accepted')) {
    currentIdx = 1;
  } else {
    currentIdx = 0;
  }

  return (
    <div className="modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'} style={{ zIndex: 9999 }}>
      <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="gold-line-top" />
        <div style={{ padding: '1.5rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--bg-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '0.6rem',
                background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)'
              }}>
                <Package size={18} />
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
                  {isRtl ? 'تتبع الشحنة التفصيلي' : 'Detailed Shipment Tracking'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  {trackingNum}
                </span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '0.4rem' }}>
              <X size={16} />
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <div className="spinner spinner-lg" />
              <p style={{ fontSize: '0.82rem', marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                {isRtl ? 'جاري التحقق والتتبع...' : 'Verifying and fetching tracking info...'}
              </p>
            </div>
          )}

          {/* Not Found */}
          {notFound && !loading && (
            <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1rem', gap: '0.75rem' }}>
              <AlertTriangle size={36} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                  {isRtl ? 'رقم التتبع غير موجود' : 'Tracking Number Not Found'}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {isRtl
                    ? 'لم يتم العثور على أي شحنة بهذا الرقم. يرجى التأكد من الرقم والمحاولة مجدداً.'
                    : 'No shipment matches this number. Please check the code and try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Access Denied / Security Restriction */}
          {accessDenied && !loading && (
            <div className="glass-card" style={{ padding: '2rem 1.25rem', textAlign: 'center', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.04)' }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f87171', margin: '0 auto 1rem'
              }}>
                <ShieldAlert size={28} />
              </div>
              <h4 style={{ fontWeight: 900, fontSize: '1.05rem', color: '#f87171', marginBottom: '0.5rem' }}>
                {isRtl ? 'تقييد الوصول وحماية الخصوصية' : 'Access Restricted — Privacy Shield'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
                {tr('notYourOrderError')}
              </p>
              <span className="badge badge-danger" style={{ padding: '0.35rem 0.85rem', fontSize: '0.7rem' }}>
                🔒 {isRtl ? 'مُتاح فقط للشحنات المرتبطة بحسابك' : 'Only available for your own shipments'}
              </span>
            </div>
          )}

          {/* Order Details (Owner verified) */}
          {order && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Timeline Steps */}
              <div className="section-card" style={{ padding: '1.25rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                  {steps.map((step, i) => {
                    const isDone = i <= currentIdx;
                    return (
                      <React.Fragment key={step.key}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1, zIndex: 2 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: isDone ? 'var(--gold)' : 'var(--bg-input)',
                            border: `2px solid ${isDone ? 'var(--gold)' : 'var(--bg-border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            boxShadow: isDone ? '0 0 10px rgba(212,175,55,0.4)' : 'none'
                          }}>
                            {isDone ? <CheckCircle size={15} style={{ color: '#050505' }} /> : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{i + 1}</span>}
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            color: isDone ? 'var(--gold)' : 'var(--text-muted)',
                            fontWeight: isDone ? 800 : 500,
                            textAlign: 'center', lineHeight: 1.2
                          }}>
                            {step.label}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div style={{
                            flex: 1, height: 3,
                            background: i < currentIdx ? 'var(--gold)' : 'var(--bg-border)',
                            marginBottom: '1.3rem', transition: 'background 0.3s ease'
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Order Meta Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div className="section-card" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <User size={12} /> {isRtl ? 'اسم المستلم' : 'Recipient Name'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {order.recipientName || order.recipient_name || order.customerName || '—'}
                  </div>
                </div>

                <div className="section-card" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <MapPin size={12} /> {isRtl ? 'المدينة والعنوان' : 'City & Address'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {order.deliveryCity || order.delivery_city || order.customerAddress || '—'}
                  </div>
                </div>

                <div className="section-card" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <Clock size={12} /> {isRtl ? 'تاريخ التسجيل' : 'Date Created'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : '—'}
                  </div>
                </div>

                <div className="section-card" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <Truck size={12} /> {isRtl ? 'المندوب المسؤول' : 'Courier Assigned'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--gold)' }}>
                    {order.courierName || order.courier_name || (isRtl ? 'لم يُحدد بعد' : 'Unassigned')}
                  </div>
                </div>
              </div>

              {/* Goods & Financial Summary */}
              <div className="section-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={13} /> {isRtl ? 'تفاصيل البضاعة' : 'Goods Details'}
                  </span>
                  <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                    {order.orderStatus || order.status || 'معلق'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {order.goodsDescription || order.goods_description || (isRtl ? 'لا يوجد وصف تفصيلي' : 'No description')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--bg-border)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'إجمالي المتبقي:' : 'Amount Due:'}</span>
                  <span style={{ fontWeight: 900, color: (order.amountRemaining || 0) > 0 ? '#f87171' : '#34d399' }}>
                    {(order.amountRemaining || 0).toLocaleString()} YER
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
