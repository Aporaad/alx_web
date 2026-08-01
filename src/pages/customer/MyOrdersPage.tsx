/**
 * MyOrdersPage.tsx — Unified Customer Orders Page (Portal)
 *
 * Merges "My Orders" list view and "New Order" creation form into one page.
 * Order creation form matches Orders.tsx (core system) field-for-field,
 * minus internal company-only fields (profit rates, exchange management, courier assignment).
 *
 * KEY RULES:
 *  - All reads/writes use ONLY the `orders` table. portal_orders is DEPRECATED.
 *  - On customer save: status = 'معلق' (pending). NO financial journal entries posted.
 *  - Financial entries are posted only after employee approval in the core system.
 *  - All exchange rates & default fees are fetched dynamically from DB settings.
 *  - Delivery courier fee and company profit are merged into the single customer-visible "رسوم الشحن والتوصيل والخدمات" line.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Package, Search, Eye, X, PlusCircle, MapPin,
  Calculator, CheckCircle2, User, Plus, Trash2,
  Shield, Receipt, DollarSign, Zap, Gift, Sparkles,
  CreditCard, Info, ExternalLink, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import {
  getCollection,
  insertDoc
} from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
  productUrl: string;
  quantity: number;
  productPrice: number;
  weight: number;
  cbm: number;
  length: number;
  width: number;
  height: number;
  trackingNumber: string;
}

const emptyItem = (): OrderItem => ({
  id: Math.random().toString(36).slice(2),
  productName: '', productUrl: '',
  quantity: 1, productPrice: 0,
  weight: 0, cbm: 0,
  length: 0, width: 0, height: 0,
  trackingNumber: ''
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Auto-generate order number ALX-YYMM-XXXX */
function genOrderNumber() {
  const now = new Date();
  const YY = String(now.getFullYear()).slice(-2);
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const RND = Math.floor(1000 + Math.random() * 9000);
  return `ALX-${YY}${MM}-${RND}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyOrdersPage({
  initialMode = 'list'
}: {
  initialMode?: 'list' | 'create'
}) {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();
  const location = useLocation();

  // Determine starting tab
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(() => {
    const qs = new URLSearchParams(location.search);
    if (
      qs.get('new') === 'true' ||
      initialMode === 'create' ||
      location.pathname.endsWith('/new-order')
    ) return 'create';
    return 'list';
  });

  // ── List state ──────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsOrder, setDetailsOrder] = useState<any | null>(null);

  // ── DB Settings & Sources ──────────────────────────────────────────────────
  const [sources, setSources] = useState<any[]>([]);
  const [dbSettings, setDbSettings] = useState<any>({
    exchangeRateSAR: 140,
    exchangeRateUSD: 535,
    defaultDeliveryFee: 4000,
    defaultCompanyProfitRate: 12,
    defaultPackagingFee: 0,
  });

  // ── Form state ──────────────────────────────────────────────────────────────
  const [orderSourceId, setOrderSourceId] = useState('');
  const [orderSourceName, setOrderSourceName] = useState('');
  const [orderSourceType, setOrderSourceType] = useState('App');
  const [externalOrderNumber, setExternalOrderNumber] = useState('');
  const [globalTrackingNumber, setGlobalTrackingNumber] = useState('');
  const [cartShareCode, setCartShareCode] = useState('');

  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);

  const [packagingType, setPackagingType] = useState<'normal' | 'gift' | 'vip'>('normal');
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'Wallet'>('Cash');
  const [amountPaidYER, setAmountPaidYER] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Load orders, sources & settings ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadSources();
    loadDbSettings();
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      // Collect all possible identifiers for this customer
      const linkedAccId = (user.linkedAccId || user.linkedCustomerId || '').toLowerCase();
      const uid = (user.uid || '').toLowerCase();
      const fullName = (user.fullName || '').trim().toLowerCase();
      const phone = (user.phone || '').replace(/\s+/g, '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      // Fetch ALL orders once, filter client-side — most reliable approach
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
      setOrders(matched);
    } catch (err) {
      console.error('[MyOrdersPage] Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);


  const loadSources = async () => {
    try {
      const list = await getCollection('sources');
      setSources(list || []);
    } catch (_) { }
  };

  const loadDbSettings = async () => {
    try {
      const setList = await getCollection('settings');
      if (Array.isArray(setList) && setList.length > 0) {
        const general = setList.find((s: any) => s.id === 'general') || setList[0];
        setDbSettings({
          exchangeRateSAR: Number(general.exchangeRateSAR || general.exchangeRateYER) || 390,
          exchangeRateUSD: Number(general.exchangeRateUSD) || 535,
          defaultDeliveryFee: Number(general.defaultDeliveryFee || general.defaultDeliveryRate) || 4000,
          defaultCompanyProfitRate: Number(general.defaultCompanyProfitRate) || 12,
          defaultPackagingFee: Number(general.defaultPackagingFee) || 0,
        });
      }
    } catch (_) { }
  };

  // ── Customer stats ───────────────────────────────────────────────────────────
  const customerStats = useMemo(() => {
    const last = orders[0];
    return {
      totalOrders: orders.length,
      lastOrderDate: last?.createdAt
        ? new Date(last.createdAt).toLocaleDateString('en-GB')
        : '—',
      lastOrderRef: last?.orderNumber || last?.trackingNumber || '—',
    };
  }, [orders]);

  // ── Source selection ─────────────────────────────────────────────────────────
  const handleSelectSource = (id: string) => {
    setOrderSourceId(id);
    const found = sources.find(s => s.id === id);
    setOrderSourceName(found?.name || found?.source_name || '');
    setOrderSourceType(found?.type || 'App');
  };

  // ── Items table management ────────────────────────────────────────────────────
  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (['length', 'width', 'height'].includes(field)) {
        const l = Number(field === 'length' ? value : updated.length || 0);
        const w = Number(field === 'width' ? value : updated.width || 0);
        const h = Number(field === 'height' ? value : updated.height || 0);
        if (l > 0 && w > 0 && h > 0) {
          updated.cbm = parseFloat(((l * w * h) / 1_000_000).toFixed(6));
        }
      }
      return updated;
    }));
  };

  // ── Financial Calculation Engine (Using DB Settings & System Formulas) ───────
  const calcs = useMemo(() => {
    const productsSum = items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.productPrice) || 0), 0
    );
    const totalWeight = items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.weight) || 0), 0
    );
    const totalCBM = items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.cbm) || 0), 0
    );

    // Packaging Fee (SAR)
    const packagingFeeSAR = packagingType === 'gift' ? 15 : packagingType === 'vip' ? 30 : dbSettings.defaultPackagingFee;
    const totalExternalCostSAR = productsSum + packagingFeeSAR;

    // Base Shipping Cost (SAR)
    let rawShippingCostSAR = 0;
    if (orderSourceType === 'Factory') {
      rawShippingCostSAR = totalWeight * 19;
    } else {
      rawShippingCostSAR = totalWeight > 0 ? totalWeight * 18 : 15;
    }
    if (isUrgent) rawShippingCostSAR += 25;

    // Company Profit Margin (SAR)
    const profitRate = dbSettings.defaultCompanyProfitRate || 12;
    const companyProfitSAR = productsSum * (profitRate / 100);

    // Total Order (SAR) before Yemen Delivery Fee
    const totalOrderSAR = totalExternalCostSAR + rawShippingCostSAR + companyProfitSAR;

    // Convert SAR to YER using DB Exchange Rate
    const exchangeRateYER = dbSettings.exchangeRateSAR || 390;
    const baseTotalOrderYER = totalOrderSAR * exchangeRateYER;

    // Delivery Courier Fee in YER
    const deliveryCourierFeeYER = dbSettings.defaultDeliveryFee || 4000;

    // MERGED SHIPPING & DELIVERY LINE FOR CUSTOMER VIEW:
    // (Combines Raw Shipping SAR converted to YER + Company Profit YER + Yemeni Delivery Fee YER)
    const combinedShippingAndDeliveryCostYER = (rawShippingCostSAR + companyProfitSAR) * exchangeRateYER + deliveryCourierFeeYER;

    // Grand Total Order (YER)
    const totalOrderYER = baseTotalOrderYER + deliveryCourierFeeYER;

    const paid = Number(amountPaidYER) || 0;
    const remainingYER = Math.max(0, totalOrderYER - paid);
    const paymentStatus = remainingYER <= 0 ? 'Paid' : paid > 0 ? 'Partial Paid' : 'Unpaid';

    return {
      productsSum,
      totalWeight,
      totalCBM,
      packagingFeeSAR,
      rawShippingCostSAR,
      companyProfitSAR,
      totalExternalCostSAR,
      totalOrderSAR,
      exchangeRateYER,
      deliveryCourierFeeYER,
      combinedShippingAndDeliveryCostYER,
      totalOrderYER,
      remainingYER,
      paymentStatus
    };
  }, [items, orderSourceType, packagingType, isUrgent, amountPaidYER, dbSettings]);

  // ── Form submission ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validItems = items.filter(i => i.productName.trim());
    if (!validItems.length) {
      setFormError(isRtl
        ? 'يرجى إدخال اسم صنف واحد على الأقل في جدول المنتجات'
        : 'Please enter at least one product in the items table');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const orderNumber = genOrderNumber();
      const trackingNumber = globalTrackingNumber.trim() || orderNumber;
      const now = Date.now();
      const orderId = `ord_${orderNumber}`;
      const goodsDescription = validItems.map(i => `${i.productName} (${i.quantity})`).join('، ');

      const payload: Record<string, any> = {
        orderNumber,
        trackingNumber,

        customerId: user.linkedAccId || user.uid,
        customerName: user.fullName,
        customerPhone: user.phone,
        customerAddress: user.address || '',
        customerEmail: user.email,
        customerUid: user.uid,

        recipientName: user.fullName,
        recipientPhone: user.phone,

        orderSourceId,
        orderSourceName: orderSourceName || 'تطبيق عام',
        orderSourceType,
        externalOrderNumber,
        cartShareCode,

        items: validItems,
        goodsDescription,
        totalWeight: calcs.totalWeight,
        totalCBM: calcs.totalCBM,

        packagingType,
        packagingFee: calcs.packagingFeeSAR,
        isUrgent,
        packageType: isUrgent ? 'express' : 'standard',

        currency: 'SAR',
        productsSum: calcs.productsSum,
        shippingCostSAR: calcs.rawShippingCostSAR,
        companyProfitSAR: calcs.companyProfitSAR,
        totalCostSAR: calcs.totalOrderSAR,

        exchangeRateYER: calcs.exchangeRateYER,
        deliveryCourierFee: calcs.deliveryCourierFeeYER,
        totalCostYER: calcs.totalOrderYER,
        amountPaid: Number(amountPaidYER) || 0,
        amountRemaining: calcs.remainingYER,
        paymentStatus: calcs.paymentStatus,
        paymentMethod,

        orderStatus: 'معلق',
        status: 'pending',
        source: 'web_portal',
        orderSource: 'web_portal',

        firedTriggers: [],

        notes: notes ? `[بوابة العميل] ${notes}` : 'طلب مسجل عبر بوابة الويب — قيد المراجعة والاعتماد',
        createdByUid: user.uid,
        createdByName: `${user.fullName} (بوابة الويب)`,
        createdAt: now,
        updatedAt: now,
      };

      await insertDoc('orders', orderId, payload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('list');
        loadOrders();
        setItems([emptyItem()]);
        setOrderSourceId(''); setOrderSourceName(''); setOrderSourceType('App');
        setExternalOrderNumber(''); setGlobalTrackingNumber(''); setCartShareCode('');
        setPackagingType('normal'); setIsUrgent(false); setNotes('');
        setAmountPaidYER(0);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || tr('error'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered orders list ──────────────────────────────────────────────────────
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

      {/* ── Top Header + Tab Toggle ─────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', position: 'relative'
      }}>
        <div className="gold-line-top" />
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            {activeTab === 'list' ? tr('myOrders') : tr('newOrderTitle')}
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {activeTab === 'list'
              ? (isRtl ? 'متابعة حالة وفاتورة جميع شحناتك المسجلة في النظام' : 'Track status and invoices of all your registered orders')
              : (isRtl ? 'نموذج طلب شراء وشحن جديد مع احتساب الفاتورة آلياً' : 'New purchase & shipment request with auto invoice calculation')}
          </p>
        </div>

        {/* Tab Switch */}
        <div style={{
          display: 'flex', gap: '0.4rem',
          background: 'var(--bg-input)', padding: '0.3rem',
          borderRadius: '0.75rem', border: '1px solid var(--bg-border)'
        }}>
          {(['list', 'create'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '0.55rem', border: 'none',
              background: activeTab === tab ? 'var(--gold)' : 'transparent',
              color: activeTab === tab ? '#000' : 'var(--text-secondary)',
              fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.18s'
            }}>
              {tab === 'list' ? <Package size={14} /> : <PlusCircle size={14} />}
              {tab === 'list' ? `${tr('myOrders')} (${orders.length})` : tr('newOrder')}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: MY ORDERS LIST */}
      {activeTab === 'list' && (
        <>
          <div className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-input-icon-wrapper" style={{ flex: 1, minWidth: 180 }}>
              <Search className="form-input-icon" />
              <input type="text" className="form-input" value={search}
                onChange={e => setSearch(e.target.value)} placeholder={tr('search')} />
            </div>
            <select className="form-select" style={{ width: 'auto', minWidth: 170 }}
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">{isRtl ? 'الكل' : 'All Statuses'}</option>
              <option value="معلق">{isRtl ? 'معلق — قيد المراجعة' : 'Pending Review'}</option>
              <option value="تم تسجيل الطلب واستخلاص الفاتورة">{isRtl ? 'تم الاعتماد — معالجة' : 'Approved'}</option>
              <option value="وصل مستودع السعودية">{isRtl ? 'وصل السعودية' : 'Arrived KSA'}</option>
              <option value="جاري الشحن لليمن">{isRtl ? 'في الشحن' : 'Shipping'}</option>
              <option value="وصل مركز التوزيع في اليمن">{isRtl ? 'وصل اليمن' : 'Arrived Yemen'}</option>
              <option value="مع المندوب للتوصيل">{isRtl ? 'مع المندوب' : 'Out for Delivery'}</option>
              <option value="تم التسليم">{isRtl ? 'تم التسليم' : 'Delivered'}</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={loadOrders}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingOrders ? (
              <div className="empty-state"><div className="spinner spinner-lg" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <Package size={42} style={{ opacity: 0.5 }} />
                <p>{tr('noOrders')}</p>
                <button className="btn btn-gold btn-sm" style={{ marginTop: '0.6rem' }}
                  onClick={() => setActiveTab('create')}>
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
                        <td style={{ fontSize: '0.78rem' }}>
                          {new Date(ord.createdAt || Date.now()).toLocaleDateString('en-GB')}
                        </td>
                        <td>
                          <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                            {ord.orderSourceName || ord.orderSourceType || 'عام'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge status-${ord.status || 'pending'}`} style={{ fontSize: '0.7rem' }}>
                            {ord.orderStatus || ord.status || 'معلق'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.8rem' }}>
                          {(ord.totalCostYER || ord.totalOrderYER || 0).toLocaleString()} YER
                        </td>
                        <td style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem' }}>
                          {(ord.amountPaid || 0).toLocaleString()}
                        </td>
                        <td style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>
                          {(ord.amountRemaining || 0).toLocaleString()} YER
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDetailsOrder(ord)}>
                            <Eye size={13} /> {tr('viewDetails')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: NEW ORDER FORM */}
      {activeTab === 'create' && (
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
          {success ? (
            <div className="glass-card animate-scale-in" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <CheckCircle2 size={56} style={{ color: '#34d399', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {tr('orderSuccess')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {isRtl
                  ? 'تم حفظ طلبك بحالة "معلق"، وسيتم مراجعته واستخلاص الفاتورة واعتاده من قبل الشركة.'
                  : 'Your order was saved as Pending. Staff will review and confirm it shortly.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {formError && (
                <div className="alert alert-error" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              {/* Customer Profile Read-Only */}
              <div className="glass-card" style={{ padding: '1.25rem', position: 'relative' }}>
                <div className="gold-line-top" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <User size={15} /> {isRtl ? 'بيانات صاحب الطلب (غير قابلة للتعديل)' : 'Account Holder Profile (Read-Only)'}
                  </h3>
                  <span className="badge badge-muted" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Shield size={10} /> {isRtl ? 'موثق' : 'Verified'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', fontSize: '0.8rem' }}>
                  {[
                    { label: isRtl ? 'الاسم الكامل' : 'Full Name', value: user?.fullName, mono: false },
                    { label: isRtl ? 'رقم الهاتف' : 'Phone', value: user?.phone, mono: true },
                    { label: isRtl ? 'البريد الإلكتروني' : 'Email', value: user?.email, mono: false },
                    { label: isRtl ? 'العنوان المسجل' : 'Address', value: user?.address || '—', mono: false },
                    { label: isRtl ? 'إجمالي الطلبات' : 'Total Orders', value: `${customerStats.totalOrders} طلبات`, mono: false },
                    { label: isRtl ? 'آخر طلب' : 'Last Order', value: customerStats.lastOrderDate, mono: false },
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.15rem', fontSize: '0.7rem', fontWeight: 700 }}>{label}</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order ID & Source */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                  <Receipt size={15} /> {isRtl ? 'معلومات الطلب ومصدر الشراء' : 'Order Details & Purchase Source'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'مصدر الشراء / التطبيق' : 'Purchase Source / App'}</label>
                    <select className="form-select" value={orderSourceId} onChange={e => handleSelectSource(e.target.value)}>
                      <option value="">{isRtl ? 'تطبيق عام (App)' : 'General App (App)'}</option>
                      {sources.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.source_name} ({s.type || 'App'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'رقم الفاتورة الأصلي / رقم سلة' : 'Original Invoice / Cart #'}</label>
                    <input type="text" className="form-input" dir="ltr"
                      value={externalOrderNumber} onChange={e => setExternalOrderNumber(e.target.value)}
                      placeholder="SHEIN-884210 / SLA-12345" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'رقم التتبع الدولي (اختياري)' : 'Intl. Tracking # (optional)'}</label>
                    <input type="text" className="form-input" dir="ltr"
                      value={globalTrackingNumber} onChange={e => setGlobalTrackingNumber(e.target.value)}
                      placeholder="JT2024000XXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'كود السلة الموحد' : 'Unified Cart Code'}</label>
                    <input type="text" className="form-input" dir="ltr"
                      value={cartShareCode} onChange={e => setCartShareCode(e.target.value)}
                      placeholder="CART-XXXX" />
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Package size={15} /> {isRtl ? 'جدول المنتجات والأصناف (تفاصيل البضاعة)' : 'Products & Items Grid'}
                  </h3>
                  <button type="button" className="btn btn-outline btn-sm"
                    onClick={() => setItems(prev => [...prev, emptyItem()])}>
                    <Plus size={13} /> {isRtl ? 'إضافة صنف' : 'Add Item'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {items.map((item, idx) => (
                    <div key={item.id} className="section-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold)' }}>
                          #{idx + 1} {item.productName || (isRtl ? 'صنف جديد' : 'New Item')}
                        </span>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
                            onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1fr 1.2fr', gap: '0.5rem' }}>
                        <input required type="text" className="form-input"
                          placeholder={isRtl ? 'اسم المنتج *' : 'Product Name *'}
                          value={item.productName}
                          onChange={e => handleItemChange(item.id, 'productName', e.target.value)} />
                        <input type="url" className="form-input" dir="ltr"
                          placeholder={isRtl ? 'رابط المنتج URL' : 'Product Link URL'}
                          value={item.productUrl}
                          onChange={e => handleItemChange(item.id, 'productUrl', e.target.value)} />
                        <input required type="number" min="1" className="form-input" dir="ltr"
                          placeholder={isRtl ? 'الكمية' : 'Qty'}
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} />
                        <input required type="number" min="0" step="0.5" className="form-input" dir="ltr"
                          placeholder={isRtl ? 'السعر (SAR)' : 'Price (SAR)'}
                          value={item.productPrice || ''}
                          onChange={e => handleItemChange(item.id, 'productPrice', parseFloat(e.target.value) || 0)} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                            {isRtl ? 'الوزن (KG)' : 'Weight (kg)'}
                          </div>
                          <input type="number" step="0.1" min="0" className="form-input" dir="ltr"
                            value={item.weight || ''} placeholder="0.0"
                            onChange={e => handleItemChange(item.id, 'weight', parseFloat(e.target.value) || 0)} />
                        </div>
                        {[
                          { field: 'length' as keyof OrderItem, label: isRtl ? 'الطول (سم)' : 'L (cm)' },
                          { field: 'width' as keyof OrderItem, label: isRtl ? 'العرض (سم)' : 'W (cm)' },
                          { field: 'height' as keyof OrderItem, label: isRtl ? 'الارتفاع (سم)' : 'H (cm)' },
                        ].map(({ field, label }) => (
                          <div key={field}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>{label}</div>
                            <input type="number" step="0.5" min="0" className="form-input" dir="ltr"
                              value={(item as any)[field] || ''} placeholder="0"
                              onChange={e => handleItemChange(item.id, field, parseFloat(e.target.value) || 0)} />
                          </div>
                        ))}
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                            CBM {isRtl ? '(تلقائي)' : '(auto)'}
                          </div>
                          <input type="text" className="form-input" dir="ltr" readOnly
                            value={item.cbm ? item.cbm.toFixed(4) : '0.0000'} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packaging & Urgency */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                  <Package size={15} /> {isRtl ? 'نوع التغليف وأولوية الشحن' : 'Packaging Type & Shipping Priority'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                  <div>
                    <label className="form-label">{isRtl ? 'نوع التغليف' : 'Packaging Type'}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {([
                        { id: 'normal', label: isRtl ? 'عادي' : 'Standard', sub: isRtl ? '+3 SAR' : '+3 SAR', icon: <Package size={15} /> },
                        { id: 'gift', label: isRtl ? 'هدية' : 'Gift', sub: '+15 SAR', icon: <Gift size={15} /> },
                        { id: 'vip', label: 'VIP', sub: '+30 SAR', icon: <Sparkles size={15} /> },
                      ] as const).map(opt => (
                        <button key={opt.id} type="button"
                          onClick={() => setPackagingType(opt.id)}
                          style={{
                            padding: '0.7rem 0.5rem', borderRadius: '0.6rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                            background: packagingType === opt.id ? 'rgba(212,175,55,0.12)' : 'var(--bg-input)',
                            border: `1px solid ${packagingType === opt.id ? 'var(--gold)' : 'var(--bg-border)'}`,
                            color: packagingType === opt.id ? 'var(--gold)' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
                          }}>
                          {opt.icon}
                          <span>{opt.label}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">{isRtl ? 'أولوية الشحن' : 'Shipping Priority'}</label>
                      <button type="button" onClick={() => setIsUrgent(p => !p)} style={{
                        width: '100%', padding: '0.75rem', borderRadius: '0.6rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                        background: isUrgent ? 'rgba(239,68,68,0.1)' : 'var(--bg-input)',
                        border: `1px solid ${isUrgent ? '#f87171' : 'var(--bg-border)'}`,
                        color: isUrgent ? '#f87171' : 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem'
                      }}>
                        <Zap size={15} />
                        {isRtl ? 'شحن مستعجل إكسبرس (Express)' : 'Urgent / Express Shipment'}
                        {isUrgent && <span style={{ fontSize: '0.68rem', marginInlineStart: 'auto', background: '#f87171', color: '#fff', borderRadius: '4px', padding: '0 4px' }}>+25 SAR</span>}
                      </button>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">{isRtl ? 'ملاحظات الشحنة' : 'Order Notes'}</label>
                      <textarea className="form-input" rows={2}
                        value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder={isRtl ? 'أي تعليمات خاصة للمعالجة أو التوصيل...' : 'Special instructions for handling or delivery...'} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Statement (Merged Courier Fee + Profit Into Single Customer Line) */}
              <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'var(--gold-border)', background: 'rgba(13,13,15,0.97)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <Calculator size={18} /> {isRtl ? 'خلاصة كشف الحساب المالي التفصيلي (الفاتورة التقديرية)' : 'Detailed Financial Invoice Preview'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--bg-border)' }}>
                  {[
                    { label: isRtl ? 'قيمة المنتجات الأصلية:' : 'Original Products Value:', value: `${calcs.productsSum.toLocaleString()} SAR`, highlight: false },
                    { label: isRtl ? 'إجمالي المنتجات المعدل:' : 'Adjusted Products Total:', value: `${calcs.totalExternalCostSAR.toLocaleString()} SAR`, highlight: false },
                    { label: isRtl ? 'رسوم التغليف العامة:' : 'Packaging Fee:', value: `${calcs.packagingFeeSAR.toLocaleString()} SAR`, highlight: false },
                    { label: isRtl ? 'مجموع التكلفة الإجمالية (خارجياً):' : 'Total External Cost:', value: `${calcs.totalExternalCostSAR.toLocaleString()} SAR`, highlight: true },
                    { label: isRtl ? 'رسوم شحن وتوصيل كامل الخدمات والتوصيل (تقديري):' : 'All-Inclusive Shipping & Delivery Fees:', value: `${calcs.combinedShippingAndDeliveryCostYER.toLocaleString()} YER`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px dashed var(--bg-border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <strong style={{ color: highlight ? 'var(--gold)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</strong>
                    </div>
                  ))}
                </div>

                {/* Grand total + payment input + remaining */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>
                      {isRtl ? 'المبلغ النهائي والمستحق إجمالاً' : 'Final Grand Total'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      {calcs.totalOrderYER.toLocaleString()} YER
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      = {calcs.totalOrderSAR.toLocaleString()} SAR × {calcs.exchangeRateYER} + {calcs.deliveryCourierFeeYER.toLocaleString()} YER
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CreditCard size={13} />
                      {isRtl ? 'الدفعة المقدمة / كاش الآن (ريال يمني)' : 'Down Payment / Cash Now (YER)'}
                    </label>
                    <input type="number" min="0" step="500" className="form-input" dir="ltr"
                      value={amountPaidYER || ''}
                      onChange={e => setAmountPaidYER(parseFloat(e.target.value) || 0)}
                      placeholder="0 YER" />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>
                      {isRtl ? 'المديونية المتبقية للدفع' : 'Remaining Balance Due'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      {calcs.remainingYER.toLocaleString()} YER
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className={`badge status-${calcs.paymentStatus === 'Paid' ? 'delivered' : calcs.paymentStatus === 'Partial Paid' ? 'in_progress' : 'pending'}`} style={{ fontSize: '0.7rem' }}>
                        {calcs.paymentStatus === 'Paid'
                          ? (isRtl ? 'مسدد بالكامل' : 'Fully Paid')
                          : calcs.paymentStatus === 'Partial Paid'
                            ? (isRtl ? 'مسدد جزئياً' : 'Partial')
                            : (isRtl ? 'غير مسدد' : 'Unpaid')}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-border)' }}>
                  <label className="form-label">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['Cash', 'Transfer', 'Wallet'] as const).map(m => (
                      <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{
                        padding: '0.45rem 1rem', borderRadius: '0.5rem',
                        border: `1px solid ${paymentMethod === m ? 'var(--gold)' : 'var(--bg-border)'}`,
                        background: paymentMethod === m ? 'rgba(212,175,55,0.1)' : 'var(--bg-input)',
                        color: paymentMethod === m ? 'var(--gold)' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                      }}>
                        {m === 'Cash' ? (isRtl ? 'نقداً' : 'Cash')
                          : m === 'Transfer' ? (isRtl ? 'تحويل بنكي' : 'Bank Transfer')
                            : (isRtl ? 'محفظة إلكترونية' : 'Wallet')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '0.5rem', padding: '0.7rem' }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#60a5fa' }} />
                  <span>
                    {isRtl
                      ? 'القيم التقديرية المعروضة آتية مباشرة من إعدادات النظام. لن يتم ترحيل أي قيود مالية حتى يتم اعتماد الطلب من قبل إدارة الشركة.'
                      : 'Displayed estimates are calculated dynamically from system settings. No financial journal entries are posted until the order is approved.'}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn btn-gold btn-full btn-lg">
                {submitting ? <div className="spinner" /> : <PlusCircle size={18} />}
                {isRtl
                  ? 'حفظ الطلب وإرساله للمراجعة والاعتماد'
                  : 'Submit Order for Review & Approval'}
              </button>

            </form>
          )}
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsOrder && (
        <div className="modal-backdrop" onClick={() => setDetailsOrder(null)} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontWeight: 900, fontSize: '1rem', margin: 0 }}>
                    {isRtl ? 'تفاصيل الطلب' : 'Order Details'}
                  </h3>
                  <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {detailsOrder.orderNumber || detailsOrder.trackingNumber}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setDetailsOrder(null)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={`badge status-${detailsOrder.status || 'pending'}`}>
                  {detailsOrder.orderStatus || detailsOrder.status}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                  {(detailsOrder.totalCostYER || detailsOrder.totalOrderYER || 0).toLocaleString()} YER
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="section-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                  {[
                    [isRtl ? 'رقم الطلب' : 'Order #', detailsOrder.orderNumber],
                    [isRtl ? 'تاريخ الإنشاء' : 'Created', new Date(detailsOrder.createdAt || 0).toLocaleDateString('en-GB')],
                    [isRtl ? 'مصدر الشراء' : 'Source', detailsOrder.orderSourceName || 'عام'],
                    [isRtl ? 'نوع التغليف' : 'Packaging', detailsOrder.packagingType || 'عادي'],
                    [isRtl ? 'طريقة الدفع' : 'Payment Method', detailsOrder.paymentMethod || 'Cash'],
                    [isRtl ? 'حالة الدفع' : 'Payment Status', detailsOrder.paymentStatus || '—'],
                  ].map(([l, v]) => (
                    <div key={l as string}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{l}</span>
                      <div style={{ fontWeight: 700 }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>

                <div className="section-card" style={{ fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 800, color: 'var(--gold)', marginBottom: '0.6rem' }}>
                    {isRtl ? 'ملخص الفاتورة المالي' : 'Financial Summary'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {[
                      [isRtl ? 'إجمالي الطلب (SAR)' : 'Total (SAR)', `${(detailsOrder.totalCostSAR || 0).toLocaleString()} SAR`],
                      [isRtl ? 'إجمالي الطلب (YER)' : 'Total (YER)', `${(detailsOrder.totalCostYER || detailsOrder.totalOrderYER || 0).toLocaleString()} YER`],
                      [isRtl ? 'المبلغ المدفوع' : 'Amount Paid', `${(detailsOrder.amountPaid || 0).toLocaleString()} YER`],
                      [isRtl ? 'المتبقي للدفع' : 'Amount Remaining', `${(detailsOrder.amountRemaining || 0).toLocaleString()} YER`],
                    ].map(([l, v]) => (
                      <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--bg-border)', paddingBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {Array.isArray(detailsOrder.items) && detailsOrder.items.length > 0 && (
                  <div className="section-card" style={{ fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold)', marginBottom: '0.5rem' }}>
                      <FileText size={13} style={{ display: 'inline', marginInlineEnd: '0.3rem' }} />
                      {isRtl ? 'الأصناف والمنتجات:' : 'Items & Products:'}
                    </div>
                    <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                      {detailsOrder.items.map((item: any, i: number) => (
                        <li key={i} style={{ marginBottom: '0.3rem' }}>
                          <strong>{item.productName}</strong>
                          {item.quantity ? ` × ${item.quantity}` : ''}
                          {item.productPrice ? ` = ${(item.quantity * item.productPrice).toLocaleString()} SAR` : ''}
                          {item.productUrl && (
                            <a href={item.productUrl} target="_blank" rel="noopener noreferrer"
                              style={{ marginInlineStart: '0.4rem', color: 'var(--gold)', fontSize: '0.7rem' }}>
                              <ExternalLink size={11} style={{ display: 'inline' }} />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailsOrder.notes && (
                  <div className="section-card" style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRtl ? 'ملاحظات:' : 'Notes:'}</span>
                    <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{detailsOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
