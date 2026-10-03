import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { ledgerGateway } from '../../data/gateways/supabase/supabase-ledger.gateway';
import type { FinancialAccountDto, LedgerEntry } from '../../types/portalTypes';

export default function CourierLedgerPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [account, setAccount] = useState<FinancialAccountDto | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const entityId = user.linkedAccId || user.linkedCourierId || user.uid;
      const acc = await ledgerGateway.getAccountByEntity(entityId, 'courier');
      setAccount(acc);

      if (acc && acc.accountId) {
        const list = await ledgerGateway.getClientLedgerEntries(acc.accountId);
        setEntries(list);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('[CourierLedgerPage] Error loading ledger:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{tr('myEarnings')}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'سجل العمولات والأرباح والمبالغ المحصلة المستخرجة من القيود الدفترية' : 'Record of earned commissions and ledger entries'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadLedger}><RefreshCw size={14} /></button>
          <button className="btn btn-gold" onClick={() => window.print()}>
            <Download size={16} /> {tr('exportPDF')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ borderColor: 'var(--gold-border)' }}>
          <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>
            {(account?.balance || 0).toLocaleString()} {account?.currency || 'YER'}
          </div>
          <div className="stat-label">{tr('pendingEarnings')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <CheckCircle size={20} style={{ color: '#34d399' }} />
          </div>
          <div className="stat-value">{entries.length}</div>
          <div className="stat-label">{isRtl ? 'إجمالي حركات القيود' : 'Total Entries'}</div>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state"><DollarSign size={40} /><p>{tr('noTransactions')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('orderDate')}</th>
                  <th>{tr('refNumber')}</th>
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
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{row.refNumber}</td>
                    <td>{row.description}</td>
                    <td>
                      <span className={`badge status-${row.type === 'credit' ? 'delivered' : 'pending'}`}>
                        {row.type === 'credit' ? (isRtl ? 'دائن (+عمولة)' : 'Credit') : (isRtl ? 'مدين (-تسديد)' : 'Debit')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: row.type === 'credit' ? '#34d399' : '#f87171' }}>
                      {row.type === 'credit' ? '+' : '-'}{row.amount.toLocaleString()} {row.currency}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                      {row.runningBalance.toLocaleString()} {row.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
