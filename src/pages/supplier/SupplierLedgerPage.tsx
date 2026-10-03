import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, Factory, RefreshCw } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { ledgerGateway } from '../../data/gateways/supabase/supabase-ledger.gateway';
import type { FinancialAccountDto, LedgerEntry } from '../../types/portalTypes';

export default function SupplierLedgerPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [account, setAccount] = useState<FinancialAccountDto | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSupplierLedger = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const entityId = user.linkedAccId || user.linkedSourceId || user.uid;
      const acc = await ledgerGateway.getAccountByEntity(entityId, 'supplier');
      setAccount(acc);

      if (acc && acc.accountId) {
        const list = await ledgerGateway.getClientLedgerEntries(acc.accountId);
        setEntries(list);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('[SupplierLedgerPage] Error loading ledger:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSupplierLedger();
  }, [loadSupplierLedger]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{tr('mySupplierLedger')}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'كشف الحساب المستندي وعمليات التوريد والسندات المستخرجة من القيود الدفترية' : 'Documentary account statement and supply ledger'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadSupplierLedger}><RefreshCw size={14} /></button>
          <button className="btn btn-gold" onClick={() => window.print()}>
            <Download size={16} /> {tr('exportPDF')}
          </button>
        </div>
      </div>

      <div className="stat-card" style={{ borderColor: 'var(--gold-border)', maxWidth: 320 }}>
        <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
          <DollarSign size={20} style={{ color: 'var(--gold)' }} />
        </div>
        <div className="stat-value" style={{ color: 'var(--gold)' }}>
          {(account?.balance || 0).toLocaleString()} {account?.currency || 'USD'}
        </div>
        <div className="stat-label">{tr('netBalance')}</div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state"><Factory size={40} /><p>{tr('noTransactions')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('date')}</th>
                  <th>{tr('refNumber')}</th>
                  <th>{tr('description')}</th>
                  <th>نوع الحركة</th>
                  <th>{tr('amount')}</th>
                  <th>{tr('runningBalance')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold)' }}>{t.refNumber}</td>
                    <td>{t.description}</td>
                    <td>
                      <span className={`badge status-${t.type === 'credit' ? 'delivered' : 'pending'}`}>
                        {t.type === 'credit' ? (isRtl ? 'دائن (+توريد)' : 'Credit') : (isRtl ? 'مدين (-سداد)' : 'Debit')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: t.type === 'credit' ? '#34d399' : '#f87171' }}>
                      {t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString()} {t.currency}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                      {t.runningBalance.toLocaleString()} {t.currency}
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
