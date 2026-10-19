/**
 * GiftsPage.tsx — قسم «الهدايا والمسابقات» (هيكل أولي فقط — الخطة §3/§4، يكتمل لاحقًا).
 * Gifts & Competitions section — preliminary skeleton (tabs only) for a later full build.
 * التبويبات: الهدايا • المسابقات. لا بيانات/ندبوع بعد؛ تُعرض واجهة فارغة مؤهولة.
 * Tabs: Gifts • Competitions. Intentionally empty until the feature is implemented.
 */
import React, { useState } from 'react';
import { Gift, Trophy } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';

type GiftsTab = 'gifts' | 'competitions';

export default function GiftsPage() {
  const { isRtl } = usePortalTheme();
  const [tab, setTab] = useState<GiftsTab>('gifts');
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  const tabs: Array<{ id: GiftsTab; label: string; icon: React.ReactNode }> = [
    { id: 'gifts', label: label('الهدايا', 'Gifts'), icon: <Gift size={15} /> },
    { id: 'competitions', label: label('المسابقات', 'Competitions'), icon: <Trophy size={15} /> },
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
          {tab === 'gifts' ? label('الهدايا', 'Gifts') : label('المسابقات', 'Competitions')}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
          {label('قسم قيد الإنشاء — الهيكل الأساسي جاهز وستُضاف المزايا لاحقًا.',
            'Under construction — the scaffold is ready; features will be added later.')}
        </p>
      </div>
    </div>
  );
}
