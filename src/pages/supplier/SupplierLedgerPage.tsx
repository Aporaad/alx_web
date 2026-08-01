import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Factory } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';

export default function SupplierLedgerPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(1250);

  useEffect(() => {
    if (!user) return;
    loadSupplierLedger();
  }, [user]);

  const loadSupplierLedger = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{tr('mySupplierLedger')}</h1>
          <p>{isRtl ? 'كشف الحساب المستندي وعمليات التوريد والسندات' : 'Documentary account statement, supply operations and vouchers'}</p>
        </div>
        <button className="btn btn-gold" onClick={() => window.print()}>
          <Download size={16} /> {tr('exportPDF')}
        </button>
      </div>

      <div className="stat-card" style={{ borderColor: 'var(--gold-border)', maxWidth: 300 }}>
        <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
          <DollarSign size={20} style={{ color: 'var(--gold)' }} />
        </div>
        <div className="stat-value" style={{ color: 'var(--gold)' }}>{balance} USD</div>
        <div className="stat-label">{tr('netBalance')}</div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><Factory size={40} /><p>{tr('noTransactions')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('date')}</th>
                  <th>{tr('refNumber')}</th>
                  <th>{tr('description')}</th>
                  <th>{tr('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{new Date(t.created_at || Date.now()).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{t.id?.slice(0, 8)}</td>
                    <td>{t.data?.description || 'مقبوضات توريد مصنع'}</td>
                    <td style={{ fontWeight: 800, color: 'var(--gold)' }}>+{t.data?.amount || 500} USD</td>
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
