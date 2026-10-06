import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, TrendingUp, TrendingDown, DollarSign,
  PlusCircle, CreditCard, CheckCircle2, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { getCollection, getDocById } from '../../api/legacy-portal';
import { portalAuthGateway } from '../../api/portalAuthGateway';
import type { PortalPaymentRequestDto } from '../../api/portalAuthGateway';
import type { LedgerEntry } from '../../types/portalTypes';

function createPaymentRequestIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `portal-payment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CustomerLedgerPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PortalPaymentRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ debit: 0, credit: 0, balance: 0 });

  // Payment modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentCurrency, setPaymentCurrency] = useState<'YER' | 'USD' | 'SAR'>('YER');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'Wallet' | 'Check'>('Cash');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentRequestKey, setPaymentRequestKey] = useState(createPaymentRequestIdempotencyKey);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Load customer ledger entries
  const loadLedger = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (portalAuthGateway) {
      try {
        setPaymentRequests(await portalAuthGateway.listPaymentRequests());
      } catch (error) {
        console.error('[CustomerLedger] Error loading payment requests:', error);
      }
    } else {
      setPaymentRequests([]);
    }
    try {
      let custAccId = user.financialAccountId || '';
      let custAccCode = user.financialAccountCode || '';
      const linkedAccId = user.linkedAccId || user.linkedCustomerId || '';
      const uid = user.uid || '';

      // If financialAccountId is missing from user session state, fetch customer record
      if (!custAccId || !custAccCode) {
        if (linkedAccId) {
          const custDoc = await getDocById('customers', linkedAccId);
          if (custDoc) {
            custAccId = custAccId || custDoc.financialAccountId || custDoc.id || '';
            custAccCode = custAccCode || custDoc.financialAccountCode || '';
          }
        }
      }

      // Fetch all transactions and journal entries
      const [allTxs, allJvs] = await Promise.all([
        getCollection('account_transactions'),
        getCollection('journal_entries')
      ]);

      const customerIds = new Set<string>(
        [custAccId, custAccCode, linkedAccId, uid, user.fullName].filter(Boolean)
      );

      // Filter legs belonging to this customer
      const clientTxRows = allTxs.filter((r: any) => {
        const matchAccId = customerIds.has(r.accountId) || customerIds.has(r.entityId);
        const matchAccCode = custAccCode && (r.accountCode === custAccCode || r.code === custAccCode);
        const matchDebitCredit = customerIds.has(r.debitAccountId) || customerIds.has(r.creditAccountId);
        const matchNames = (r.customerName && r.customerName === user.fullName) || (r.entityName && r.entityName === user.fullName);
        const matchUids = (r.customerUid && r.customerUid === uid) || (r.createdByUid && r.createdByUid === uid && r.entityType === 'customer');

        return matchAccId || matchAccCode || matchDebitCredit || matchNames || matchUids;
      });

      // Also check journal entries where customer is credit or debit side
      allJvs.forEach((jv: any) => {
        const isCustomerDebit = customerIds.has(jv.debitAccountId) || (custAccCode && jv.debitAccountCode === custAccCode);
        const isCustomerCredit = customerIds.has(jv.creditAccountId) || (custAccCode && jv.creditAccountCode === custAccCode);

        if (isCustomerDebit || isCustomerCredit) {
          const existsInTx = clientTxRows.some((tx: any) => tx.journalEntryId === jv.id || tx.refNumber === jv.entryNumber);
          if (!existsInTx) {
            clientTxRows.push({
              id: jv.id,
              journalEntryId: jv.id,
              voucherNumber: jv.entryNumber,
              voucherDate: jv.createdAt,
              type: isCustomerDebit ? 'Debit' : 'Credit',
              amount: isCustomerDebit ? (jv.amountDebitCurrency || jv.amount) : (jv.amountCreditCurrency || jv.amount),
              currency: jv.currency || 'YER',
              description: jv.description || jv.notes || 'قيد محاسبي',
              refNumber: jv.entryNumber || jv.refNumber,
              createdAt: jv.createdAt,
            });
          }
        }
      });

      // Sort by date ascending to compute accurate chronological running balance
      clientTxRows.sort((a: any, b: any) => (a.createdAt || a.voucherDate || 0) - (b.createdAt || b.voucherDate || 0));

      let running = 0;
      let totalDebit = 0;
      let totalCredit = 0;

      const formatted: LedgerEntry[] = clientTxRows.map((r: any) => {
        const rawType = String(r.type || r.voucherType || '').toLowerCase();
        const isDebit = rawType === 'debit' || r.voucherType === 'order_charge' || r.debitAccountId === custAccId;
        const amount = Number(r.amount || r.amountOriginal || r.amountInDefaultCurrency) || 0;

        if (isDebit) {
          totalDebit += amount;
          running += amount;
        } else {
          totalCredit += amount;
          running -= amount;
        }

        return {
          id: r.id || `entry_${Math.random()}`,
          date: r.voucherDate || r.createdAt || Date.now(),
          description: r.description || r.notes || (isDebit ? 'قيد مالي (مدين)' : 'سداد دفعة حساب (دائن)'),
          refNumber: r.voucherNumber || r.refNumber || r.id?.slice(0, 8) || 'JV-REF',
          amount,
          currency: r.currency || r.currencyOriginal || 'YER',
          type: isDebit ? 'debit' : 'credit',
          runningBalance: running,
        };
      });

      // Display newest entries first
      setEntries([...formatted].reverse());
      setStats({ debit: totalDebit, credit: totalCredit, balance: running });
    } catch (err) {
      console.error('[CustomerLedger] Error loading ledger:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadLedger();
  }, [user, loadLedger]);

  // Submit a payment claim for staff verification; this never posts ledger entries.
  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setPaymentError(isRtl ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount');
      return;
    }
    if (!portalAuthGateway) {
      setPaymentError(isRtl
        ? 'إرسال طلبات السداد غير متاح لهذه الجلسة. لم يتم تسجيل أي دفعة أو قيد.'
        : 'Payment requests are unavailable for this session. No payment or ledger entry was recorded.');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');
    try {
      const paymentRequest = await portalAuthGateway.createPaymentRequest({
        amount: paymentAmount,
        currency: paymentCurrency,
        paymentMethod: ({
          Cash: 'cash',
          Transfer: 'transfer',
          Wallet: 'wallet',
          Check: 'check',
        } as const)[paymentMethod],
        ...(paymentRefNumber.trim() ? { reference: paymentRefNumber.trim() } : {}),
        ...(paymentNotes.trim() ? { notes: paymentNotes.trim() } : {}),
      }, paymentRequestKey);
      setPaymentRequests((current) => [paymentRequest, ...current.filter((item) => item.id !== paymentRequest.id)]);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
        setPaymentRefNumber('');
        setPaymentNotes('');
        setPaymentRequestKey(createPaymentRequestIdempotencyKey());
        loadLedger();
      }, 1800);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : tr('error'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getCurrencySymbol = (curr?: string) => {
    if (curr === 'USD') return '$ (دولار)';
    if (curr === 'SAR') return 'ر.س (سعودي)';
    return 'ر.ي (يمني)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Page Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative' }}>
        <div className="gold-line-top" />
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {tr('ledgerTitle')}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'كشف الحركة المالية والقيود الدفترية الشاملة الخاص بحسابك' : 'Comprehensive account transactions statement'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-gold" onClick={() => setIsPaymentModalOpen(true)}>
            <CreditCard size={16} /> {isRtl ? 'تسديد دفعة حساب' : 'Pay Installment'}
          </button>
          <button className="btn btn-outline" onClick={handleExportPDF}>
            <Download size={16} /> {tr('exportPDF')}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.08)' }}>
            <TrendingUp size={20} style={{ color: '#f87171' }} />
          </div>
          <div className="stat-value">{stats.debit.toLocaleString()} YER</div>
          <div className="stat-label">{tr('totalDebit')} ({isRtl ? 'إجمالي المديونية والطلبات' : 'Total Charges'})</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <TrendingDown size={20} style={{ color: '#34d399' }} />
          </div>
          <div className="stat-value">{stats.credit.toLocaleString()} YER</div>
          <div className="stat-label">{tr('totalCredit')} ({isRtl ? 'إجمالي الدفعات والمسدد' : 'Total Payments'})</div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--gold-border)' }}>
          <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{stats.balance.toLocaleString()} YER</div>
          <div className="stat-label">{tr('netBalance')} ({isRtl ? 'الرصيد القائم المتبقي' : 'Current Net Balance'})</div>
        </div>
      </div>

      {portalAuthGateway && paymentRequests.length > 0 && (
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {isRtl ? 'طلبات السداد ومراجعتها' : 'Payment Requests & Reviews'}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={loadLedger} aria-label={isRtl ? 'تحديث الطلبات' : 'Refresh requests'}>
              <RefreshCw size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {paymentRequests.slice(0, 8).map((paymentRequest) => {
              const pending = paymentRequest.status === 'pending_verification';
              const settled = paymentRequest.status === 'settled';
              return (
                <div key={paymentRequest.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.025)' }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {paymentRequest.amount.toLocaleString()} {paymentRequest.currency}
                      {paymentRequest.reference ? ` · ${paymentRequest.reference}` : ''}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(paymentRequest.createdAt).toLocaleString('en-GB')}
                      {paymentRequest.reviewNote ? ` · ${paymentRequest.reviewNote}` : ''}
                    </div>
                  </div>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 800,
                    color: pending ? 'var(--gold)' : settled ? '#34d399' : '#f87171',
                    background: pending ? 'rgba(212,175,55,0.1)' : settled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    {pending ? (isRtl ? 'بانتظار التحقق' : 'Pending verification')
                      : settled ? (isRtl ? 'تمت المطابقة' : 'Matched to posted entry')
                        : (isRtl ? 'مرفوض' : 'Rejected')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {isRtl ? 'سجل القيود والحركات المالية المعتمدة في حسابك' : 'System Ledger Transactions Record'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={loadLedger}>
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <p>{tr('noTransactions')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('date')}</th>
                  <th>{tr('refNumber')} (رقم السند/المرجع)</th>
                  <th>{tr('description')}</th>
                  <th>نوع الحركة</th>
                  <th>{tr('amount')}</th>
                  <th>{tr('runningBalance')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(row => (
                  <tr key={row.id}>
                    <td>{new Date(row.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold)' }}>{row.refNumber}</td>
                    <td>{row.description}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: row.type === 'debit' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: row.type === 'debit' ? '#f87171' : '#34d399',
                        border: row.type === 'debit' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)'
                      }}>
                        {row.type === 'debit' ? (isRtl ? 'مدين (+قيمة طلب)' : 'Debit') : (isRtl ? 'دائن (-دفعة/سداد)' : 'Credit')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: row.type === 'debit' ? '#f87171' : '#34d399' }}>
                      {row.type === 'debit' ? '+' : '-'}{row.amount.toLocaleString()} {getCurrencySymbol(row.currency)}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                      {row.runningBalance.toLocaleString()} YER
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Installment Modal */}
      {isPaymentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal-box animate-scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="gold-line-top" />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={18} /> {isRtl ? 'تسديد دفعة لحسابك' : 'Pay Account Installment'}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsPaymentModalOpen(false)}><X size={16} /></button>
              </div>

              {paymentSuccess ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <CheckCircle2 size={48} style={{ color: '#34d399', margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>{isRtl ? 'تم إرسال طلب السداد للمراجعة' : 'Payment request submitted for review'}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {isRtl ? 'لم يُسجل أي قيد ولم يتغير رصيدك. ستظهر الدفعة في الكشف بعد التحقق وربطها بقيد مالي منشور.' : 'No ledger entry or balance change was made. The ledger will update only after staff verification and a matching posted finance entry.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePayInstallment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {!portalAuthGateway && (
                    <div className="alert alert-error">
                      <AlertCircle size={14} />
                      {isRtl ? 'طلبات السداد عبر API غير مفعلة لهذه الجلسة. تم إيقاف التسجيل المباشر لحماية رصيدك.' : 'API payment requests are not enabled for this session. Direct ledger writes are disabled to protect your balance.'}
                    </div>
                  )}
                  {paymentError && (
                    <div className="alert alert-error"><AlertCircle size={14} /> {paymentError}</div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'المبلغ المراد تسديده' : 'Payment Amount'}</label>
                      <input
                        type="number" min="0.01" step="0.01" required className="form-input" dir="ltr"
                        value={paymentAmount || ''} onChange={e => { setPaymentAmount(parseFloat(e.target.value) || 0); setPaymentRequestKey(createPaymentRequestIdempotencyKey()); }}
                        placeholder="e.g. 10000"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'العملة' : 'Currency'}</label>
                      <select className="form-select" value={paymentCurrency} onChange={e => { setPaymentCurrency(e.target.value as 'YER' | 'USD' | 'SAR'); setPaymentRequestKey(createPaymentRequestIdempotencyKey()); }}>
                        <option value="YER">YER (ريال يمني)</option>
                        <option value="USD">USD (دولار أمريكي)</option>
                        <option value="SAR">SAR (ريال سعودي)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <select className="form-select" value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value as 'Cash' | 'Transfer' | 'Wallet' | 'Check'); setPaymentRequestKey(createPaymentRequestIdempotencyKey()); }}>
                        <option value="Cash">{isRtl ? 'نقداً (Cash)' : 'Cash'}</option>
                        <option value="Transfer">{isRtl ? 'تحويل بنكي / حوالة' : 'Bank Transfer'}</option>
                        <option value="Wallet">{isRtl ? 'محفظة إلكترونية' : 'Wallet'}</option>
                        <option value="Check">{isRtl ? 'شيك بنكي' : 'Check'}</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'رقم الحوالة / الإشعار (اختياري)' : 'Reference / Voucher No.'}</label>
                      <input
                        type="text" className="form-input"
                        value={paymentRefNumber} onChange={e => { setPaymentRefNumber(e.target.value); setPaymentRequestKey(createPaymentRequestIdempotencyKey()); }}
                        placeholder="e.g. TR-99821"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'البيان / ملاحظات الدفعة' : 'Notes / Statement'}</label>
                    <textarea
                      className="form-input" rows={2}
                      value={paymentNotes} onChange={e => { setPaymentNotes(e.target.value); setPaymentRequestKey(createPaymentRequestIdempotencyKey()); }}
                      placeholder={isRtl ? 'اسم المحول، اسم الصراف، تفاصيل إضافية...' : 'Sender name, bank details, notes...'}
                    />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '0.4rem' }}>
                    {isRtl ? 'هذا طلب مراجعة فقط. لا يتم اعتماد التحويل أو تحديث الرصيد قبل التحقق من الاستلام وربط الطلب بقيد مالي منشور.' : 'This is a verification request only. Funds are not assumed received and your balance is unchanged until staff verifies it and links a matching posted finance entry.'}
                  </div>

                  <button type="submit" disabled={submittingPayment || !portalAuthGateway} className="btn btn-gold btn-full btn-lg">
                    {submittingPayment ? <div className="spinner" /> : <PlusCircle size={16} />}
                    {isRtl ? 'إرسال طلب التحقق' : 'Submit for verification'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
