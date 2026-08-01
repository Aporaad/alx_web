import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, TrendingUp, TrendingDown, DollarSign,
  PlusCircle, CreditCard, CheckCircle2, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase, getCollection, getDocById, upsertDoc, updateDocData } from '../../lib/supabase';
import type { LedgerEntry } from '../../types/portalTypes';

export default function CustomerLedgerPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ debit: 0, credit: 0, balance: 0 });

  // Payment modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentCurrency, setPaymentCurrency] = useState<'YER' | 'USD' | 'SAR'>('YER');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'Wallet' | 'Check'>('Cash');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Load customer ledger entries
  const loadLedger = useCallback(async () => {
    if (!user) return;
    setLoading(true);
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

  // Handle double-entry payment voucher submission
  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || paymentAmount <= 0) {
      setPaymentError(isRtl ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError('');

    try {
      const now = Date.now();
      const YY = String(new Date().getFullYear()).slice(-2);
      const MM = String(new Date().getMonth() + 1).padStart(2, '0');
      const RND = Math.floor(1000 + Math.random() * 9000);
      const voucherNumber = `RCT-${YY}${MM}-${RND}`;
      const jvId = `jv_${voucherNumber}`;
      const debitTxId = `tx_debit_${voucherNumber}`;
      const creditTxId = `tx_credit_${voucherNumber}`;

      // 1. Locate Cash Box Account & Customer Financial Account
      let cashAccountId = 'sys_cash_account';
      let cashAccountCode = '1111-0';
      let cashAccountName = 'حساب الصندوق العام (كاش)';

      try {
        const accountsList = await getCollection('accounts');
        const cashAcc = accountsList.find(
          (a: any) =>
            a.entityId === 'sys_cash_account' ||
            a.accountCode === '1111-0' ||
            a.accountCode === '1110-0001' ||
            a.accountPrefix === '1110'
        );
        if (cashAcc) {
          cashAccountId = cashAcc.id;
          cashAccountCode = cashAcc.accountCode || cashAcc.code || '1111-0';
          cashAccountName = cashAcc.entityName || cashAcc.nameAr || 'حساب الصندوق العام (كاش)';
        }
      } catch (_) {}

      const custAccountId = user.financialAccountId || user.linkedAccId || user.uid;
      const custAccountCode = user.financialAccountCode || '1130-0001';

      // 2. Compute exchange rate equivalents for base YER accounting
      let amountInYER = paymentAmount;
      if (paymentCurrency === 'USD') amountInYER = paymentAmount * 535;
      else if (paymentCurrency === 'SAR') amountInYER = paymentAmount * 140;

      const descText = paymentNotes
        ? `تسديد دفعة حساب (${paymentCurrency} ${paymentAmount}): ${paymentNotes}`
        : `تسديد دفعة حساب عبر بوابة الويب (${paymentCurrency} ${paymentAmount})`;

      // 3. Write Master Double-Entry Voucher in `journal_entries`
      const jvPayload = {
        id: jvId,
        entryNumber: voucherNumber,
        createdAt: now,
        description: descText,
        notes: paymentNotes || '',
        debitAccountId: cashAccountId,
        debitAccountName: cashAccountName,
        debitAccountCode: cashAccountCode,
        creditAccountId: custAccountId,
        creditAccountName: user.fullName,
        creditAccountCode: custAccountCode,
        amount: paymentAmount,
        currency: paymentCurrency,
        amountDebitCurrency: amountInYER,
        amountCreditCurrency: paymentAmount,
        module: 'payment',
        refNumber: paymentRefNumber || voucherNumber,
        paymentMethod,
        source: 'web_portal',
        createdByUid: user.uid,
        createdByName: `${user.fullName} (بوابة الويب)`,
        updatedAt: now,
      };
      await upsertDoc('journal_entries', jvId, jvPayload);

      // 4. Write DEBIT Leg in `account_transactions` (Cash Account Side)
      const debitLeg = {
        id: debitTxId,
        journalEntryId: jvId,
        journalEntryNumber: voucherNumber,
        voucherNumber,
        voucherType: 'payment',
        voucherDate: now,
        accountId: cashAccountId,
        accountCode: cashAccountCode,
        entityType: 'system',
        entityId: 'sys_cash_account',
        entityName: cashAccountName,
        type: 'Debit',
        amount: amountInYER,
        amountOriginal: paymentAmount,
        currencyOriginal: paymentCurrency,
        currency: 'YER',
        description: `قبض دفعة من العميل: ${user.fullName}`,
        notes: paymentNotes,
        refNumber: paymentRefNumber || voucherNumber,
        paymentMethod,
        module: 'payment',
        status: 'Approved',
        source: 'web_portal',
        createdByUid: user.uid,
        createdByName: `${user.fullName} (بوابة الويب)`,
        createdAt: now,
        updatedAt: now,
      };
      await upsertDoc('account_transactions', debitTxId, debitLeg);

      // 5. Write CREDIT Leg in `account_transactions` (Customer Account Side)
      const creditLeg = {
        id: creditTxId,
        journalEntryId: jvId,
        journalEntryNumber: voucherNumber,
        voucherNumber,
        voucherType: 'payment',
        voucherDate: now,
        accountId: custAccountId,
        accountCode: custAccountCode,
        entityType: 'customer',
        entityId: user.linkedAccId || user.uid,
        entityName: user.fullName,
        customerName: user.fullName,
        customerUid: user.uid,
        type: 'Credit',
        amount: paymentAmount,
        amountOriginal: paymentAmount,
        currencyOriginal: paymentCurrency,
        currency: paymentCurrency,
        description: descText,
        notes: paymentNotes,
        refNumber: paymentRefNumber || voucherNumber,
        paymentMethod,
        module: 'payment',
        status: 'Approved',
        source: 'web_portal',
        createdByUid: user.uid,
        createdByName: `${user.fullName} (بوابة الويب)`,
        createdAt: now,
        updatedAt: now,
      };
      await upsertDoc('account_transactions', creditTxId, creditLeg);

      // 6. Update Customer Entity financial balance in `customers` table
      if (user.linkedAccId) {
        try {
          const custDoc = await getDocById('customers', user.linkedAccId);
          if (custDoc) {
            const currentBal = Number(custDoc.financialBalance || 0);
            await updateDocData('customers', user.linkedAccId, {
              financialBalance: currentBal - amountInYER,
              updatedAt: now,
            });
          }
        } catch (err) {
          console.warn('[CustomerLedger] Could not update customer entity balance:', err);
        }
      }

      // 7. Update Customer Account balance in `accounts` table
      if (custAccountId) {
        try {
          const accDoc = await getDocById('accounts', custAccountId);
          if (accDoc) {
            const curBal = Number(accDoc.balance || 0);
            const curCredit = Number(accDoc.creditTotal || 0);
            await updateDocData('accounts', custAccountId, {
              balance: curBal - paymentAmount,
              creditTotal: curCredit + paymentAmount,
              updatedAt: now,
            });
          }
        } catch (err) {
          console.warn('[CustomerLedger] Could not update customer account balance:', err);
        }
      }

      // 8. Update Cash Box Account balance in `accounts` table
      if (cashAccountId) {
        try {
          const cashDoc = await getDocById('accounts', cashAccountId);
          if (cashDoc) {
            const curBal = Number(cashDoc.balance || 0);
            const curDebit = Number(cashDoc.debitTotal || 0);
            await updateDocData('accounts', cashAccountId, {
              balance: curBal + amountInYER,
              debitTotal: curDebit + amountInYER,
              updatedAt: now,
            });
          }
        } catch (err) {
          console.warn('[CustomerLedger] Could not update cash account balance:', err);
        }
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
        setPaymentRefNumber('');
        setPaymentNotes('');
        loadLedger();
      }, 1800);
    } catch (err: any) {
      setPaymentError(err.message || tr('error'));
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
                  <CreditCard size={18} /> {isRtl ? 'تسديد دفعة لحسابك (إصدار سند قبض قيد مالي)' : 'Pay Account Installment'}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsPaymentModalOpen(false)}><X size={16} /></button>
              </div>

              {paymentSuccess ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <CheckCircle2 size={48} style={{ color: '#34d399', margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>{isRtl ? 'تم تسجيل القيد والسند المالي بنجاح!' : 'Payment Recorded Successfully!'}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {isRtl ? 'تم قيد السند مزدوج الأطراف (من حساب العميل إلى حساب الصندوق العام) وتحديث الرصيد بنجاح.' : 'Double-entry journal voucher recorded into general ledger.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePayInstallment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {paymentError && (
                    <div className="alert alert-error"><AlertCircle size={14} /> {paymentError}</div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'المبلغ المراد تسديده' : 'Payment Amount'}</label>
                      <input
                        type="number" min="1" step="any" required className="form-input" dir="ltr"
                        value={paymentAmount || ''} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 10000"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'العملة' : 'Currency'}</label>
                      <select className="form-select" value={paymentCurrency} onChange={e => setPaymentCurrency(e.target.value as any)}>
                        <option value="YER">YER (ريال يمني)</option>
                        <option value="USD">USD (دولار أمريكي)</option>
                        <option value="SAR">SAR (ريال سعودي)</option>
                      </select>
                    </div>
                  </div>

                  {paymentCurrency !== 'YER' && paymentAmount > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold)', background: 'rgba(212,175,55,0.08)', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: '1px solid rgba(212,175,55,0.2)' }}>
                      💡 {isRtl ? `المبلغ المقدر بالريال اليمني: ${(paymentAmount * (paymentCurrency === 'USD' ? 535 : 140)).toLocaleString()} YER` : `Equivalent YER: ${(paymentAmount * (paymentCurrency === 'USD' ? 535 : 140)).toLocaleString()} YER`}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label className="form-label">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
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
                        value={paymentRefNumber} onChange={e => setPaymentRefNumber(e.target.value)}
                        placeholder="e.g. TR-99821"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{isRtl ? 'البيان / ملاحظات الدفعة' : 'Notes / Statement'}</label>
                    <textarea
                      className="form-input" rows={2}
                      value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                      placeholder={isRtl ? 'اسم المحول، اسم الصراف، تفاصيل إضافية...' : 'Sender name, bank details, notes...'}
                    />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '0.4rem' }}>
                    📌 {isRtl ? 'سيتم قيد القيد المحاسبي تلقائياً: الطرف المدين (الصندوق العام) ⬅️ الطرف الدائن (حسابك المالي).' : 'Double-entry journal voucher: Debit (Cash Account) ⬅️ Credit (Customer Account).'}
                  </div>

                  <button type="submit" disabled={submittingPayment} className="btn btn-gold btn-full btn-lg">
                    {submittingPayment ? <div className="spinner" /> : <PlusCircle size={16} />}
                    {isRtl ? 'تأكيد وقيد السند مزدوج الأطراف' : 'Confirm & Record Double-Entry Voucher'}
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
