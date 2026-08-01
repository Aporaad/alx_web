import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, CheckCircle2, DollarSign, Clock, MapPin, Phone, MessageCircle } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { supabase } from '../../lib/supabase';
import type { CourierTask } from '../../types/portalTypes';

export default function CourierDashboard() {
  const { user } = usePortalAuth();
  const { tr, isRtl } = usePortalTheme();

  const [available, setAvailable] = useState(true);
  const [tasks, setTasks] = useState<CourierTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, earnings: 0 });

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('portal_orders')
        .select('*')
        .eq('courier_id', user?.uid)
        .in('status', ['accepted', 'in_progress', 'out_for_delivery'])
        .limit(5);

      const list: CourierTask[] = (data || []).map((o: any) => ({
        orderId: o.id,
        trackingNumber: o.tracking_number,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        recipientName: o.recipient_name,
        recipientPhone: o.recipient_phone,
        recipientAddress: o.recipient_address,
        deliveryCity: o.delivery_city,
        status: o.status,
        cashOnDelivery: o.estimated_cost,
        currency: o.currency || 'USD',
        assignedAt: o.updated_at || Date.now(),
      }));

      setTasks(list);

      const { count: todayCount } = await supabase
        .from('portal_orders')
        .select('*', { count: 'exact', head: true })
        .eq('courier_id', user?.uid)
        .eq('status', 'delivered');

      setStats({ today: todayCount || 0, earnings: (todayCount || 0) * 5 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Availability Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.2rem' }}>
            {tr('welcome')} {user?.fullName}! 🚚
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRtl ? 'لوحة تحكم وتوجيه العمليات الميدانية' : 'Field operations dispatch and control dashboard'}
          </p>
        </div>

        {/* Toggle */}
        <button
          className={`btn ${available ? 'btn-gold' : 'btn-ghost'}`}
          onClick={() => setAvailable(!available)}
          style={{ gap: '0.5rem' }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: available ? '#10b981' : '#ef4444' }} />
          {available ? tr('available') : tr('unavailable')}
        </button>
      </div>

      {/* Courier Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.08)' }}>
            <Truck size={20} style={{ color: '#fbbf24' }} />
          </div>
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">{tr('myTasks')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <CheckCircle2 size={20} style={{ color: '#34d399' }} />
          </div>
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">{tr('todayDeliveries')}</div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--gold-border)' }}>
          <div className="stat-icon" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <DollarSign size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{stats.earnings} USD</div>
          <div className="stat-label">{tr('pendingEarnings')}</div>
        </div>
      </div>

      {/* Active Tasks Grid */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{tr('myTasks')}</h2>
          <Link to="/portal/courier/tasks" className="btn btn-ghost btn-sm">{tr('viewDetails')}</Link>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner spinner-lg" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <Truck size={40} />
            <p>{isRtl ? 'لا توجد مهام توصيل مسندة حالياً' : 'No assigned deliveries currently'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {tasks.map(task => (
              <div key={task.orderId} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{task.trackingNumber}</span>
                  <span className={`badge status-${task.status}`}>{tr(`status_${task.status}` as any)}</span>
                </div>

                <div style={{ fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{task.recipientName}</div>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                    <MapPin size={12} /> {task.deliveryCity} — {task.recipientAddress}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <a href={`tel:${task.recipientPhone}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    <Phone size={12} /> {tr('callCustomer')}
                  </a>
                  <a href={`https://wa.me/${task.recipientPhone}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ color: '#25D366' }}>
                    <MessageCircle size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
