import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { portalGateway } from '../../api';
import type { PortalAnnouncementDto } from '../../contracts';
import { asyncState, runQuery, type AsyncState } from '../../contracts';

export default function AnnouncementsPage() {
  const { tr, isRtl } = usePortalTheme();
  const { user } = usePortalAuth();

  const [queryState, setQueryState] = useState<AsyncState<PortalAnnouncementDto[]>>(asyncState.loading());
  const announcements = queryState.status === 'success' ? queryState.data : [];
  const loading = queryState.status === 'loading';

  useEffect(() => {
    loadAnnouncements();
  }, [user]);

  const loadAnnouncements = async () => {
    await runQuery(
      () => portalGateway.getAnnouncements(),
      setQueryState,
      (data) => data.length === 0,
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <h1>{tr('announcements')}</h1>
        <p>{isRtl ? 'تابع أحدث إعلانات وعروض وتحديثات الشركة الرسمية' : 'Follow the latest official company announcements and offers'}</p>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-lg" /></div>
      ) : queryState.status === 'empty' ? (
        <div className="empty-state">
          <Megaphone size={40} />
          <p>{tr('noAnnouncements')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {announcements.map(ann => (
            <div key={ann.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
              {ann.priority === 'urgent' && <div className="gold-line-top" style={{ background: '#ef4444' }} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${ann.priority === 'urgent' ? 'badge-danger' : 'badge-gold'}`}>
                  {ann.priority === 'urgent' ? (isRtl ? 'عاجل' : 'Urgent') : (isRtl ? 'إعلان' : 'Notice')}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={12} /> {new Date(ann.createdAt || Date.now()).toLocaleDateString('en-GB')}
                </span>
              </div>

              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{ann.title}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{ann.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
