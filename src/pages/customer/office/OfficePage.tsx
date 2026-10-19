/**
 * OfficePage.tsx — قسم «مكتبتي» (هيكل أولي فقط — الخطة §3/§4، يكتمل لاحقًا).
 * "My Office" section — preliminary skeleton (tabs only) for a later full build.
 * التبويبات: الأمنيات السرية • العناصر المفضلة. لا بيانات بعد؛ واجهة فارغة مؤهولة.
 * Tabs: Secret Wishes • Favourite Items. Intentionally empty until implemented.
 */
import React, { useState } from 'react';
import { Wand2, Star } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';

type OfficeTab = 'wishes' | 'favourites';

export default function OfficePage() {
  const { isRtl } = usePortalTheme();
  const [tab, setTab] = useState<OfficeTab>('wishes');
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const tabs: Array<{ id: OfficeTab; label: string; icon: React.ReactNode }> = [
    { id: 'wishes', label: label('الأمنيات السرية', 'Secret Wishes'), icon: <Wand2 size={15} /> },
    { id: 'favourites', label: label('العناصر المفضلة', 'Favourite Items'), icon: <Star size={15} /> },
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
          {tab === 'wishes' ? label('الأمنيات السرية', 'Secret Wishes') : label('العناصر المفضلة', 'Favourite Items')}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
          {label('قسم قيد الإنشاء — الهيكل الأساسي جاهز وستُضاف المزايا لاحقًا.',
            'Under construction — the scaffold is ready; features will be added later.')}
        </p>
      </div>
    </div>
  );
}
