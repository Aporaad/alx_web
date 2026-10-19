/**
 * CreateShipmentModal.tsx — نموذج إنشاء شحنة في بوابة العميل
 * نسخة منسّقة من نموذج الشحن بالنظام (ShipmentFormModal) بنفس هيكل معالج الطلب (شريط علوي/خطوات/تذييل ثابتين،
 * جسم متموّر، لا إغلاق خارجي، الآلة الحاسبة/المصارفة موحّدة).
 *
 * الشحنة الحقيقية (وليست طلبًا): POST /portal/shipments — الخادم يبني صف shipments حقيقي في public.shipments
 * (فئة المحتوى، الكراتين، الوزن، النوع، المصدر، الوجهة) مرتبطًا بطلب حاوية يملكه العميل.
 * «المدة (أيام)» تُجلب من settings_general.default_shipping_duration حقلًا للقراءة فقط،
 * و«الوصول المتوقع» يُحسب تلقائيًا (الآن + المدة) ولا يُقبل من العميل.
 * عملة الشحنة = default_order_currency من الإعدادات.
 *
 * Customer shipment modal mirroring the system ShipmentFormModal with the order-wizard shell. The shipment is
 * a REAL shipments row (POST /portal/shipments) attached to an owned container order — never an order itself.
 * Duration is a read-only field fed from settings; expected arrival is computed automatically; the shipment
 * currency comes from default_order_currency.
 *
 * أمان (§0): التسعير النهائي للشحنة من الموظفين — العميل يرى بطاقات رسوم الكراتين العامة من items_category
 * ورسوم التغليف المعلنة فقط، بلا تكلفة شحن داخلية ولا ربح.
 *
 * الحفظ: زر «حفظ الشحنة» فقط — لا إرسال ضمني (Enter) ولا حفظ عند التنقّل بين المراحل.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck, Check, ChevronLeft, ChevronRight, User, Shield, Calculator,
  AlertCircle, X, Save, CreditCard, Wallet, MapPin, Route, CalendarClock,
} from 'lucide-react';
import { usePortalAuth } from '../../../context/PortalAuthContext';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import {
  portalAuthGateway,
  type PortalBankDto,
  type PortalReferenceOptionDto,
  type PortalItemCategoryDto,
  type PortalCurrencyRefDto,
  type PortalFormSettingsDto,
} from '../../../api/portalAuthGateway';
import PortalCalculatorModal from '../shared/PortalCalculatorModal';
import { HeaderCell, FinanceLine, SummaryRow, StepBar, sectionTitle } from '../shared/PortalFormBits';
import { currencyOptionLabel } from '../../../lib/currencyLabel';

// نوع الشحن كما في النظام (قيم نصية ثابتة تعرضها الواجهة، ليست بيانات مرجعية سرّية).
const SHIPPING_TYPES = ['بري', 'جوي', 'بحري'];

const STEP_TITLES = (rtl: boolean): string[] => (rtl
  ? ['العميل وتفاصيل الشحنة', 'المحتوى والتغليف', 'المالية والدفع']
  : ['Customer & Shipment', 'Content & Packaging', 'Financials & Payment']);

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export default function CreateShipmentModal({
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

  // القوائم المرجعية الحقيقية من قاعدة البيانات عبر API (لا قيم ثابتة للأرقام/الفئات).
  const [itemCategories, setItemCategories] = useState<PortalItemCategoryDto[]>([]);
  const [packagingOptions, setPackagingOptions] = useState<PortalReferenceOptionDto[]>([]);
  const [currencies, setCurrencies] = useState<PortalCurrencyRefDto[]>([]);
  const [banks, setBanks] = useState<PortalBankDto[]>([]);
  const [formSettings, setFormSettings] = useState<PortalFormSettingsDto | null>(null);
  const [previewCode, setPreviewCode] = useState('');

  // خطوة 1 — تفاصيل الشحنة (العميل مرتبط تلقائيًا؛ رقم الشحنة/التتبع من معاينة الخادم).
  const [shippingType, setShippingType] = useState(SHIPPING_TYPES[0]);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  // المدة من الإعدادات (للقراءة فقط) والوصول المتوقع يُحسب تلقائيًا (الآن + المدة أيام).
  const durationDays = formSettings?.defaultShippingDurationDays && formSettings.defaultShippingDurationDays > 0
    ? formSettings.defaultShippingDurationDays
    : 0;
  const expectedArrival = useMemo(() => {
    if (!durationDays) return null;
    const arrival = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    return arrival.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US');
  }, [durationDays, isRtl]);

  // خطوة 2 — المحتوى والتغليف.
  const [contentCategoryId, setContentCategoryId] = useState('');
  const [cartonCount, setCartonCount] = useState(1);
  const [weight, setWeight] = useState(0);
  const [packagingOptionId, setPackagingOptionId] = useState('');

  // خطوة 3 — الدفع + ملاحظات.
  const [payLater, setPayLater] = useState(false);
  const [bankAccountId, setBankAccountId] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');

  // تحميل القوائم المرجعية + إعدادات النموذج + معاينة الرقم مرة واحدة عند الفتح.
  useEffect(() => {
    if (!open || !portalAuthGateway) return;
    const gw = portalAuthGateway;
    gw.listItemCategories().then(setItemCategories).catch(() => setItemCategories([]));
    gw.listPackagingOptions().then(setPackagingOptions).catch(() => setPackagingOptions([]));
    gw.listCurrencies().then(setCurrencies).catch(() => setCurrencies([]));
    gw.listBanks().then(setBanks).catch(() => setBanks([]));
    gw.getFormSettings().then(setFormSettings).catch(() => setFormSettings(null));
    gw.previewOrderCode().then(r => setPreviewCode(r.previewCode)).catch(() => setPreviewCode(''));
  }, [open]);

  // عملة الدفع الافتراضية = عملة الشحنة من الإعدادات (default_order_currency) عند تحميل العملات.
  useEffect(() => {
    if (paymentCurrencyCode) return;
    const def = formSettings?.defaultCurrencyCode || currencies.find(c => c.isDefault)?.code || currencies[0]?.code || '';
    if (def) setPaymentCurrencyCode(def);
  }, [currencies, formSettings, paymentCurrencyCode]);

  const contentCategory = useMemo(
    () => itemCategories.find(x => x.id === contentCategoryId),
    [itemCategories, contentCategoryId],
  );
  const contentCategoryName = contentCategory ? (isRtl ? contentCategory.nameAr : contentCategory.nameEn) : '';
  const packagingOption = useMemo(
    () => packagingOptions.find(x => x.id === packagingOptionId),
    [packagingOptions, packagingOptionId],
  );

  // عملة الشحنة من الإعدادات (default_order_currency) — بلا حرفية في الواجهة.
  const shipmentCurrencyCode = formSettings?.defaultCurrencyCode
    || currencies.find(c => c.isDefault)?.code || '';
  const shipmentCurrencySymbol = formSettings?.defaultCurrencySymbol || '';

  // بطاقات رسوم الكراتين العامة من فئة المحتوى (items_category) — تقدير عرض فقط؛ التسعير النهائي من الموظفين.
  const cartons = Math.max(1, Number(cartonCount) || 1);
  const customsFee = round2((contentCategory?.customsPerCarton ?? 0) * cartons);
  const taxFee = round2((contentCategory?.taxPerCarton ?? 0) * cartons);
  const otherFees = round2((contentCategory?.otherFeesPerCarton ?? 0) * cartons);
  const estimatedFees = round2(customsFee + taxFee + otherFees + (packagingOption?.price ?? 0));
  const remaining = Math.max(0, round2(estimatedFees - amountPaid));

  const goNext = () => {
    setFormError('');
    if (step === 2 && !contentCategoryId) {
      setFormError(label('يجب اختيار فئة المحتوى', 'Select a content category'));
      return;
    }
    setStep(s => Math.min(s + 1, STEP_COUNT));
  };
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  // الحفظ عبر زر «حفظ الشحنة» فقط — الشحنة تُنشأ صفًّا حقيقيًا في public.shipments (لا طلبًا).
  const handleSubmit = async () => {
    setFormError('');
    if (!portalAuthGateway) { setFormError(label('واجهة البرمجة غير مُهيّأة', 'API not configured')); return; }
    if (!contentCategoryId) { setStep(2); setFormError(label('يجب اختيار فئة المحتوى', 'Select a content category')); return; }
    setSubmitting(true);
    try {
      await portalAuthGateway.createCustomerShipment({
        contentCategoryId,
        cartonCount: cartons,
        weight: Math.max(0, Number(weight) || 0),
        shippingType,
        ...(source.trim() ? { shippingSource: source.trim() } : {}),
        ...(destination.trim() ? { shippingDestination: destination.trim() } : {}),
        ...(notes.trim() ? { description: notes.trim() } : {}),
        ...(paymentCurrencyCode ? { paymentCurrencyCode } : {}),
        payLater,
        ...(payLater ? {} : { amountPaid: Math.max(0, Number(amountPaid) || 0) }),
        ...(payLater || !bankAccountId ? {} : { bankAccountId }),
        ...(payLater || !bankReference.trim() ? {} : { bankReference: bankReference.trim() }),
      }, crypto.randomUUID());
      setDone(true);
      setTimeout(() => { onCreated(); }, 1600);
    } catch (err: any) {
      setFormError(err?.message || label('تعذّر إنشاء الشحنة', 'Failed to create shipment'));
    } finally {
      setSubmitting(false);
    }
  };

  // إعادة تعيين الحالة عند الإغلاق.
  useEffect(() => {
    if (!open) {
      setStep(1); setDone(false); setFormError(''); setCalcOpen(false);
      setShippingType(SHIPPING_TYPES[0]); setSource(''); setDestination('');
      setContentCategoryId(''); setCartonCount(1); setWeight(0); setPackagingOptionId('');
      setPayLater(false);
      setBankAccountId(''); setBankReference(''); setAmountPaid(0); setNotes(''); setPreviewCode('');
    }
  }, [open]);

  if (!open) return null;

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
              <Truck size={18} style={{ color: 'var(--gold)' }} />
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>{label('إنشاء شحنة جديدة', 'Create Shipment')}</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="close"><X size={16} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.9rem' }}>
            <HeaderCell label={label('رقم الشحنة', 'Shipment Number')} value={previewCode || '—'} mono highlight />
            <HeaderCell label={label('رقم التتبع', 'Tracking Number')} value={previewCode || '—'} mono highlight />
            <HeaderCell label={label('تاريخ الشحن', 'Shipment Date')} value={new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')} />
            <HeaderCell label={label('عملة الشحنة', 'Shipment Currency')} value={shipmentCurrencyCode || '—'} mono highlight />
            <HeaderCell label={label('اسم العميل', 'Customer Name')} value={user?.fullName || '—'} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCalcOpen(true)} title={label('فتح الآلة الحاسبة والمصارفة', 'Calculator & Currency Exchange')}>
                <Calculator size={16} /> {label('الحاسبة والمصارفة', 'Calculator')}
              </button>
            </div>
          </div>
        </div>

        {/* ── شريط الخطوات الثابت (موسّط) ── */}
        <div style={{ flexShrink: 0 }}>
          <StepBar titles={titles} current={step} />
        </div>

        {done ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <Check size={54} style={{ color: '#34d399', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.4rem' }}>{label('تم تسجيل الشحنة', 'Shipment Registered')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
              {label('حُفظت شحنتك برقم وتتبع من الخادم في سجل الشحنات؛ تسعّرها الشركة ويُعتمد السداد من النظام المالي.',
                'Saved with server-generated number & tracking in the shipments register; staff price it and finance confirms settlement.')}
            </p>
          </div>
        ) : (
          // لا onSubmit: الحفظ من زر «حفظ الشحنة» فقط — Enter لا يحفظ.
          <form onSubmit={e => e.preventDefault()} style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* جسم قابل للتمرير */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '1rem 1.4rem' }}>
              {formError && (
                <div className="alert alert-error" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              {/* ════════ خطوة 1: العميل (تلقائي) + تفاصيل الشحنة ════════ */}
              {step === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  <div className="section-card" style={{ padding: '1.1rem' }}>
                    <h3 style={sectionTitle}><User size={15} /> {label('بيانات العميل (مرتبط تلقائيًا)', 'Customer (Auto-linked)')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
                      {[
                        { l: label('الاسم', 'Name'), v: user?.fullName },
                        { l: label('الهاتف', 'Phone'), v: user?.phone },
                        { l: label('العنوان', 'Address'), v: user?.address || '—' },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.15rem' }}>{l}</div>
                          <div style={{ fontWeight: 700 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <span className="badge" style={{ fontSize: '0.62rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.8rem' }}>
                      <Shield size={10} /> {label('العميل ثابت على حسابك؛ رقم الشحنة والتتبع يُنشآن تلقائيًا في الخادم', 'Customer is fixed to your account; shipment/tracking numbers are auto-generated')}
                    </span>
                  </div>

                  <div className="section-card" style={{ padding: '1.1rem' }}>
                    <h3 style={sectionTitle}><Route size={15} /> {label('مسار الشحن والمواعيد', 'Route & Schedule')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">{label('نوع الشحن', 'Shipping Type')}</label>
                        <select className="form-select" value={shippingType} onChange={e => setShippingType(e.target.value)}>
                          {SHIPPING_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{label('مصدر الشحن', 'Origin')}</label>
                        <input type="text" className="form-input" value={source} onChange={e => setSource(e.target.value)} placeholder={label('مدينة/دولة المصدر', 'Origin city/country')} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{label('وجهة الشحن', 'Destination')}</label>
                        <input type="text" className="form-input" value={destination} onChange={e => setDestination(e.target.value)} placeholder={label('مدينة/دولة الوجهة', 'Destination city/country')} />
                      </div>
                      {/* المدة من الإعدادات — للقراءة فقط (توجيه المالك). */}
                      <div className="form-group">
                        <label className="form-label">{label('المدة (أيام) — من الإعدادات', 'Duration (days) — from settings')}</label>
                        <input type="text" readOnly className="form-input" dir="ltr" value={durationDays ? String(durationDays) : '—'} title={label('تأتي المدة من إعدادات النظام تلقائيًا', 'Duration comes from system settings automatically')} />
                      </div>
                      {/* الوصول المتوقع يُحسب تلقائيًا (الآن + المدة) — للقراءة فقط. */}
                      <div className="form-group">
                        <label className="form-label"><CalendarClock size={12} style={{ verticalAlign: '-2px' }} /> {label('الوصول المتوقع (تلقائي)', 'Expected Arrival (auto)')}</label>
                        <input type="text" readOnly className="form-input" dir="ltr" value={expectedArrival || '—'} title={label('يُحسب من المدة تلقائيًا', 'Computed from the duration automatically')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ خطوة 2: المحتوى والتغليف (كلاهما من DB) ════════ */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="section-card" style={{ padding: '1.1rem' }}>
                    <h3 style={sectionTitle}><MapPin size={15} /> {label('محتوى الشحنة والتغليف', 'Shipment Content & Packaging')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">{label('فئة المحتوى', 'Content Category')} *</label>
                        <select className="form-select" value={contentCategoryId} onChange={e => setContentCategoryId(e.target.value)}>
                          <option value="">{label('-- اختر فئة المحتوى --', '-- Select content category --')}</option>
                          {itemCategories.map(c => <option key={c.id} value={c.id}>{isRtl ? c.nameAr : c.nameEn}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{label('فئة التغليف', 'Packaging Option')}</label>
                        <select className="form-select" value={packagingOptionId} onChange={e => setPackagingOptionId(e.target.value)}>
                          <option value="">{label('-- عادي (بدون إضافة) --', '-- Standard (no add-on) --')}</option>
                          {packagingOptions.map(o => <option key={o.id} value={o.id}>{isRtl ? o.nameAr : o.nameEn}{o.price > 0 ? ` (+${o.price} ${shipmentCurrencyCode})` : ` (${label('مجاني', 'free')})`}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{label('عدد الكراتين', 'Carton Count')}</label>
                        <input type="number" min="1" className="form-input" dir="ltr" value={cartonCount} onChange={e => setCartonCount(parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{label('الوزن (كجم)', 'Weight (kg)')}</label>
                        <input type="number" min="0" step="0.1" className="form-input" dir="ltr" value={weight || ''} onChange={e => setWeight(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {label('التسعير النهائي للشحنة يتم من قبل الشركة؛ الأرقام أعلاه بطاقات رسوم عامة من فئة المحتوى.', 'Final shipment pricing is done by the company; the figures above are public fee cards from the content category.')}
                    </p>
                  </div>
                </div>
              )}

              {/* ════════ خطوة 3: الكشف المالي التفصيلي + الدفع ════════ */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {/* الكشف المالي التفصيلي الموجّه للعميل (رسوم كراتين عامة + تغليف؛ بلا تكلفة داخلية) */}
                    <div className="section-card" style={{ padding: '1.1rem' }}>
                      <h3 style={{ ...sectionTitle, marginBottom: '0.9rem' }}><Calculator size={16} /> {label('الكشف المالي التفصيلي', 'Detailed Financial Breakdown')}</h3>
                      <FinanceLine l={label('عدد الكراتين', 'Cartons')} v={String(cartons)} />
                      <FinanceLine l={label('الوزن الإجمالي', 'Total weight')} v={`${round2(Number(weight) || 0)} kg`} />
                      <FinanceLine l={label('نوع الشحن', 'Shipping type')} v={shippingType} />
                      <FinanceLine l={label('المحتوى', 'Content')} v={contentCategoryName || label('غير محدد', 'Unset')} />
                      {customsFee > 0 && <FinanceLine l={label('رسوم جمركية (كراتين)', 'Customs (cartons)')} v={`+${customsFee.toLocaleString()} ${shipmentCurrencyCode}`} accent="gold" />}
                      {taxFee > 0 && <FinanceLine l={label('ضريبة (كراتين)', 'Tax (cartons)')} v={`+${taxFee.toLocaleString()} ${shipmentCurrencyCode}`} accent="gold" />}
                      {otherFees > 0 && <FinanceLine l={label('رسوم أخرى (كراتين)', 'Other fees (cartons)')} v={`+${otherFees.toLocaleString()} ${shipmentCurrencyCode}`} accent="gold" />}
                      {(packagingOption?.price ?? 0) > 0 && <FinanceLine l={label('📦 رسوم التغليف', 'Packaging fee')} v={`+${packagingOption!.price.toLocaleString()} ${shipmentCurrencyCode}`} accent="gold" />}

                      <div style={{ marginTop: '0.7rem', paddingTop: '0.7rem', borderTop: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800 }}>{label('التقدير المبدئي للرسوم', 'Estimated fees')}</span>
                          <strong className="mono" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{`${estimatedFees.toLocaleString()} ${shipmentCurrencySymbol}`.trim()}</strong>
                        </div>
                        {!payLater && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800 }}>{label('المدفوع المعلن', 'Declared paid')}</span>
                              <strong className="mono" style={{ color: '#34d399' }}>{`${amountPaid.toLocaleString()} ${paymentCurrencyCode}`.trim()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 900, color: 'var(--gold)' }}>{label('المتبقي التقديري', 'Estimated outstanding')}</span>
                              <strong className="mono" style={{ color: '#f87171', fontSize: '1.1rem' }}>{`${remaining.toLocaleString()} ${shipmentCurrencyCode}`.trim()}</strong>
                            </div>
                          </>
                        )}
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {label('المستحق النهائي يُحدّده تسعير الموظفين ويُعتمد في النظام المالي.', 'The final due is set by staff pricing and confirmed in finance.')}
                      </p>
                    </div>

                    {/* الدفع: «الدفع لاحقًا» أو دفعة عبر بنك */}
                    <div className="section-card" style={{ padding: '1.1rem', borderColor: 'var(--gold)' }}>
                      <h3 style={{ ...sectionTitle, marginBottom: '0.9rem' }}><CreditCard size={16} /> {label('تفاصيل الدفع', 'Payment')}</h3>

                      <button type="button" onClick={() => setPayLater(p => !p)} className={`btn btn-sm btn-full ${payLater ? 'btn-gold' : 'btn-ghost'}`} style={{ marginBottom: '0.9rem' }}>
                        <Wallet size={14} /> {payLater ? label('الدفع لاحقًا — مُفعّل', 'Pay Later — ON') : label('الدفع لاحقًا', 'Pay Later')}
                      </button>

                      {payLater ? (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield size={14} style={{ color: 'var(--gold)' }} /> {label('ستُحفظ الشحنة دون دفعة، وتتم المطالبة بعد تسعير الشركة.', 'The shipment saves with no payment; you will be billed after company pricing.')}
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
                              <label className="form-label">{label('عملة الشحنة', 'Shipment Currency')}</label>
                              <input type="text" readOnly className="form-input" dir="ltr" value={shipmentCurrencyCode || '—'} />
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
                              <label className="form-label">{label(`الدفعة المقدمة (${paymentCurrencyCode})`, `Advance Payment (${paymentCurrencyCode})`)}</label>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAmountPaid(0)}>0</button>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAmountPaid(estimatedFees)}>{label('سداد التقدير', 'Pay Estimate')}</button>
                              </div>
                            </div>
                            <input type="number" min="0" step="0.01" className="form-input" dir="ltr" value={amountPaid || ''} placeholder={`0.00 ${paymentCurrencyCode}`} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} />
                          </div>
                        </>
                      )}

                      <div className="form-group" style={{ marginTop: '0.9rem' }}>
                        <label className="form-label">{label('ملاحظات إضافية', 'Additional Notes')}</label>
                        <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={label('تعليمات الاستلام/التسليم...', 'Pickup/delivery instructions...')} />
                      </div>
                    </div>
                  </div>

                  {/* خلاصة مختصرة قبل الحفظ */}
                  <div className="section-card" style={{ padding: '1rem 1.1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem 1.25rem' }}>
                    <SummaryRow l={label('رقم الشحنة', 'Shipment No.')} v={previewCode || '—'} />
                    <SummaryRow l={label('العميل', 'Customer')} v={user?.fullName || '—'} />
                    <SummaryRow l={label('المصدر', 'Origin')} v={source || '—'} />
                    <SummaryRow l={label('الوجهة', 'Destination')} v={destination || '—'} />
                    <SummaryRow l={label('المدة/الوصول', 'Duration/Arrival')} v={durationDays ? `${durationDays} ${label('يوم', 'd')} · ${expectedArrival || '—'}` : '—'} />
                    <SummaryRow l={label('حالة الدفع', 'Payment')} v={payLater ? label('لاحقًا (دون دفعة)', 'Later (no payment)') : label('دفعة عبر البنك', 'Bank payment')} highlight />
                  </div>

                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CalendarClock size={13} /> {payLater
                      ? label('ستُحفظ الشحنة دون دفعة؛ يتم السداد بعد تسعير الشركة من النظام المالي.', 'The shipment saves with no payment; settlement happens after company pricing.')
                      : label('ستُحفظ الشحنة مع دفعة معلنة عبر البنك؛ تُراجعها الشركة ويُعتمد السداد من النظام المالي.', 'The shipment saves with a declared bank payment; staff review and finance confirms settlement.')}
                  </p>
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
                    {submitting ? <div className="spinner" /> : <Save size={16} />} {label('حفظ الشحنة', 'Save Shipment')}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      <PortalCalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
