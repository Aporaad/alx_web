import { useCallback, useEffect, useState } from 'react';
import { portalAuthGateway } from '../../../api/portalAuthGateway';
import type {
  PortalCustomerBalanceDto,
  PortalCustomerFinanceStatsDto,
  PortalPaymentRequestDto,
  PortalLedgerEntryDto,
} from '../../../api/portalAuthGateway';

/**
 * حالة مالية للعميل — منطق جلب البيانات معزول عن الواجهة (business logic apart from UI).
 * Customer finance data hook. All reads are ownership-scoped server-side; the browser never computes totals.
 */
export function useCustomerFinance() {
  const [balance, setBalance] = useState<PortalCustomerBalanceDto | null>(null);
  const [stats, setStats] = useState<PortalCustomerFinanceStatsDto | null>(null);
  const [requests, setRequests] = useState<PortalPaymentRequestDto[]>([]);
  const [ledger, setLedger] = useState<PortalLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setError('');
    if (!portalAuthGateway) {
      setBalance(null); setStats(null); setRequests([]); setLedger([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.allSettled([
      portalAuthGateway.getCustomerBalance(),
      portalAuthGateway.getCustomerFinanceStats(),
      portalAuthGateway.listPaymentRequests(),
      portalAuthGateway.listCustomerLedger(),
    ]);
    const [b, s, r, l] = results;
    if (b.status === 'fulfilled') setBalance(b.value);
    if (s.status === 'fulfilled') setStats(s.value);
    if (r.status === 'fulfilled') setRequests(r.value);
    if (l.status === 'fulfilled') setLedger(l.value);
    const failed = results.find(x => x.status === 'rejected');
    if (failed) setError('PORTAL_FINANCE_PARTIAL_FAILURE');
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { balance, stats, requests, ledger, loading, error, reload };
}
