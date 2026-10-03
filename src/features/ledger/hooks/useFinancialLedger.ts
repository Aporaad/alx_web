import { useState, useEffect, useCallback } from 'react';
import { ledgerGateway } from '../../../data/gateways/supabase/supabase-ledger.gateway';
import type { FinancialAccountDto, LedgerEntry } from '../../../types/portalTypes';

export function useFinancialLedger(entityId?: string, entityType: 'customer' | 'courier' | 'supplier' = 'customer') {
  const [account, setAccount] = useState<FinancialAccountDto | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const acc = await ledgerGateway.getAccountByEntity(entityId, entityType);
      setAccount(acc);

      if (acc && acc.accountId) {
        const ledgerData = await ledgerGateway.getClientLedgerEntries(acc.accountId);
        setEntries(ledgerData);
      } else {
        setEntries([]);
      }
    } catch (err: any) {
      console.error('[useFinancialLedger] fetch error:', err);
      setError(err.message || 'فشل جلب الحساب المالي');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return {
    account,
    entries,
    loading,
    error,
    refreshLedger: fetchLedger,
  };
}
