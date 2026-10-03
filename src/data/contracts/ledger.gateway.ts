import type { FinancialAccountDto, MainEntryDto, AccountTransDto, LedgerEntry } from '../../types/portalTypes';

export interface PortalLedgerGateway {
  getAccountByEntity(entityId: string, entityType: 'customer' | 'courier' | 'supplier'): Promise<FinancialAccountDto | null>;
  getAccountByCode(accountCode: string): Promise<FinancialAccountDto | null>;
  getAccountTransactions(accountId: string): Promise<AccountTransDto[]>;
  getMainEntriesForOrder(orderId: string): Promise<MainEntryDto[]>;
  getClientLedgerEntries(accountId: string): Promise<LedgerEntry[]>;
}
