/**
 * CustomerPaymentModal.tsx — نموذج «طلب دفع جديد» مخصص للعميل، مطابق لواجهة النظام
 * «تحصيل دفعة مالية وسند قبض الطلب» (PaymentModal) لكن مبسّط وآمن للعميل.
 * Customer "new payment request" modal mirroring the system's collection/receipt voucher layout.
 *
 * هيكل النافذة (توجيهات المالك 2026-10-19): أوسع، ألوان أوضح، حدود/فواصل بارزة، شريط علوي وتذييل ثابتان
 * وجسم متموّر، لا إغلاق بالنقر خارج النافذة (زر الإغلاق فقط)، والآلة الحاسبة/المصارفة موحّدة مع بقية النماذج.
 * Layout (owner directive 2026-10-19): wider, stronger palette, clear borders/dividers, sticky header/footer
 * with a scrolling body, no outside-click close (X only), and the shared calculator/exchange modal.
 *
 * فروق التخصيص (توجيهات المالك 2026-10-18):
 *  - خيارات وسيلة الدفع (النقدي/المتعدد/آجل) محذوفة؛ تبقى «عبر بنك» معتمدة تلقائيًا.
 *  - حقل رمز PIN محذوف تمامًا (لا يملك العميل صلاحية الاعتماد المالي الذاتي).
 *  - لا حساب مبالغ في المتصفح: المبلغ يُرسَل للتحقق الخادمي؛ يُنشأ طلب دفع (pending_verification).
 * Method options (Cash/Mixed/Deferred) and the PIN field are removed; bank is auto-confirmed.
 * Submitting creates a payment REQUEST (pending staff verification) via createPaymentRequest with
 * method 'transfer' (bank) — no self-posting.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Banknote, Check, FileText, ShieldCheck, Hash, Loader2, Calculator } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import {
  portalAuthGateway, type PortalBankDto, type PortalCurrencyRefDto,
} from '../../../api/portalAuthGateway';
import PortalCalculatorModal from '../shared/PortalCalculatorModal';
import { currencyOptionLabel } from '../../../lib/currencyLabel';

export default function CustomerPaymentModal({
  open, onClose, currencyCode, currencySymbol, onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  currencyCode: string;
  currencySymbol: string;
  onSubmitted: () => void;
}) {
  const { isRtl } = usePortalTheme();
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const [amount, setAmount] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [notes, setNotes] = useState('');
  const [banks, setBanks] = useState<PortalBankDto[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  // عملة الدفع (اختيار العميل) + قائمة العملات الحقيقية — من قاعدة البيانات عبر API.
  const [currencies, setCurrencies] = useState<PortalCurrencyRefDto[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode || '');
  const [calcOpen, setCalcOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setAmount(''); setBankRef(''); setNotes(''); setSelectedBankId(''); setDone(false); setError(''); setCalcOpen(false); return; }
    if (portalAuthGateway) {
      portalAuthGateway.listBanks().then(setBanks).catch(() => setBanks([]));
      portalAuthGateway.listCurrencies().then(list => {
        setCurrencies(list);
        setSelectedCurrency(prev => prev || currencyCode || list.find(c => c.isDefault)?.code || list[0]?.code || '');
      }).catch(() => setCurrencies([]));
    }
  }, [open, currencyCode]);

  const activeSymbol = useMemo(() => currencies.find(c => c.code === selectedCurrency)?.symbol || currencySymbol, [currencies, selectedCurrency, currencySymbol]);

  // رقم السند المقترح للعرض فقط (توثيقي؛ المصدر الفعلي من الخادم عند الاعتماد).
  const voucherPreview = useMemo(() => `RCPT-${Date.now().toString().slice(-6)}`, [open]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (!portalAuthGateway) { setError(label('واجهة البرمجة غير مُهيّأة', 'API not configured')); return; }
    if (!(num > 0)) { setError(label('أدخل مبلغًا صالحًا', 'Enter a valid amount')); return; }
    setSubmitting(true);
    try {
      const bank = banks.find(b => b.accountId === selectedBankId);
      const refParts: string[] = [];
      if (bank) refParts.push(`${bank.name}(${bank.accountCode})`);
      if (bankRef.trim()) refParts.push(bankRef.trim());
      await portalAuthGateway.createPaymentRequest({
        amount: num,
        currency: selectedCurrency || '',
        paymentMethod: 'transfer', // عبر بنك فقط (D4)؛ لا نقدي/محفظة/آجل.
        ...(refParts.length ? { reference: refParts.join(' · ') } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }, `portal-payreq:${crypto.randomUUID()}`);
      setDone(true);
      setTimeout(() => { onSubmitted(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err?.message || label('تعذّر إرسال طلب الدفع', 'Failed to submit payment request'));
    } finally {
      setSubmitting(false);
    }
  }, [amount, selectedBankId, banks, bankRef, notes, selectedCurrency, isRtl, onSubmitted, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className="modal-box animate-scale-in"
        style={{
          maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--gold-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="gold-line-top" />

        {/* ── الشريط العلوي الثابت ── */}
        <div style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 40, height: 40, borderRadius: '0.7rem', display: 'grid', placeItems: 'center', background: 'rgba(212,175,55,0.16)', border: '1px solid var(--gold)', color: 'var(--gold)' }}><Banknote size={20} /></span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>{label('طلب دفع جديد', 'New Payment Request')}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label('سند تحصيل عبر بنك — بانتظار اعتماد الموظف', 'Bank collection voucher — pending staff approval')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setCalcOpen(true)} title={label('فتح الآلة الحاسبة والمصارفة', 'Calculator & Currency Exchange')}>
              <Calculator size={15} /> {label('الحاسبة والمصارفة', 'Calculator')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="close"><X size={16} /></button>
          </div>
        </div>

        {done ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <Check size={54} style={{ color: '#34d399', margin: '0 auto 0.8rem' }} />
            <h3 style={{ fontWeight: 800, margin: '0 0 0.3rem' }}>{label('تم إرسال طلب الدفع', 'Payment Request Sent')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>{label('سيُراجع الموظف الدفعة ويعتمد السند.', 'Staff will verify the payment and post the voucher.')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* جسم قابل للتمرير */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '1.1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && <div className="alert alert-error">{error}</div>}

              {/* بطاقة السند (عرض) */}
              <div className="section-card" style={{ padding: '0.95rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', borderColor: 'var(--gold-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={14} style={{ color: 'var(--gold)' }} />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{label('رقم السند (مقترح)', 'Voucher No. (preview)')}</span>
                  <strong className="mono" style={{ color: 'var(--gold)' }}>{voucherPreview}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--gold)' }} />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{label('وسيلة التحصيل', 'Method')}</span>
                  <strong style={{ color: 'var(--gold)' }}>{label('عبر بنك', 'Via Bank')}</strong>
                </div>
              </div>

              {/* المبلغ + اختيار العملة */}
              <div className="section-card" style={{ padding: '1.2rem', borderColor: 'var(--gold)' }}>
                <label className="form-label" style={{ fontWeight: 900, color: 'var(--gold)' }}>{label('المبلغ المحصَّل', 'Amount to Pay')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    required
                    className="form-input"
                    dir="ltr"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ flex: 1, minWidth: 220, fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.25rem', textAlign: 'center', padding: '0.75rem 1rem', borderColor: 'var(--gold-border)', background: 'var(--bg-input)' }}
                  />
                  {currencies.length > 0 ? (
                    // قائمة العملة بنص مصغّر — توجيه المالك لتوحيد حجم قوائم العملات.
                    <select className="form-select" aria-label={label('اختيار العملة', 'Select currency')} value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)} style={{ width: 200, fontWeight: 800, fontSize: '0.72rem' }}>
                      {currencies.map(c => <option key={c.code} value={c.code}>{currencyOptionLabel(c, isRtl)}</option>)}
                    </select>
                  ) : (
                    <span className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{activeSymbol || selectedCurrency || '—'}</span>
                  )}
                </div>
                <p style={{ margin: '0.7rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={13} /> {label('لا تُسجَّل حركة في المتصفح؛ الطلب يُتحقق ويُرحَّل من النظام المالي.', 'No entry is posted in the browser; verification and posting happen server-side.')}
                </p>
              </div>

              {/* البنك المستلم */}
              <div className="section-card" style={{ padding: '1.2rem' }}>
                <label className="form-label" style={{ marginBottom: '0.7rem', display: 'block', fontWeight: 900, color: 'var(--gold)' }}>{label('حساب القبض (عبر بنك)', 'Receiving Account (Bank)')}</label>
                {banks.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}><Loader2 size={14} className="animate-spin" /> {label('جارٍ تحميل البنوك…', 'Loading banks…')}</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                    {banks.map(b => {
                      const active = selectedBankId === b.accountId;
                      return (
                        <button
                          key={b.accountId}
                          type="button"
                          onClick={() => setSelectedBankId(id => id === b.accountId ? '' : b.accountId)}
                          style={{
                            textAlign: 'start', padding: '0.75rem 0.85rem', borderRadius: '0.6rem', cursor: 'pointer',
                            background: active ? 'rgba(212,175,55,0.14)' : 'var(--bg-input)',
                            border: `1.5px solid ${active ? 'var(--gold)' : 'var(--bg-border)'}`,
                            color: 'var(--text-primary)',
                            boxShadow: active ? '0 0 0 3px rgba(212,175,55,0.12)' : 'none',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>{b.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>{b.accountCode}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* المرجع والملاحظات */}
              <div className="section-card" style={{ padding: '1.1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
                <div className="form-group">
                  <label className="form-label">{label('مرجع التحويل البنكي', 'Bank Reference')}</label>
                  <input type="text" className="form-input" dir="ltr" value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="TRX-000123" />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('ملاحظات السند', 'Voucher Notes')}</label>
                  <input type="text" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder={label('بيان عام…', 'Description…')} />
                </div>
              </div>
            </div>

            {/* ── تذييل ثابت ── */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.5rem', borderTop: '1px solid var(--bg-border)', background: 'var(--bg-card)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {amount && selectedCurrency ? `${label('المبلغ', 'Amount')}: ` : ''}
                {amount && selectedCurrency ? <strong className="mono" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>{`${amount} ${selectedCurrency}`}</strong> : ''}
              </span>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>{label('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-gold btn-lg" disabled={submitting}>
                  {submitting ? <div className="spinner" /> : <Banknote size={16} />} {label('إرسال طلب الدفع', 'Submit Payment Request')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <PortalCalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
