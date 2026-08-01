import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, PlusCircle, FileText, Clock, CheckCircle2, ArrowLeft, ArrowRight,
  TrendingDown, DollarSign, Truck, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { getCollection } from '../../lib/supabase';

const STATUS_AR_EN: Record<string, string> = {
  'معلق': 'Pending Review',
  'في الطريق': 'In Transit',
  'تم التسليم': 'Delivered',
  'تم تسجيل الطلب': 'Registered',
  'وصل مركز التوزيع': 'At Distribution Center',
  'خرج للتوصيل': 'Out for Delivery',
  'مرجع': 'Returned',
};

function statusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('تم التسليم') || s.includes('delivered')) return '#34d399';
  if (s.includes('مرجع') || s.includes('return')) return '#f87171';
  if (s.includes('معلق') || s.includes('pending')) return '#fbbf24';
  return 'var(--gold)';
}

export default function CustomerDashboard() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, balance: 0, returned: 0 });

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const linkedAccId = (user.linkedAccId || user.linkedCustomerId || '').toLowerCase();
      const uid = (user.uid || '').toLowerCase();
      const fullName = (user.fullName || '').trim().toLowerCase();
      const phone = (user.phone || '').replace(/\s+/g, '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      const allOrders = await getCollection('orders');

      const matched = allOrders.filter((ord: any) => {
        const custId = String(ord.customerId || '').toLowerCase();
        const custUid = String(ord.customerUid || '').toLowerCase();
        const custName = String(ord.customerName || '').trim().toLowerCase();
        const custPhone = String(ord.customerPhone || '').replace(/\s+/g, '').toLowerCase();
        const custEmail = String(ord.customerEmail || '').toLowerCase();
        const portalUid = String(ord.portalUid || '').toLowerCase();

        return (
          (linkedAccId && (custId === linkedAccId || custUid === linkedAccId)) ||
          (uid && (custId === uid || custUid === uid || portalUid === uid)) ||
          (fullName && custName === fullName) ||
          (phone && phone.length >= 7 && custPhone === phone) ||
          (email && custEmail === email)
        );
      });

      matched.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

      const total = matched.length;
      const delivered = matched.filter((o: any) =>
        (o.orderStatus || o.status || '').includes('تم التسليم') ||
        (o.orderStatus || o.status || '').toLowerCase().includes('delivered')
      ).length;
      const returned = matched.filter((o: any) =>
        (o.orderStatus || o.status || '').includes('مرجع') ||
        (o.orderStatus || o.status || '').toLowerCase().includes('return')
      ).length;
      const active = total - delivered - returned;

      setOrders(matched.slice(0, 6));
      setStats({ total, active: Math.max(0, active), delivered, balance: user?.financialBalance || 0, returned });
    } catch (err) {
      console.error('[CustomerDashboard] Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Welcome Header ─────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div className="gold-line-top" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              {tr('welcome')} {user?.fullName}! 👋
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isRtl
                ? `لديك ${stats.total} طلب — ${stats.active} نشط و${stats.delivered} تم تسليمه`
                : `You have ${stats.total} orders — ${stats.active} active, ${stats.delivered} delivered`
              }
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={loadDashboard} title={isRtl ? 'تحديث' : 'Refresh'}>
              <RefreshCw size={14} />
            </button>
            <Link to="/portal/customer/orders" className="btn btn-outline btn-sm">
              {isRtl ? 'كل طلباتي' : 'All My Orders'}
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
            <Link to="/portal/customer/new-order" className="btn btn-gold">
              <PlusCircle size={16} />
              {tr('newOrder')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '1rem' }}>
        {[
          {
            label: isRtl ? 'إجمالي الطلبات' : 'Total Orders',
            val: stats.total,
            icon: <Package size={20} />,
            color: '#d4af37',
            bg: 'rgba(212,175,55,0.08)',
            link: '/portal/customer/orders'
          },
          {
            label: isRtl ? 'نشطة / قيد التسليم' : 'Active / In Transit',
            val: stats.active,
            icon: <Truck size={20} />,
            color: '#fbbf24',
            bg: 'rgba(245,158,11,0.08)',
            link: '/portal/customer/orders'
          },
          {
            label: isRtl ? 'تم التسليم' : 'Delivered',
            val: stats.delivered,
            icon: <CheckCircle2 size={20} />,
            color: '#34d399',
            bg: 'rgba(16,185,129,0.08)',
            link: '/portal/customer/orders'
          },
          {
            label: isRtl ? 'مرجعة / ملغاة' : 'Returned / Cancelled',
            val: stats.returned,
            icon: <AlertCircle size={20} />,
            color: '#f87171',
            bg: 'rgba(239,68,68,0.08)',
            link: '/portal/customer/orders'
          },
          {
            label: isRtl ? 'الرصيد القائم' : 'Account Balance',
            val: `${Math.abs(stats.balance).toLocaleString()} YER`,
            icon: <DollarSign size={20} />,
            color: '#60a5fa',
            bg: 'rgba(59,130,246,0.08)',
            link: '/portal/customer/ledger'
          },
        ].map((card, i) => (
          <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate(card.link)}>
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-value" style={{ color: card.color }}>{card.val}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Recent Orders Table ─────────────────────────────────────────── */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'var(--gold)' }} />
            {isRtl ? 'آخر الطلبات المسجلة' : 'Recent Orders'}
          </h2>
          <Link
            to="/portal/customer/orders"
            style={{ fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            {isRtl ? 'عرض الكل' : 'View All'} {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </Link>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>{tr('noOrders')}</p>
            <Link to="/portal/customer/new-order" className="btn btn-gold btn-sm" style={{ marginTop: '0.75rem' }}>
              <PlusCircle size={14} /> {tr('newOrder')}
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{isRtl ? 'رقم الطلب' : 'Order #'}</th>
                  <th>{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th>{isRtl ? 'المستلم / العنوان' : 'Recipient'}</th>
                  <th>{isRtl ? 'الحالة' : 'Status'}</th>
                  <th>{isRtl ? 'الإجمالي' : 'Total'}</th>
                  <th>{isRtl ? 'المتبقي' : 'Due'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord: any) => {
                  const status = ord.orderStatus || ord.status || 'معلق';
                  const statusLabel = STATUS_AR_EN[status] || status;
                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                        {ord.orderNumber || ord.trackingNumber || ord.id?.slice(0, 10)}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{ord.recipientName || ord.customerName || '—'}</div>
                        {ord.deliveryCity && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ord.deliveryCity}</div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.73rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem',
                          backgroundColor: `${statusColor(status)}18`,
                          color: statusColor(status),
                          border: `1px solid ${statusColor(status)}30`,
                          whiteSpace: 'nowrap'
                        }}>
                          {isRtl ? status : statusLabel}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {(ord.totalAmount || ord.totalAmountYER || ord.totalPrice || ord.estimatedCost || 0).toLocaleString()} {ord.currency || 'YER'}
                      </td>
                      <td style={{ fontWeight: 700, color: (ord.amountRemaining || 0) > 0 ? '#f87171' : '#34d399' }}>
                        {(ord.amountRemaining || 0).toLocaleString()} {ord.currency || 'YER'}
                      </td>
                      <td>
                        <Link to="/portal/customer/orders" className="btn btn-ghost btn-sm">
                          <Eye size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          {
            title: isRtl ? 'إنشاء طلب جديد' : 'New Order',
            desc: isRtl ? 'أضف طلب شراء أو شحن جديد' : 'Add a new purchase or shipping order',
            icon: <PlusCircle size={22} style={{ color: 'var(--gold)' }} />,
            link: '/portal/customer/new-order',
            accent: 'var(--gold)',
          },
          {
            title: isRtl ? 'طلباتي' : 'My Orders',
            desc: isRtl ? 'عرض وتتبع كافة طلباتك' : 'View and track all your orders',
            icon: <Package size={22} style={{ color: '#60a5fa' }} />,
            link: '/portal/customer/orders',
            accent: '#60a5fa',
          },
          {
            title: isRtl ? 'كشف الحساب' : 'Account Ledger',
            desc: isRtl ? 'حركة حسابك المالي والمدفوعات' : 'Financial statement and payments',
            icon: <FileText size={22} style={{ color: '#34d399' }} />,
            link: '/portal/customer/ledger',
            accent: '#34d399',
          },
        ].map((action, i) => (
          <div
            key={i}
            className="glass-card"
            onClick={() => navigate(action.link)}
            style={{
              padding: '1.2rem',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              borderColor: `${action.accent}25`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ background: `${action.accent}12`, padding: '0.5rem', borderRadius: '0.5rem' }}>
                {action.icon}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {action.title}
              </div>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
