import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, PlusCircle, Clock, CheckCircle2, Truck, RefreshCw, Eye,
  Megaphone, Wallet, ArrowLeft, ArrowRight, Search, ShieldCheck, ArrowDownLeft,
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { portalAuthGateway } from '../../api/portalAuthGateway';
import type {
  PortalOrderDto,
  PortalCustomerBalanceDto,
  PortalLedgerEntryDto,
  PortalAnnouncementDto,
} from '../../api/portalAuthGateway';
import CustomerTrackModal from '../../components/customer/CustomerTrackModal';

/** لون شارة الحالة حسب نص الحالة المسطّح (عربي/إنجليزي). */
function statusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('تم التسليم') || s.includes('delivered')) return '#34d399';
  if (s.includes('مرجع') || s.includes('return') || s.includes('ملغي') || s.includes('cancelled')) return '#f87171';
  if (s.includes('معلق') || s.includes('pending')) return '#fbbf24';
  return 'var(--gold)';
}

/** تصنيف حالة الطلب إلى دلاء اللوحة: مسلّم / مرجع-ملغى / نشط. */
function classify(order: PortalOrderDto): 'delivered' | 'returned' | 'active' {
  const s = `${order.orderStatus || order.status || ''}`.toLowerCase();
  if (s.includes('تم التسليم') || s.includes('delivered')) return 'delivered';
  if (s.includes('مرجع') || s.includes('return') || s.includes('ملغي') || s.includes('cancel')) return 'returned';
  return 'active';
}

const PRIORITY_TONE: Record<PortalAnnouncementDto['priority'], string> = {
  urgent: '#f87171',
  high: '#fbbf24',
  normal: 'var(--gold)',
};

export default function CustomerDashboard() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<PortalOrderDto[]>([]);
  const [balance, setBalance] = useState<PortalCustomerBalanceDto | null>(null);
  const [ledger, setLedger] = useState<PortalLedgerEntryDto[]>([]);
  const [announcements, setAnnouncements] = useState<PortalAnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [trackInput, setTrackInput] = useState('');
  const [activeTrackNum, setActiveTrackNum] = useState<string | null>(null);

  const handleTrackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (trackInput.trim()) setActiveTrackNum(trackInput.trim());
  };

  // كل القراءات مقيّدة بالملكية على الخادم؛ المتصفح لا يحسب أي ربح/تكلفة/معدّل.
  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!portalAuthGateway) return;
      const [ordersR, balanceR, ledgerR, annR] = await Promise.allSettled([
        portalAuthGateway.listCustomerOrders(),
        portalAuthGateway.getCustomerBalance(),
        portalAuthGateway.listCustomerLedger(),
        portalAuthGateway.listAnnouncements(),
      ]);
      if (ordersR.status === 'fulfilled') setOrders(ordersR.value);
      if (balanceR.status === 'fulfilled') setBalance(balanceR.value);
      if (ledgerR.status === 'fulfilled') setLedger(ledgerR.value);
      if (annR.status === 'fulfilled') setAnnouncements(annR.value);
    } catch (err) {
      console.error('[CustomerDashboard] Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const counts = orders.reduce(
    (acc, o) => { acc[classify(o)] += 1; return acc; },
    { delivered: 0, returned: 0, active: 0 } as Record<'delivered' | 'returned' | 'active', number>,
  );
  const recentOrders = orders.slice(0, 5);
  const recentMovements = ledger.slice(0, 5);
  // العملة تُحلّ من رصيد الحساب؛ لا أحرف ثابتة YER/SAR/USD.
  const currencySymbol = balance?.currency.symbol ?? '';
  const amount = (value: number) => `${Math.abs(value).toLocaleString()}${currencySymbol ? ` ${currencySymbol}` : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── ترحيب ── Welcome Header */}
      <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div className="gold-line-top" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              {tr('welcome')} {user?.fullName}! 👋
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isRtl
                ? `لديك ${orders.length} طلب — ${counts.active} نشط و${counts.delivered} تم تسليمه`
                : `You have ${orders.length} orders — ${counts.active} active, ${counts.delivered} delivered`}
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

      {/* ── تتبّع سريع ── Quick Secure Tracking Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold)', fontWeight: 800, fontSize: '0.85rem' }}>
            <ShieldCheck size={18} />
            <span>{tr('securedTracking')}</span>
          </div>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: '0.4rem', background: 'var(--bg-input)', borderRadius: '0.6rem', border: '1px solid var(--bg-border)', padding: '0.2rem 0.5rem' }}>
            <input
              type="text"
              value={trackInput}
              onChange={e => setTrackInput(e.target.value)}
              placeholder={tr('quickTrackPlaceholder')}
              style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'var(--font-main)' }}
            />
            <button type="submit" className="btn btn-gold btn-sm" style={{ gap: '0.3rem', flexShrink: 0 }}>
              <Search size={13} /> {tr('trackNow')}
            </button>
          </div>
        </form>
      </div>

      {/* ── بطاقات: إجمالي/قيد المعالجة/المسلّمة + الرصيد ── KPI cards (no fixed currency name) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '1rem' }}>
        {[
          { label: isRtl ? 'إجمالي الطلبات' : 'Total Orders', val: String(orders.length), icon: <Package size={20} />, color: '#d4af37', bg: 'rgba(212,175,55,0.08)', link: '/portal/customer/orders' },
          { label: isRtl ? 'قيد المعالجة' : 'Processing', val: String(counts.active), icon: <Truck size={20} />, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', link: '/portal/customer/orders' },
          { label: isRtl ? 'تم التسليم' : 'Delivered', val: String(counts.delivered), icon: <CheckCircle2 size={20} />, color: '#34d399', bg: 'rgba(16,185,129,0.08)', link: '/portal/customer/orders' },
          { label: isRtl ? 'الرصيد' : 'Balance', val: balance ? amount(balance.balance) : '—', icon: <Wallet size={20} />, color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', link: '/portal/customer/finance' },
        ].map((card, i) => (
          <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate(card.link)}>
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.val}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── آخر 5 طلبات ── Recent Orders (max 5) */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'var(--gold)' }} />
            {isRtl ? 'آخر الطلبات' : 'Recent Orders'}
          </h2>
          <Link to="/portal/customer/orders" style={{ fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {isRtl ? 'عرض الكل' : 'View All'} {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </Link>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : recentOrders.length === 0 ? (
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
                  <th>{isRtl ? 'المستلم' : 'Recipient'}</th>
                  <th>{isRtl ? 'الحالة' : 'Status'}</th>
                  <th>{isRtl ? 'المستحق' : 'Payable'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => {
                  const status = ord.orderStatus || ord.status || 'معلق';
                  const payable = Number(ord.payableAmount ?? ord.totalAmount ?? 0);
                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                        {ord.orderNumber || ord.trackingNumber || ord.id.slice(0, 10)}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{String(ord.recipientName ?? ord.customerName ?? '—')}</td>
                      <td>
                        <span style={{
                          fontSize: '0.73rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem',
                          backgroundColor: `${statusColor(status)}18`, color: statusColor(status),
                          border: `1px solid ${statusColor(status)}30`, whiteSpace: 'nowrap',
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{amount(payable)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setActiveTrackNum(ord.orderNumber || ord.trackingNumber || ord.id)}
                          title={isRtl ? 'تتبع تفصيلي' : 'Track Order'}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── آخر الحركات + إعلانات ── Last movements + announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="section-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
            <ArrowDownLeft size={16} style={{ color: 'var(--gold)' }} />
            {isRtl ? 'آخر الحركات' : 'Recent Movements'}
          </h2>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner-lg" /></div>
          ) : recentMovements.length === 0 ? (
            <div className="empty-state">
              <Wallet size={34} />
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{isRtl ? 'لا حركات بعد' : 'No movements yet'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentMovements.map((m) => (
                <div key={m.entryId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', background: 'var(--bg-input)', borderRadius: '0.6rem', border: '1px solid var(--bg-border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.description || m.transType}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {m.entryNumber} · {new Date(m.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{amount(m.amountOriginal)}</div>
                </div>
              ))}
              <Link to="/portal/customer/finance" style={{ fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 700 }}>
                {isRtl ? 'عرض الحساب المالي' : 'View full finance'}
              </Link>
            </div>
          )}
        </div>

        <div className="section-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
            <Megaphone size={16} style={{ color: 'var(--gold)' }} />
            {isRtl ? 'إعلانات' : 'Announcements'}
          </h2>
          {announcements.length === 0 ? (
            <div className="empty-state">
              <Megaphone size={34} />
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{isRtl ? 'لا إعلانات حالياً' : 'No announcements'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {announcements.slice(0, 5).map((a) => (
                <div key={a.id} style={{ padding: '0.65rem 0.75rem', background: 'var(--bg-input)', borderRadius: '0.6rem', borderLeft: `3px solid ${PRIORITY_TONE[a.priority]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: 800, color: 'var(--text-primary)' }}>{a.title}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(a.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.3rem 0 0', lineHeight: 1.5 }}>{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── إجراءات سريعة ── Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { title: isRtl ? 'إنشاء طلب جديد' : 'New Order', desc: isRtl ? 'أضف طلب شراء أو شحن جديد' : 'Add a new purchase or shipping order', icon: <PlusCircle size={22} style={{ color: 'var(--gold)' }} />, link: '/portal/customer/new-order', accent: 'var(--gold)' },
          { title: isRtl ? 'طلباتي' : 'My Orders', desc: isRtl ? 'عرض وتتبع كافة طلباتك' : 'View and track all your orders', icon: <Package size={22} style={{ color: '#60a5fa' }} />, link: '/portal/customer/orders', accent: '#60a5fa' },
          { title: isRtl ? 'الشحن والرصيد' : 'Finance', desc: isRtl ? 'الرصيد والمدفوعات والحركات' : 'Balance, payments and movements', icon: <Wallet size={22} style={{ color: '#34d399' }} />, link: '/portal/customer/finance', accent: '#34d399' },
        ].map((action, i) => (
          <div
            key={i}
            className="glass-card"
            onClick={() => navigate(action.link)}
            style={{ padding: '1.2rem', cursor: 'pointer', transition: 'transform 0.15s ease', borderColor: `${action.accent}25` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ background: `${action.accent}12`, padding: '0.5rem', borderRadius: '0.5rem' }}>{action.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{action.title}</div>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>{action.desc}</p>
          </div>
        ))}
      </div>

      {activeTrackNum && (
        <CustomerTrackModal trackingNum={activeTrackNum} onClose={() => setActiveTrackNum(null)} />
      )}
    </div>
  );
}
