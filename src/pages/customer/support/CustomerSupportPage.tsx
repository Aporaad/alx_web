import React, { useState } from 'react';
import { MessageSquare, Briefcase } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import SupportTicketsPage from '../../shared/SupportTicketsPage';
import JobRequestSection from './JobRequestSection';

/**
 * الدعم والاقتراحات (بوابة العميل — §4.8): تبويب التذاكر القائم + تبويب طلب التوظيف (`job_req`).
 * Customer support: existing tickets tab + a job-application tab backed by the `jobs_req` table (D5).
 */
type Tab = 'tickets' | 'jobs';

export default function CustomerSupportPage() {
  const { isRtl } = usePortalTheme();
  const [tab, setTab] = useState<Tab>('tickets');
  const label = (ar: string, en: string) => (isRtl ? ar : en);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button className={`btn btn-sm${tab === 'tickets' ? ' btn-gold' : ' btn-ghost'}`} onClick={() => setTab('tickets')}>
          <MessageSquare size={14} /> {label('التذاكر', 'Tickets')}
        </button>
        <button className={`btn btn-sm${tab === 'jobs' ? ' btn-gold' : ' btn-ghost'}`} onClick={() => setTab('jobs')}>
          <Briefcase size={14} /> {label('طلب توظيف', 'Job Application')}
        </button>
      </div>
      {tab === 'tickets' ? <SupportTicketsPage /> : <JobRequestSection />}
    </div>
  );
}
