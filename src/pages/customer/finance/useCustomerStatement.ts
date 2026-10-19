import { useCallback, useState } from 'react';
import { portalAuthGateway } from '../../../api/portalAuthGateway';
import type { PortalCustomerStatementDto, PortalStatementQuery } from '../../../api/portalAuthGateway';

/**
 * منطق جلب كشف الحساب المخصص (D3) — معزول عن الواجهة. القيد بالملكية على الخادم؛ المتصفح لا يحسب أي رصيد.
 * Custom statement data logic (D3), kept out of the UI. Ownership-scoped server-side; the browser never computes balances.
 */
export function useCustomerStatement() {
  const [statement, setStatement] = useState<PortalCustomerStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (query: PortalStatementQuery) => {
    setError('');
    if (!portalAuthGateway) {
      setStatement(null);
      return;
    }
    setLoading(true);
    try {
      setStatement(await portalAuthGateway.getCustomerStatement(query));
    } catch (err) {
      setError('PORTAL_STATEMENT_FAILED');
      console.error('[useCustomerStatement]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setStatement(null); setError(''); }, []);

  return { statement, loading, error, load, reset };
}
