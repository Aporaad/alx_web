import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Factory, Package, Layers, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';
import type { SupplierOrder } from '../../types/portalTypes';

export default function SupplierDashboard() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, totalCbm: 0, totalWeight: 0, balance: 0 });

  useEffect(() => {
    if (!user) return;
    loadSupplierDashboard();
  }, [user]);

  const loadSupplierDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('portal_orders')
        .select('*')
        .eq('package_type', 'factory_cbm')
        .order('created_at', { ascending: false })
        .limit(5);

      const list: SupplierOrder[] = (data || []).map((o: any) => ({
        id: o.id,
        trackingNumber: o.tracking_number,
        description: o.goods_description,
        weightKg: o.weight_kg || 100,
        cbmVolume: o.cbm_volume || 1.5,
        stage: o.status === 'delivered' ? 'delivered' : 'manufacturing',
        sourceId: o.customer_uid,
        requestedAt: o.created_at,
        updatedAt: o.updated_at,
      }));

      let cbm = 0;
      let weight = 0;
      list.forEach(o => {
        cbm += o.cbmVolume || 0;
        weight += o.weightKg || 0;
      });

      setOrders(list);
      setStats({ count: list.length, totalCbm: Math.round(cbm * 10) / 10, totalWeight: weight, balance: 1250 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.2rem' }}>
            {tr('welcome')} {user?.fullName}! 🏭
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'لوحة متابعة طلبات التصنيع والتوريد وشحنات الـ CBM' : 'Manufacturing & factory supply dashboard for CBM shipments'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>
            <Factory size={20} style={{ color: '#a78bfa' }} />
          </div>
          <div className="stat-value">{stats.count}</div>
          <div className="stat-label">{tr('mySupplyOrders')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Layers size={20} style={{ color: '#60a5fa' }} />
          </div>
          <div className="stat-value">{stats.totalCbm} m³</div>
          <div className="stat-label">{tr('totalCBM')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Package size={20} style={{ color: '#34d399' }} />
          </div>
          <div className="stat-value">{stats.totalWeight} KG</div>
          <div className="stat-label">{tr('totalWeight')}</div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--gold-border)' }}>
          <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{stats.balance} USD</div>
          <div className="stat-label">{tr('balance')}</div>
        </div>
      </div>

      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{tr('mySupplyOrders')}</h2>
          <Link to="/portal/supplier/orders" style={{ fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {tr('mySupplyOrders')} {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </Link>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><Factory size={40} /><p>{tr('noOrders')}</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{tr('trackingNumber')}</th>
                  <th>{tr('description')}</th>
                  <th>{tr('cbmVolume')}</th>
                  <th>{tr('weightKg')}</th>
                  <th>{tr('status')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{ord.trackingNumber}</td>
                    <td>{ord.description}</td>
                    <td style={{ fontWeight: 700 }}>{ord.cbmVolume} m³</td>
                    <td>{ord.weightKg} KG</td>
                    <td><span className="badge badge-info">{tr(`stage_${ord.stage}` as any)}</span></td>
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
