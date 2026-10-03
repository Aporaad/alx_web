import { supabase } from '../../../lib/supabase';
import type { PortalLedgerGateway } from '../../contracts/ledger.gateway';
import type { FinancialAccountDto, MainEntryDto, AccountTransDto, LedgerEntry } from '../../../types/portalTypes';
import {
  mapFinancialAccountRowToDto,
  mapMainEntryRowToDto,
  mapAccountTransRowToDto,
  mapTransToLedgerEntry
} from '../../dtos/mappers/ledger.mapper';

export class SupabaseLedgerGateway implements PortalLedgerGateway {
  async getAccountByEntity(entityId: string, entityType: 'customer' | 'courier' | 'supplier'): Promise<FinancialAccountDto | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();

      if (error || !data) {
        // Search in JSONB data column if top-level search failed
        const { data: jsonData } = await supabase
          .from('accounts')
          .select('*')
          .filter("data->>'entityId'", 'eq', entityId)
          .maybeSingle();

        if (jsonData) return mapFinancialAccountRowToDto(jsonData);
        return null;
      }

      return mapFinancialAccountRowToDto(data);
    } catch (_) {
      return null;
    }
  }

  async getAccountByCode(accountCode: string): Promise<FinancialAccountDto | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_code', accountCode)
        .maybeSingle();

      if (error || !data) return null;
      return mapFinancialAccountRowToDto(data);
    } catch (_) {
      return null;
    }
  }

  async getAccountTransactions(accountId: string): Promise<AccountTransDto[]> {
    try {
      const { data, error } = await supabase
        .from('account_trans')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapAccountTransRowToDto);
    } catch (_) {
      return [];
    }
  }

  async getMainEntriesForOrder(orderId: string): Promise<MainEntryDto[]> {
    try {
      const { data, error } = await supabase
        .from('main_entry')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapMainEntryRowToDto);
    } catch (_) {
      return [];
    }
  }

  async getClientLedgerEntries(accountId: string): Promise<LedgerEntry[]> {
    try {
      const transactions = await this.getAccountTransactions(accountId);
      let runningBalance = 0;

      // Sort ascending to calculate running balance
      const sorted = [...transactions].reverse();
      const mapped: LedgerEntry[] = [];

      for (const t of sorted) {
        const amt = t.amount || 0;
        if (t.transType === 'credit') {
          runningBalance += amt;
        } else {
          runningBalance -= amt;
        }

        mapped.push(mapTransToLedgerEntry(t, runningBalance));
      }

      // Return reverse (newest first)
      return mapped.reverse();
    } catch (_) {
      return [];
    }
  }
}

export const ledgerGateway = new SupabaseLedgerGateway();
