/**
 * PortalFormBits.tsx — عناصر واجهة مشتركة تُستخدم في نماذج الطلب/الشحن/الدفع بالبوابة (DRY).
 * Shared presentational bits reused by the portal order/shipment/payment forms.
 */

import React from 'react';

export const sectionTitle: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 900, color: 'var(--gold)',
  display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.8rem',
};

export const miniLabel: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, marginBottom: '0.15rem',
};

/** خلية في الشريط العلوي (رقم/عملة/تاريخ/عميل). */
export function HeaderCell({ label: l, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="section-card" style={{ padding: '0.55rem 0.7rem', borderColor: 'var(--bg-border)' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
      <div className={mono ? 'mono' : undefined} style={{ fontSize: '0.78rem', fontWeight: 800, color: highlight ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

/** سطر مالي ضمن الكشف المالي. */
export function FinanceLine({ l, v, accent }: { l: string; v: string; accent?: 'gold' | 'green' }) {
  const color = accent === 'gold' ? 'var(--gold)' : accent === 'green' ? '#34d399' : 'var(--text-primary)';
  return (
    <div className="finance-line"><span>{l}</span><strong className="mono" style={{ color }}>{v}</strong></div>
  );
}

/** صف ملخّص (عنوان/قيمة) داخل الخلاصة. */
export function SummaryRow({ l, v, highlight }: { l: string; v: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--bg-border)', paddingBottom: '0.3rem', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{l}</span>
      <strong style={{ color: highlight ? 'var(--gold)' : 'var(--text-primary)' }}>{v}</strong>
    </div>
  );
}

/** شريط خطوات أفقي موسّط يُظهر الاتجاه والترتيب (يُقرأ من البداية إلى النهاية في اتجاه الواجهة). */
export function StepBar({ titles, current }: { titles: string[]; current: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
      padding: '0.85rem 1.4rem', flexWrap: 'wrap', borderBottom: '1px solid var(--bg-border)',
      background: 'var(--bg-card)',
    }}>
      {titles.map((t, idx) => {
        const n = idx + 1;
        const state = n < current ? 'done' : n === current ? 'current' : 'todo';
        const connectorDone = n < current;
        return (
          <React.Fragment key={t}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.3rem 0.7rem', borderRadius: 999,
              background: state === 'current' ? 'rgba(212,175,55,0.10)' : 'transparent',
              border: state === 'current' ? '1px solid var(--gold-border)' : '1px solid transparent',
            }}>
              <span style={{
                width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.74rem', fontWeight: 900,
                background: state === 'todo' ? 'var(--bg-input)' : 'var(--gold)',
                color: state === 'todo' ? 'var(--text-muted)' : '#000',
                border: `1.5px solid ${state === 'current' ? 'var(--gold)' : state === 'done' ? 'var(--gold)' : 'var(--bg-border)'}`,
                boxShadow: state === 'current' ? '0 0 0 4px rgba(212,175,55,0.18)' : 'none',
                transition: 'all 0.2s ease',
              }}>{state === 'done' ? '✓' : n}</span>
              <span style={{
                fontSize: '0.78rem', letterSpacing: '0.01em',
                fontWeight: state === 'current' ? 900 : 700,
                color: state === 'current' ? 'var(--gold)' : state === 'todo' ? 'var(--text-muted)' : 'var(--text-primary)',
              }}>{t}</span>
            </div>
            {n < titles.length && (
              <span style={{ flex: '0 1 44px', minWidth: 16, height: 2, borderRadius: 2, background: connectorDone ? 'var(--gold)' : 'var(--bg-border)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
