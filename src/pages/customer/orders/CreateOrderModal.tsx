/**
 * CreateOrderModal.tsx — نموذج إنشاء الطلب في بوابة العميل (نسخة من نموذج النظام)
 * Faithful customer copy of the system order wizard. المخصّص للعميل:
 *   • خطوة 1: العميل مرتبط تلقائيًا (غير قابل للتعديل)؛ المصدر ظاهر ويُختار.
 *   • خطوة 2: جدول المنتجات + «منتج سابق» يعرض منتجات هذا العميل فقط عبر نافذة منبثقة searchable؛
 *     فئة الصنف/التغليف حقيقيان من DB؛ التأمين رسومه من الإعدادات (غير قابلة للتعديل).
 *   • خطوة 3: كوبون الخصم + فئة الشحن (من ORDER_OPTION) + كشف مالي كامل + الدفع (عملة/سعر صرف حقيقيان) + «الدفع لاحقًا».
 *   • خطوة 4: الخلاصة كما بالنظام.
 *   • الشريط العلوي يعرض رقم الطلب (معاينة من الخادم) وعملته (من الإعدادات)؛ الأشرطة والتذييل ثابتة والجسم يتمرّر؛
 *     لا إغلاق بالنقر خارج النافذة (زر الإغلاق فقط)؛ الآلة الحاسبة/المصارفة موحّدة من النظام.
 *
 * أمان (§0): لا حساب سعري في المتصفح — المستحق والتحويل من POST /portal/orders/quote؛ الإنشاء عبر createCustomerOrder.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Plus, Trash2, Check, ChevronLeft, ChevronRight, User, Shield, Receipt,
  Calculator, History, AlertCircle, TicketPercent, X, Save, Boxes,
  ShieldCheck, CreditCard, Building, Wallet,
} from 'lucide-react';
import { usePortalAuth } from '../../../context/PortalAuthContext';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import {
  portalAuthGateway,
  type PortalOrderQuoteDto,
  type PortalOrderCreateInput,
  type PortalOrderSourceDto,
  type PortalBankDto,
  type PortalPreviousProductDto,
  type PortalReferenceOptionDto,
  type PortalItemCategoryDto,
  type PortalCurrencyRefDto,
  type PortalFormSettingsDto,
} from '../../../api/portalAuthGateway';
import PortalCalculatorModal from '../shared/PortalCalculatorModal';
import PreviousProductPickerModal from '../shared/PreviousProductPickerModal';
import { HeaderCell, FinanceLine, SummaryRow, StepBar, sectionTitle, miniLabel } from '../shared/PortalFormBits';
import { currencyOptionLabel } from '../../../lib/currencyLabel';

const emptyItem = () => ({
  id: Math.random().toString(36).slice(2),
  productName: '', productUrl: '',
  quantity: 1, productPrice: 0,
  weight: 0, cbm: 0, length: 0, width: 0, height: 0,
  trackingNumber: '',
  itemCategoryId: '', itemCategoryName: '',
  packagingOptionId: '', packagingOptionName: '', packagingOptionPrice: 0,
  isInsured: false, insuranceFee: 0,
});
type OrderItem = ReturnType<typeof emptyItem>;

const STEP_TITLES = (rtl: boolean): string[] => (rtl
  ? ['العميل والمصدر', 'السلة والمنتجات', 'المالية والدفع', 'الخلاصة والحفظ']
  : ['Customer & Source', 'Cart & Products', 'Financials & Payment', 'Summary & Save']);

const col = (span: number): React.CSSProperties => ({ gridColumn: `span ${span} / span ${span}` });

export default function CreateOrderModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = usePortalAuth();
  const { isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);
  const titles = useMemo(() => STEP_TITLES(isRtl), [isRtl]);
  const STEP_COUNT = titles.length;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const [calcOpen, setCalcOpen] = useState(false);

  // القوائم المرجعية الحقيقية من قاعدة البيانات عبر API (لا قيم ثابتة).
  const [sources, setSources] = useState<PortalOrderSourceDto[]>([]);
  const [packagingOptions, setPackagingOptions] = useState<PortalReferenceOptionDto[]>([]);
  const [itemCategories, setItemCategories] = useState<PortalItemCategoryDto[]>([]);
  const [shippingCategories, setShippingCategories] = useState<PortalReferenceOptionDto[]>([]);
  const [currencies, setCurrencies] = useState<PortalCurrencyRefDto[]>([]);
  const [banks, setBanks] = useState<PortalBankDto[]>([]);
  const [formSettings, setFormSettings] = useState<PortalFormSettingsDto | null>(null);
  const [previewCode, setPreviewCode] = useState('');

  // خطوة 1 — المصدر (العميل مرتبط تلقائيًا).
  const [orderSourceId, setOrderSourceId] = useState('');
  const [externalOrderNumber, setExternalOrderNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // خطوة 2 — السلة والمنتجات.
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [cartShareCode, setCartShareCode] = useState('');
  const [notes, setNotes] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previousProducts, setPreviousProducts] = useState<PortalPreviousProductDto[]>([]);
  const [previousLoading, setPreviousLoading] = useState(false);

  // خطوة 3 — كوبون + فئة شحن + دفع.
  const [couponEnabled, setCouponEnabled] = useState(false);
  const [couponAmount, setCouponAmount] = useState(0);
  const [shippingCategoryId, setShippingCategoryId] = useState('');
  const [payLater, setPayLater] = useState(false);
  const [bankAccountId, setBankAccountId] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);

  const [quote, setQuote] = useState<PortalOrderQuoteDto | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // تحميل القوائم المرجعية + إعدادات النموذج + معاينة الرقم مرة واحدة عند الفتح.
  useEffect(() => {
    if (!open || !portalAuthGateway) return;
    const gw = portalAuthGateway;
    gw.listOrderSources().then(setSources).catch(() => setSources([]));
    gw.listPackagingOptions().then(setPackagingOptions).catch(() => setPackagingOptions([]));
    gw.listItemCategories().then(setItemCategories).catch(() => setItemCategories([]));
    gw.listShippingCategories().then(setShippingCategories).catch(() => setShippingCategories([]));
    gw.listCurrencies().then(setCurrencies).catch(() => setCurrencies([]));
    gw.listBanks().then(setBanks).catch(() => setBanks([]));
    gw.getFormSettings().then(setFormSettings).catch(() => setFormSettings(null));
    gw.previewOrderCode().then(r => setPreviewCode(r.previewCode)).catch(() => setPreviewCode(''));
  }, [open]);

  // عملة الدفع الافتراضية = عملة العرض من الإعدادات عند تحميل العملات.
  useEffect(() => {
    if (paymentCurrencyCode) return;
    const def = formSettings?.defaultCurrencyCode || currencies.find(c => c.isDefault)?.code || currencies[0]?.code || '';
    if (def) setPaymentCurrencyCode(def);
  }, [currencies, formSettings, paymentCurrencyCode]);

  const validItems = useMemo(() => items.filter(i => i.productName.trim()), [items]);
  const sourceType = useMemo(() => sources.find(s => s.id === orderSourceId)?.type ?? 'App', [sources, orderSourceId]);
  const isFactory = sourceType === 'Factory';
  const packageType = isFactory ? 'factory_cbm' : 'standard';
  const insuranceFeeValue = formSettings?.defaultProductInsuranceFee ?? 0;

  const payloadItems = useCallback((): PortalOrderCreateInput['items'] => validItems.map(i => ({
    productName: i.productName.trim(),
    ...(i.productUrl ? { productUrl: i.productUrl } : {}),
    quantity: Number(i.quantity) || 0,
    productPrice: Number(i.productPrice) || 0,
    weight: Number(i.weight) || 0,
    cbm: Number(i.cbm) || 0,
    length: Number(i.length) || 0,
    width: Number(i.width) || 0,
    height: Number(i.height) || 0,
    ...(i.trackingNumber ? { trackingNumber: i.trackingNumber } : {}),
    ...(i.itemCategoryId ? { itemCategoryId: i.itemCategoryId, itemCategoryName: i.itemCategoryName } : {}),
    ...(i.packagingOptionId ? { packagingOptionId: i.packagingOptionId } : {}),
    isInsured: i.isInsured,
    // التأمين من الإعدادات (قيمة ثابتة لكل بند مؤمَّن)؛ العميل لا يُدخلها.
    insuranceFee: i.isInsured ? insuranceFeeValue : 0,
  })), [validItems, insuranceFeeValue]);

  // تقدير مؤجَّل من الخادم فقط؛ يشمل التغليف/التأمين/الكوبون/عملة الدفع — لا حساب في المتصفح.
  useEffect(() => {
    if (!portalAuthGateway || !validItems.length) { setQuote(null); return; }
    const gw = portalAuthGateway;
    const displayCode = formSettings?.defaultCurrencyCode || currencies.find(c => c.isDefault)?.code || '';
    const input: PortalOrderCreateInput = {
      ...(orderSourceId ? { orderSourceId } : {}),
      items: payloadItems(),
      packagingType: 'normal',
      isUrgent: false,
      packageType,
      couponEnabled,
      couponRate: couponEnabled ? couponAmount : 0,
      ...(paymentCurrencyCode && paymentCurrencyCode !== displayCode ? { paymentCurrencyCode } : {}),
    };
    setQuoteLoading(true);
    const handle = setTimeout(() => {
      gw.quoteCustomerOrder(input).then(setQuote).catch(() => setQuote(null)).finally(() => setQuoteLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [validItems, payloadItems, orderSourceId, couponEnabled, couponAmount, packageType, paymentCurrencyCode, currencies, formSettings]);

  const handleItemChange = (id: string, patch: Partial<OrderItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch };
      if ('length' in patch || 'width' in patch || 'height' in patch) {
        const l = Number(merged.length || 0), w = Number(merged.width || 0), h = Number(merged.height || 0);
        if (l > 0 && w > 0 && h > 0) merged.cbm = parseFloat(((l * w * h) / 1_000_000).toFixed(6));
      }
      return merged;
    }));
  };

  const openPicker = useCallback(() => {
    if (!portalAuthGateway) return;
    setPickerOpen(true);
    if (previousProducts.length) return;
    setPreviousLoading(true);
    portalAuthGateway.listCustomerPreviousProducts()
      .then(setPreviousProducts).catch(() => setPreviousProducts([])).finally(() => setPreviousLoading(false));
  }, [previousProducts.length]);

  const addPreviousProduct = (p: PortalPreviousProductDto) => {
    setItems(prev => {
      const base = prev.length === 1 && !prev[0].productName.trim() ? [] : prev;
      return [...base, {
        ...emptyItem(),
        productName: p.productName, productUrl: p.productUrl || '',
        quantity: p.quantity || 1, productPrice: p.productPrice || 0,
        weight: p.unitWeight || 0, cbm: p.unitCbm || 0
      }];
    });
    setPickerOpen(false);
  };

  const goNext = () => {
    setFormError('');
    if (step === 1 && !orderSourceId) {
      setFormError(label('يرجى اختيار مصدر الشراء والطلب (سلة، شي إن، مصنع...)', 'Please select an order source'));
      return;
    }
    if (step === 2 && validItems.length === 0) {
      setFormError(label('يجب إدراج منتج واحد على الأقل في السلة', 'Add at least one product'));
      return;
    }
    setStep(s => Math.min(s + 1, STEP_COUNT));
  };
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  // المستحق بعملة الدفع الفعلية (تحويل الخادم عند اختلاف العملة) + عملة الطلب الأساسية.
  const fx = quote?.paymentPayable;
  const orderCurrencyTotal = quote?.payableAmount ?? 0;
  const orderCurrencyCode = quote?.currency.code ?? (formSettings?.defaultCurrencyCode || '');
  const orderCurrencySymbol = quote?.currency.symbol ?? (formSettings?.defaultCurrencySymbol || '');
  const payableAmount = fx ? fx.amount : orderCurrencyTotal;
  const payableCurrencyCode = fx ? fx.currency.code : orderCurrencyCode;
  const payableCurrencySymbol = fx ? fx.currency.symbol : orderCurrencySymbol;
  const remaining = Math.max(0, Math.round((payableAmount - amountPaid) * 100) / 100);
  // قيمة المنتجات من مدخلات العميل نفسها (كمية × سعر) — ليست سرًّا؛ تُعرض كسطر أول في الكشف.
  // Products subtotal from the customer's own inputs (qty × price) — not a secret; first line of the breakdown.
  const productsSubtotal = Math.round(validItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0) * (Number(item.productPrice) || 0), 0,
  ) * 100) / 100;

  // الحفظ عبر زر «حفظ الطلب» فقط — لا إرسال ضمني للنموذج (Enter) ولا حفظ عند التنقّل بين المراحل.
  // Save only via the «Save Order» button — no implicit Enter submit and no save on step navigation.
  const handleSubmit = async () => {
    setFormError('');
    if (!validItems.length || !portalAuthGateway) {
      setFormError(label('لا يمكن إرسال طلب بلا منتجات', 'Cannot submit an order without products'));
      return;
    }
    setSubmitting(true);
    try {
      await portalAuthGateway.createCustomerOrder({
        ...(orderSourceId ? { orderSourceId } : {}),
        ...(externalOrderNumber ? { externalOrderNumber } : {}),
        ...(trackingNumber.trim() ? { trackingNumber: trackingNumber.trim() } : {}),
        ...(cartShareCode ? { cartShareCode } : {}),
        items: payloadItems(),
        packagingType: 'normal',
        isUrgent: false,
        packageType,
        couponEnabled,
        couponRate: couponEnabled ? couponAmount : 0,
        ...(shippingCategoryId ? { shippingCategoryId } : {}),
        // الدفع: «عبر بنك» فقط (النقدي/متعدد/آجل مخفية). الدفع لاحقًا يسجّل بلا دفعة وبحالة الطلب الأولى.
        paymentMethod: 'Transfer',
        payLater,
        amountPaid: payLater ? 0 : amountPaid,
        paymentCurrencyCode,
        ...(payLater || !bankAccountId ? {} : { bankAccountId }),
        ...(payLater || !bankReference.trim() ? {} : { bankReference: bankReference.trim() }),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }, crypto.randomUUID());
      setDone(true);
      setTimeout(() => { onCreated(); }, 1600);
    } catch (err: any) {
      setFormError(err?.message || label('تعذّر إنشاء الطلب', 'Failed to create order'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setStep(1); setDone(false); setFormError(''); setPickerOpen(false); setCalcOpen(false);
      setItems([emptyItem()]); setCouponEnabled(false); setCouponAmount(0); setShippingCategoryId(''); setNotes('');
      setPayLater(false); setOrderSourceId(''); setExternalOrderNumber(''); setTrackingNumber(''); setCartShareCode('');
      setBankAccountId(''); setBankReference(''); setAmountPaid(0); setQuote(null); setPreviewCode('');
    }
  }, [open]);

  if (!open) return null;

  const loadingText = label('جارٍ الحساب…', 'Calculating…');

  return (
    <div className="modal-backdrop" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className="modal-box animate-scale-in"
        style={{
          maxWidth: 1180, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--gold-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="gold-line-top" />

        {/* ── الشريط العلوي الثابت ── */}
        <div style={{ flexShrink: 0, padding: '1.1rem 1.4rem 0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)' }} />
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>{label('إنشاء فاتورة طلب جديد', 'Create Order Invoice')}</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="close"><X size={16} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.9rem' }}>
            <HeaderCell label={label('رقم الطلب', 'Order Number')} value={previewCode || '—'} mono highlight />
            <HeaderCell label={label('تاريخ الفاتورة', 'Invoice Date')} value={new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')} />
            <HeaderCell label={label('عملة الطلب', 'Order Currency')} value={orderCurrencyCode || '—'} mono highlight />
            <HeaderCell label={label('اسم العميل', 'Customer Name')} value={user?.fullName || '—'} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCalcOpen(true)} title={label('فتح الآلة الحاسبة والمصارفة', 'Calculator & Currency Exchange')}>
                <Calculator size={16} /> {label('الحاسبة والمصارفة', 'Calculator')}
              </button>
            </div>
          </div>
        </div>

        {/* ── شريط الخطوات الثابت ── */}
        <div style={{ flexShrink: 0 }}>
          <StepBar titles={titles} current={step} />
        </div>

        {done ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <Check size={54} style={{ color: '#34d399', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.4rem' }}>{label('تم إرسال طلبك', 'Order Submitted')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
              {label('سُجّل طلبك في حالة الطلب الأولى، وستراجعه الشركة وتُعتمد التسوية من النظام المالي.',
                'Your order was saved as the first order status; staff review it and settlement is confirmed in finance.')}
            </p>
          </div>
        ) : (
          // لا onSubmit: الإرسال من زر «حفظ الطلب» فقط — Enter لا يحفظ الطلب.
          <form onSubmit={e => e.preventDefault()} style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* جسم قابل للتمرير */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '1rem 1.4rem' }}>
              {formError && (
                <div className="alert alert-error" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              {/* ════════ خطوة 1 ════════ */}
              {step === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  <div className="section-card" style={{ padding: '1.1rem' }}>
                    <h3 style={sectionTitle}><User size={15} /> {label('بيانات العميل (مرتبط تلقائيًا)', 'Customer (Auto-linked)')} *</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
                      {[
                        { l: label('الاسم', 'Name'), v: user?.fullName },
                        { l: label('الهاتف', 'Phone'), v: user?.phone },
                        { l: label('البريد', 'Email'), v: user?.email },
                        { l: label('العنوان', 'Address'), v: user?.address || '—' },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.15rem' }}>{l}</div>
                          <div style={{ fontWeight: 700 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <span className="badge" style={{ fontSize: '0.62rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.8rem' }}>
                      <Shield size={10} /> {label('العميل ثابت على حسابك ولا يمكن تغييره', 'The customer is fixed to your account')}
                    </span>
                  </div>

                  <div className="section-card" style={{ padding: '1.1rem' }}>
                    <h3 style={sectionTitle}><Receipt size={15} /> {label('مصدر الشراء والمراجع', 'Order Source & References')} *</h3>
                    <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                      <label className="form-label">{label('مصدر الشراء والطلب', 'Order Source')}</label>
                      <select className="form-select" value={orderSourceId} onChange={e => setOrderSourceId(e.target.value)}>
                        <option value="">{label('-- اختر مصدر الشراء --', '-- Choose Source --')}</option>
                        {sources.map(s => <option key={s.id} value={s.id}>{s.name}{s.type ? ` (${s.type})` : ''}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                      <label className="form-label">{label('رقم الفاتورة الأصلي (سلة / المتجر)', 'Original Store Reference')}</label>
                      <input type="text" className="form-input" dir="ltr" value={externalOrderNumber} onChange={e => setExternalOrderNumber(e.target.value)} placeholder={label('رقم الفاتورة في السلة أو المتجر', 'Original Invoice ID')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{label('رقم التتبع الدولي (Global Tracking)', 'Global Tracking Code')}</label>
                      <input type="text" className="form-input" dir="ltr" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder={label('رقم التتبع الدولي (DHL...)', 'Global Tracking ID')} />
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ خطوة 2 ════════ */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="section-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--gold)' }}>{label('كود السلة الموحد (Cart Share Code)', 'Cart Share Code')}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label('إدخال كود السلة للتفعيل والمشاركة السريعة', 'Enter cart share token for quick view')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: 360 }}>
                      <input type="text" className="form-input" dir="ltr" style={{ flex: 1 }} value={cartShareCode} onChange={e => setCartShareCode(e.target.value)} placeholder={label('كود السلة', 'Cart Code')} />
                      {cartShareCode && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => window.open(`https://cart.shop/share/${encodeURIComponent(cartShareCode)}`, '_blank')} title={label('فتح رابط السلة', 'Open cart URL')}><Boxes size={14} /></button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <h3 style={{ ...sectionTitle, margin: 0 }}><Package size={15} /> {label('محتويات الشحنة والمنتجات التفصيلية', 'Freight Cargo Products')}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={openPicker}><History size={13} /> {label('اختيار منتج سابق', 'Pick previous')}</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItems(prev => [...prev, emptyItem()])}><Plus size={13} /> {label('إدراج بند منتج جديد', 'Add Product Item')}</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {items.map((item) => (
                      <div key={item.id} className="section-card" style={{ padding: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.5rem', alignItems: 'center', borderColor: 'var(--bg-border)' }}>
                        <div style={col(3)}>
                          <div style={miniLabel}>{label('اسم المنتج', 'Item Name')} *</div>
                          <input required type="text" className="form-input" value={item.productName} onChange={e => handleItemChange(item.id, { productName: e.target.value })} placeholder={label('اسم المنتج...', 'Product Name')} />
                        </div>
                        <div style={col(2)}>
                          <div style={miniLabel}>{label('السعر', 'Price')} ({orderCurrencyCode || label('سعر', 'price')})</div>
                          <input required type="number" min="0" step="0.01" className="form-input" dir="ltr" value={item.productPrice || ''} onChange={e => handleItemChange(item.id, { productPrice: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div style={col(1)}>
                          <div style={miniLabel}>{label('الكمية', 'Qty')}</div>
                          <input required type="number" min="1" className="form-input" dir="ltr" value={item.quantity} onChange={e => handleItemChange(item.id, { quantity: parseInt(e.target.value) || 0 })} />
                        </div>

                        {isFactory ? (
                          <>
                            <div style={col(1)}><div style={miniLabel}>{label('وزن', 'Wt')}</div><input type="number" step="any" className="form-input" dir="ltr" value={item.weight || ''} onChange={e => handleItemChange(item.id, { weight: parseFloat(e.target.value) || 0 })} /></div>
                            <div style={col(1)}><div style={miniLabel}>CBM</div><input type="text" readOnly className="form-input" dir="ltr" value={item.cbm ? item.cbm.toFixed(4) : '0'} /></div>
                            <div style={col(1)}><div style={miniLabel}>{label('طول', 'L')}</div><input type="number" step="any" className="form-input" dir="ltr" value={item.length || ''} onChange={e => handleItemChange(item.id, { length: parseFloat(e.target.value) || 0 })} /></div>
                            <div style={col(1)}><div style={miniLabel}>{label('عرض', 'W')}</div><input type="number" step="any" className="form-input" dir="ltr" value={item.width || ''} onChange={e => handleItemChange(item.id, { width: parseFloat(e.target.value) || 0 })} /></div>
                            <div style={col(1)}><div style={miniLabel}>{label('ارتفاع', 'H')}</div><input type="number" step="any" className="form-input" dir="ltr" value={item.height || ''} onChange={e => handleItemChange(item.id, { height: parseFloat(e.target.value) || 0 })} /></div>
                            <div style={col(2)}><div style={miniLabel}>{label('تتبع البند', 'Tracking')}</div><input type="text" className="form-input" dir="ltr" value={item.trackingNumber} onChange={e => handleItemChange(item.id, { trackingNumber: e.target.value })} /></div>
                          </>
                        ) : (
                          <>
                            <div style={col(2)}><div style={miniLabel}>{label('رابط المنتج', 'URL Link')}</div><input type="text" className="form-input" dir="ltr" value={item.productUrl} onChange={e => handleItemChange(item.id, { productUrl: e.target.value })} placeholder={label('رابط المنتج...', 'Product Link')} /></div>
                            <div style={col(3)}><div style={miniLabel}>{label('رقم التتبع للمنتج', 'Product Tracking')}</div><input type="text" className="form-input" dir="ltr" value={item.trackingNumber} onChange={e => handleItemChange(item.id, { trackingNumber: e.target.value })} placeholder={label('كود تتبع الطرد', 'Item Tracking Number')} /></div>
                          </>
                        )}

                        <div style={{ ...col(1), display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                          <button type="button" className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} disabled={items.length === 1} onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}><Trash2 size={14} /></button>
                        </div>

                        {/* صف فرعي: فئة الصنف + التغليف (من DB) + تأمين برسوم من الإعدادات (غير قابلة للتعديل) */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--bg-border)', fontSize: '0.72rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{label('فئة الصنف:', 'Category:')}</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.72rem' }} value={item.itemCategoryId}
                              onChange={e => { const c = itemCategories.find(x => x.id === e.target.value); handleItemChange(item.id, { itemCategoryId: e.target.value, itemCategoryName: c ? (isRtl ? c.nameAr : c.nameEn) : '' }); }}>
                              <option value="">{label('-- بدون فئة --', '-- No category --')}</option>
                              {itemCategories.map(c => <option key={c.id} value={c.id}>{isRtl ? c.nameAr : c.nameEn}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Package size={12} /> {label('نوع التغليف:', 'Packaging:')}</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.72rem' }} value={item.packagingOptionId}
                              onChange={e => { const o = packagingOptions.find(x => x.id === e.target.value); handleItemChange(item.id, { packagingOptionId: e.target.value, packagingOptionName: o ? (isRtl ? o.nameAr : o.nameEn) : '', packagingOptionPrice: o ? o.price : 0 }); }}>
                              <option value="">{label('-- بدون تغليف خاص (0) --', '-- Standard (0) --')}</option>
                              {packagingOptions.map(o => <option key={o.id} value={o.id}>{isRtl ? o.nameAr : o.nameEn} {o.price > 0 ? `(+${o.price} ${orderCurrencyCode})` : `(${label('مجاني', 'free')})`}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontWeight: 700 }}>
                              <input type="checkbox" checked={item.isInsured} onChange={e => handleItemChange(item.id, { isInsured: e.target.checked })} style={{ accentColor: 'var(--gold)' }} />
                              <ShieldCheck size={12} style={{ color: 'var(--gold)' }} /> {label('تأمين المنتج', 'Insure Product')}
                            </label>
                            {item.isInsured && (
                              <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                                {label('رسوم التأمين', 'Insurance fee (from Settings)')}: {insuranceFeeValue.toLocaleString()} {orderCurrencyCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ════════ خطوة 3: كوبون + فئة شحن + كشف مالي + دفع ════════ */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* كوبون الخصم + فئة الشحن (منقولان من خطوة 2 إلى هنا) */}
                  <div className="section-card" style={{ padding: '0.9rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem', alignItems: 'end' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><TicketPercent size={13} style={{ color: 'var(--gold)' }} /> {label('كوبون الخصم', 'Discount Coupon')}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" checked={couponEnabled} onChange={e => setCouponEnabled(e.target.checked)} style={{ accentColor: 'var(--gold)' }} /> {label('تفعيل', 'Enable')}
                        </label>
                        <input type="number" min="0" step="0.01" className="form-input" dir="ltr" disabled={!couponEnabled} value={couponAmount || ''} placeholder={label('قيمة الخصم', 'Discount value')} onChange={e => setCouponAmount(parseFloat(e.target.value) || 0)} style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{label('فئة الشحن', 'Shipping Category')}</label>
                      <select className="form-select" value={shippingCategoryId} onChange={e => setShippingCategoryId(e.target.value)}>
                        <option value="">{label('-- بدون فئة --', '-- None --')}</option>
                        {shippingCategories.map(c => <option key={c.id} value={c.id}>{isRtl ? c.nameAr : c.nameEn}{c.duration ? ` (${c.duration} ${label('يوم', 'd')})` : ''}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {/* الكشف المالي الكامل الموجّه للعميل (بلا ربح/تكلفة داخلية) */}
                    <div className="section-card" style={{ padding: '1.1rem' }}>
                      <h3 style={{ ...sectionTitle, marginBottom: '0.9rem' }}><Calculator size={16} /> {label('الكشف المالي التفصيلي', 'Detailed Financial Breakdown')}</h3>
                      <FinanceLine l={label('قيمة المنتجات', 'Products subtotal')} v={`${productsSubtotal.toLocaleString()} ${orderCurrencyCode}`} />
                      <FinanceLine l={label('وزن إجمالي', 'Total weight')} v={quote ? `${quote.totalWeight} kg` : '—'} />
                      <FinanceLine l={label('حجم إجمالي', 'Total CBM')} v={quote ? `${quote.totalCBM}` : '—'} />
                      {(quote?.packagingOptionsFee ?? 0) > 0 && <FinanceLine l={label('📦 رسوم التغليف المخصص', 'Custom packaging fee')} v={`+${quote!.packagingOptionsFee!.toLocaleString()} ${orderCurrencyCode}`} accent="gold" />}
                      {(quote?.productInsuranceFee ?? 0) > 0 && <FinanceLine l={label('🛡️ رسوم التأمين', 'Insurance fee')} v={`+${quote!.productInsuranceFee!.toLocaleString()} ${orderCurrencyCode}`} accent="gold" />}
                      {(quote?.couponDeduction ?? 0) > 0 && <FinanceLine l={label('🎟 خصم الكوبون', 'Coupon discount')} v={`-${quote!.couponDeduction!.toLocaleString()} ${orderCurrencyCode}`} accent="green" />}
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {label('يشمل الإجمالي رسوم الشحن والتغليف الأساسي المحسوبة من إعدادات الشركة.', 'The total also includes shipping and standard packaging fees computed from company settings.')}
                      </p>

                      <div style={{ marginTop: '0.7rem', paddingTop: '0.7rem', borderTop: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800 }}>{label('الإجمالي بعملة الطلب', 'Total (order currency)')}</span>
                          <strong className="mono" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{quoteLoading ? loadingText : quote ? `${orderCurrencyTotal.toLocaleString()} ${orderCurrencySymbol}`.trim() : '—'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 900, color: 'var(--gold)' }}>{label('💰 الإجمالي بعملة الدفع', 'Total (payment currency)')}</span>
                          <strong className="mono" style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>{quoteLoading ? loadingText : quote ? `${payableAmount.toLocaleString()} ${payableCurrencySymbol}`.trim() : '—'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* الدفع: «الدفع لاحقًا» أو دفعة عبر بنك */}
                    <div className="section-card" style={{ padding: '1.1rem', borderColor: 'var(--gold)' }}>
                      <h3 style={{ ...sectionTitle, marginBottom: '0.9rem' }}><CreditCard size={16} /> {label('تفاصيل الدفع', 'Payment')}</h3>

                      {/* زر الدفع لاحقًا */}
                      <button type="button" onClick={() => setPayLater(p => !p)} className={`btn btn-sm btn-full ${payLater ? 'btn-gold' : 'btn-ghost'}`} style={{ marginBottom: '0.9rem' }}>
                        <Wallet size={14} /> {payLater ? label('الدفع لاحقًا — مُفعّل', 'Pay Later — ON') : label('الدفع لاحقًا', 'Pay Later')}
                      </button>

                      {payLater ? (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield size={14} style={{ color: 'var(--gold)' }} /> {label('سيُحفظ الطلب دون دفعة وبحالة الطلب الأولى، وتتم المطالبة لاحقًا.', 'The order saves with no payment in the first order status; you will be billed later.')}
                        </p>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label className="form-label">{label('عملة الدفع', 'Payment Currency')}</label>
                              {/* قائمة العملة بنص مصغّر — توجيه المالك لتوحيد حجم قوائم العملات. */}
                              <select className="form-select" style={{ fontSize: '0.72rem' }} value={paymentCurrencyCode} onChange={e => setPaymentCurrencyCode(e.target.value)}>
                                {currencies.map(c => <option key={c.code} value={c.code}>{currencyOptionLabel(c, isRtl)}</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">{label('سعر الصرف المطبّق', 'Applied Rate')}</label>
                              <input type="text" readOnly className="form-input" dir="ltr" value={fx ? `1 ${orderCurrencyCode} = ${fx.rate}` : '1 : 1'} />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: '0.9rem' }}>
                            <label className="form-label">{label('حساب البنك القابض', 'Bank Receiving Account')}</label>
                            <select className="form-select" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}>
                              <option value="">{label('-- اختر حساب البنك --', '-- Select Bank Account --')}</option>
                              {banks.map(b => <option key={b.accountId} value={b.accountId}>{b.name} ({b.accountCode})</option>)}
                            </select>
                          </div>

                          <div className="form-group" style={{ marginTop: '0.9rem' }}>
                            <label className="form-label">{label('رقم المرجع / الحوالة البنكية', 'Bank Transfer Reference #')}</label>
                            <input type="text" className="form-input" dir="ltr" value={bankReference} onChange={e => setBankReference(e.target.value)} placeholder={label('رقم الإشعار أو الحوالة...', 'Transfer Ref / Voucher #')} />
                          </div>

                          <div className="form-group" style={{ marginTop: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label className="form-label">{label(`الدفعة المقدمة (${paymentCurrencyCode || payableCurrencyCode})`, `Advance Payment (${paymentCurrencyCode || payableCurrencyCode})`)}</label>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAmountPaid(0)}>0</button>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAmountPaid(payableAmount)}>{label('سداد الكل', 'Pay All')}</button>
                              </div>
                            </div>
                            <input type="number" min="0" step="0.01" className="form-input" dir="ltr" value={amountPaid || ''} placeholder={`0.00 ${paymentCurrencyCode}`} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} />
                          </div>

                          <div className="finance-line" style={{ marginTop: '0.9rem', borderTop: '1px dashed var(--bg-border)', paddingTop: '0.7rem' }}>
                            <span style={{ color: 'var(--gold)', fontWeight: 900 }}>{label('المبلغ المتبقي', 'Outstanding')}</span>
                            <strong className="mono" style={{ color: '#f87171' }}>{remaining.toLocaleString()} {payableCurrencyCode}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ خطوة 4: الخلاصة والحفظ ════════ */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="section-card" style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={20} style={{ color: '#34d399' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900 }}>{label('تمت مراجعة كافة الخطوات — جاهز للحفظ', 'All steps reviewed — ready to save')}</h4>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{payLater ? label('سيُحفظ الطلب بحالة «الأولى» ودون دفعة.', 'Saved as the first status with no payment.') : label('سيُحفظ الطلب بحالة «الأولى» مع دفعة عبر البنك.', 'Saved as the first status with a bank payment.')}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div className="section-card" style={{ padding: '1.1rem' }}>
                      <h3 style={sectionTitle}><User size={15} /> {label('العميل والمصدر', 'Customer & Source')}</h3>
                      <SummaryRow l={label('رقم الطلب', 'Order No.')} v={previewCode || '—'} />
                      <SummaryRow l={label('العميل', 'Customer')} v={user?.fullName || '—'} />
                      <SummaryRow l={label('المصدر', 'Source')} v={sources.find(s => s.id === orderSourceId)?.name || label('غير محدد', 'Unset')} />
                      <SummaryRow l={label('رقم الفاتورة الأصلي', 'Store Invoice')} v={externalOrderNumber || '—'} />
                      <SummaryRow l={label('التتبع الدولي', 'Global Tracking')} v={trackingNumber || '—'} />
                    </div>

                    <div className="section-card" style={{ padding: '1.1rem' }}>
                      <h3 style={sectionTitle}><Package size={15} /> {label('الأصناف والرسوم', 'Items & Charges')}</h3>
                      <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                        {validItems.map((i, idx) => (
                          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--bg-border)', paddingBottom: '0.25rem' }}>
                            <span>{idx + 1}. {i.productName}</span>
                            <span className="mono">{i.quantity} × {i.productPrice.toLocaleString()} {orderCurrencyCode}</span>
                          </div>
                        ))}
                      </div>
                      <SummaryRow l={label('عدد الأصناف', 'Items')} v={String(validItems.length)} />
                      <SummaryRow l={label('فئة الشحن', 'Shipping Category')} v={shippingCategories.find(c => c.id === shippingCategoryId) ? (isRtl ? shippingCategories.find(c => c.id === shippingCategoryId)!.nameAr : shippingCategories.find(c => c.id === shippingCategoryId)!.nameEn) : label('بدون', 'None')} />
                      {(quote?.couponDeduction ?? 0) > 0 && <SummaryRow l={label('خصم الكوبون', 'Coupon')} v={`-${quote!.couponDeduction!.toLocaleString()} ${orderCurrencyCode}`} />}
                    </div>

                    <div className="section-card" style={{ padding: '1.1rem', gridColumn: '1 / -1' }}>
                      <h3 style={sectionTitle}><CreditCard size={15} /> {label('الدفع', 'Payment')}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem 1.25rem' }}>
                        {payLater ? (
                          <SummaryRow l={label('حالة الدفع', 'Payment')} v={label('الدفع لاحقًا (دون دفعة)', 'Pay later (no payment)')} highlight />
                        ) : (
                          <>
                            <SummaryRow l={label('البنك', 'Bank')} v={banks.find(b => b.accountId === bankAccountId)?.name || '—'} />
                            <SummaryRow l={label('مرجع التحويل', 'Reference')} v={bankReference || '—'} />
                            <SummaryRow l={label('عملة الدفع', 'Currency')} v={payableCurrencyCode || '—'} />
                            <SummaryRow l={label('المدفوع', 'Paid')} v={`${amountPaid.toLocaleString()} ${payableCurrencyCode}`} />
                            <SummaryRow l={label('المتبقي', 'Remaining')} v={`${remaining.toLocaleString()} ${payableCurrencyCode}`} />
                          </>
                        )}
                        <SummaryRow l={label('الإجمالي (عملة الطلب)', 'Total (order ccy)')} v={quote ? `${orderCurrencyTotal.toLocaleString()} ${orderCurrencySymbol}` : '—'} />
                        <SummaryRow l={label('الإجمالي (عملة الدفع)', 'Total (payment ccy)')} v={quote ? `${payableAmount.toLocaleString()} ${payableCurrencySymbol}` : '—'} highlight />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{label('ملاحظات إضافية على الطلب', 'Additional Order Notes')}</label>
                    <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={label('أضف أي ملاحظات أو تعليمات...', 'Add any notes or instructions...')} />
                  </div>
                </div>
              )}
            </div>

            {/* ── تذييل ثابت (السابق/التالي/حفظ) ── */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', gap: '0.6rem', padding: '0.9rem 1.4rem', borderTop: '1px solid var(--bg-border)', background: 'var(--bg-card)' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>{label('إلغاء النافذة', 'Cancel')}</button>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {step > 1 && (
                  <button type="button" className="btn btn-ghost" onClick={goBack}>
                    {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {label('السابق', 'Previous')}
                  </button>
                )}
                {step < STEP_COUNT ? (
                  <button type="button" className="btn btn-gold" onClick={goNext}>
                    {label('التالي', 'Next')} {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <button type="button" className="btn btn-gold btn-lg" disabled={submitting} onClick={() => void handleSubmit()}>
                    {submitting ? <div className="spinner" /> : <Save size={16} />} {label('حفظ الطلب', 'Save Order')}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      <PreviousProductPickerModal open={pickerOpen} loading={previousLoading} products={previousProducts} onClose={() => setPickerOpen(false)} onSelect={addPreviousProduct} />
      <PortalCalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
