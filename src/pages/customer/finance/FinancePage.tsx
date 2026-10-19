/**
 * FinancePage.tsx — صفحة المالية (بوابة العميل §4.5): نظرة مالية + دفتر حسابي مدمجان في تبويب واحد،
 * وكشف حساب مخصص (D3). الدفع لا يظهر إلا عبر زر «طلب دفع جديد» (نافذة منبثقة مطابقة للنظام).
 * Customer finance page: overview + ledger merged into ONE "summary" tab, plus a statement tab.
 * The payment form no longer renders inline; it appears only when «طلب دفع جديد» opens the modal.
 */
import React, { useState } from 'react';
import { Wallet, TrendingUp, FileText, Receipt, RefreshCw, Clock, Printer, Banknote, LayoutList } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { useCustomerFinance } from './useCustomerFinance';
import CustomerPaymentModal from './CustomerPaymentModal';
import StatementSection from './StatementSection';

type Tab = 'summary' | 'statement';

const REQ_STATUS: Record<string, { ar: string; en: string; tone: string }> = {
  pending_verification: { ar: 'قيد التحقق', en: 'Pending verification', tone: 'in_progress' },
  settled: { ar: 'تم التحصيل', en: 'Settled', tone: 'delivered' },
  rejected: { ar: 'مرفوض', en: 'Rejected', tone: 'cancelled' },
};

const TAB_ICON: Record<Tab, React.ReactNode> = {
  summary: <LayoutList size={14} />,
  statement: <Printer size={14} />,
};

export default function FinancePage() {
  const { isRtl } = usePortalTheme();
  const { balance, stats, requests, ledger, loading, reload } = useCustomerFinance();
  const [tab, setTab] = useState<Tab>('summary');
  const [payOpen, setPayOpen] = useState(false);

  const label = (ar: string, en: string) => (isRtl ? ar : en);
  const money = (v: number | undefined, symbol: string) => `${(v ?? 0).toLocaleString()} ${symbol}`;
  const symbol = balance?.currency.symbol ?? stats?.currency.symbol ?? '';
  const currencyCode = balance?.currency.code ?? stats?.currency.code ?? '';
  const totalPending = requests.filter(r => r.status === 'pending_verification').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['summary', 'statement'] as Tab[]).map(t => (
            <button key={t} className={`btn btn-sm${tab === t ? ' btn-gold' : ' btn-ghost'}`} onClick={() => setTab(t)}>
              {TAB_ICON[t]}
              {t === 'summary' ? label('نظرة مالية ودفتر', 'Overview & Ledger') : label('كشف حساب', 'Statement')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-gold btn-sm" onClick={() => setPayOpen(true)}><Banknote size={14} /> {label('طلب دفع جديد', 'New Payment Request')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => void reload()} disabled={loading}><RefreshCw size={14} /> {label('تحديث', 'Refresh')}</button>
        </div>
      </div>

      {tab === 'statement' ? (
        <StatementSection />
      ) : loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : (
        <>
          {/* بطاقات الرصيد والإحصاءات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Wallet size={13} /> {label('الرصيد الحالي', 'Current Balance')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>{money(balance?.balance, symbol)}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Receipt size={13} /> {label('إجمالي المدفوع', 'Total Paid')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>{money(stats?.totalPaid, symbol)}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><TrendingUp size={13} /> {label('المتبقي المستحق', 'Outstanding')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>{money(stats?.totalOutstanding, symbol)}</div>
            </div>
            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{label('إجمالي الطلبات', 'Total Orders')}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>{stats?.totalOrders ?? 0}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            {/* سجل طلبات الدفع (النقر على «طلب دفع جديد» يفتح النافذة) */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} /> {label('طلبات الدفع', 'Payment Requests')}
                {totalPending > 0 && <span className="badge status-in_progress" style={{ fontSize: '0.65rem', marginInlineStart: 'auto' }}>{label(`${totalPending} قيد التحقق`, `${totalPending} pending`)}</span>}
              </h4>
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label('لا توجد طلبات دفع بعد. اضغط «طلب دفع جديد» لإنشاء طلب.', 'No payment requests yet. Press "New Payment Request" to create one.')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {requests.slice(0, 8).map(r => {
                    const meta = REQ_STATUS[r.status] ?? { ar: r.status, en: r.status, tone: 'pending' };
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--bg-border)', paddingBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{money(r.amount, '')} {r.currency}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('en-GB')} • {r.paymentMethod}</div>
                        </div>
                        <span className={`badge status-${meta.tone}`} style={{ fontSize: '0.68rem' }}>{isRtl ? meta.ar : meta.en}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.85rem 0 0' }}>{label('تُراجع الطلبات وتُعتمد من الموظفين؛ لا تُسجَّل أي حركة مالية ذاتيًا.', 'Requests are reviewed and approved by staff; no entry is posted by the customer.')}</p>
            </div>

            {/* الدفتر الحسابي مدمج داخل تبويب النظرة المالية */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={15} /> {label('الدفتر الحسابي', 'Ledger')}</h4>
              {ledger.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label('لا توجد حركات حسابية بعد.', 'No ledger entries yet.')}</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>{label('القيد', 'Entry')}</th>
                        <th>{label('النوع', 'Type')}</th>
                        <th>{label('المبلغ', 'Amount')}</th>
                        <th>{label('التاريخ', 'Date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.slice(0, 8).map(entry => (
                        <tr key={entry.entryId}>
                          <td style={{ direction: 'ltr', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{entry.entryNumber || '—'}</td>
                          <td><span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{entry.transType || '—'}</span></td>
                          <td style={{ direction: 'ltr', fontWeight: 800, color: 'var(--gold)' }}>{entry.amount.toLocaleString()}</td>
                          <td style={{ direction: 'ltr', fontSize: '0.75rem' }}>{new Date(entry.createdAt).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <CustomerPaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        currencyCode={currencyCode}
        currencySymbol={symbol}
        onSubmitted={() => void reload()}
      />
    </div>
  );
}
