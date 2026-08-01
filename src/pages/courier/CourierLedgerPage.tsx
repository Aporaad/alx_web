import React, { useState, useEffect } from 'react';
import { DollarSign, Download, TrendingUp, CheckCircle } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';

export default function CourierLedgerPage() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadLedger();
  }, [user]);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('portal_orders')
        .select('*')
        .eq('courier_id', user?.uid)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      const list = data || [];
      setDeliveries(list);
      setTotalEarnings(list.length * 5); // 5 USD per delivery commission
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{tr('myEarnings')}</h1>
          <p>{isRtl ? 'سجل العمولات والأرباح والمبالغ المحصلة' : 'Record of earned commissions and collected amounts'}</p>
        </div>
        <button className="btn btn-gold" onClick={() => window.print()}>
          <Download size={16} /> {tr('exportPDF')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card" style={{ borderColor: 'var(--gold-border)' }}>
          <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{totalEarnings} USD</div>
          <div className="stat-label">{tr('pendingEarnings')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <CheckCircle size={20} style={{ color: '#34d399' }} />
          </div>
          <div className="stat-value">{deliveries.length}</div>
          <div className="stat-label">{tr('todayDeliveries')}</div>
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : deliveries.length === 0 ? (
          <div className="empty-state"><DollarSign size={40} /><p>{tr('noTransactions')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('trackingNumber')}</th>
                  <th>{tr('orderDate')}</th>
                  <th>{tr('recipient')}</th>
                  <th>{tr('cost')}</th>
                  <th>{isRtl ? 'العمولة' : 'Commission'}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{d.tracking_number}</td>
                    <td>{new Date(d.created_at).toLocaleDateString('en-GB')}</td>
                    <td>{d.recipient_name}</td>
                    <td>{d.estimated_cost} {d.currency || 'USD'}</td>
                    <td style={{ fontWeight: 800, color: '#34d399' }}>+5 USD</td>
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
