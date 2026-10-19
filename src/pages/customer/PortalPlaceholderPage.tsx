import React from 'react';
import { usePortalTheme } from '../../context/PortalThemeContext';
import type { TKey } from '../../lib/translations';

/**
 * صفحة هيكلية (placeholder) للأقسام الجديدة في P2: التتبع/السلة/المالية/الهدايا/مكتبني.
 * Structural placeholder for the new P2 sections. Some (الهدايا/مكتبني) stay placeholders by plan;
 * others (التتبع/السلة/المالية) get replaced by real pages in P4/P5 without touching the router shell.
 */
interface PortalPlaceholderPageProps {
  titleKey: TKey;
  hintKey?: TKey;
}

export default function PortalPlaceholderPage({ titleKey, hintKey }: PortalPlaceholderPageProps) {
  const { tr } = usePortalTheme();
  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '0.75rem' }}>
      <h1 style={{ color: 'var(--gold)', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{tr(titleKey)}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 420, margin: 0 }}>
        {hintKey ? tr(hintKey) : tr('placeholderComingSoon')}
      </p>
    </section>
  );
}
