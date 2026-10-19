/**
 * FriendsPage.tsx — قسم «الأصدقاء» (هيكل أولي فقط — يكتمل لاحقًا).
 * "Friends" portal section — preliminary skeleton for a later full build (referral program,
 * invited friends list, and rewards). Tabs render an informed empty state until wired to APIs.
 * التبويبات: أصدقائي • برنامج الإحالة • الأرباح. لا بيانات بعد؛ واجهة فارغة مؤهولة.
 */
import React, { useState } from 'react';
import { Users, Share2, Coins } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';

type FriendsTab = 'friends' | 'referral' | 'rewards';

export default function FriendsPage() {
  const { isRtl } = usePortalTheme();
  const [tab, setTab] = useState<FriendsTab>('friends');
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const tabs: Array<{ id: FriendsTab; label: string; icon: React.ReactNode }> = [
    { id: 'friends', label: label('أصدقائي', 'My Friends'), icon: <Users size={15} /> },
    { id: 'referral', label: label('برنامج الإحالة', 'Referral Program'), icon: <Share2 size={15} /> },
    { id: 'rewards', label: label('الأرباح', 'Rewards'), icon: <Coins size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="glass-card" style={{ padding: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} type="button" className={`btn btn-sm ${tab === t.id ? 'btn-gold' : 'btn-ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setTab(t.id)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="section-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.4rem' }}>
          {tabs.find(t => t.id === tab)?.label}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
          {label('قسم قيد الإنشاء — الهيكل الأساسي جاهز وستُضاف المزايا وربط البيانات لاحقًا.',
            'Under construction — the scaffold is ready; features and data wiring will be added later.')}
        </p>
      </div>
    </div>
  );
}
