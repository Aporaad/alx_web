import type { MainEntryDto, AccountTransDto, FinancialAccountDto, LedgerEntry } from '../../../types/portalTypes';

/**
 * Maps raw PostgreSQL row from `main_entry` to MainEntryDto.
 */
export function mapMainEntryRowToDto(row: any): MainEntryDto {
  if (!row) return {} as MainEntryDto;

  return {
    mainEntryId: row.main_entry_id || row.id || '',
    entryNumber: row.entry_number || '',
    moduleId: row.module_id || '',
    entryTypeId: row.entry_type_id || '',
    entryCategory: row.entry_category || '',
    postingStatus: row.posting_status || 'draft',
    description: row.description || '',
    notes: row.notes || '',
    paymentMethod: row.payment_method || '',
    orderId: row.order_id || '',
    shipmentId: row.shipment_id || '',
    effectiveAt: row.effective_at || row.created_at || Date.now(),
    postedAt: row.posted_at,
    createdAt: row.created_at || Date.now(),
  };
}

/**
 * Maps raw PostgreSQL row from `account_trans` to AccountTransDto.
 */
export function mapAccountTransRowToDto(row: any): AccountTransDto {
  if (!row) return {} as AccountTransDto;

  return {
    accountTransId: row.account_trans_id || row.id || '',
    mainEntryId: row.main_entry_id || '',
    lineNo: Number(row.line_no || 1),
    transType: (row.trans_type === 'credit' ? 'credit' : 'debit'),
    accountId: row.account_id || '',
    amount: Number(row.amount || 0),
    amountOriginal: Number(row.amount_original || row.amount || 0),
    conversionRate: Number(row.conversion_rate || 1),
    entityType: row.entity_type || '',
    entityId: row.entity_id || '',
    paymentMethod: row.payment_method || '',
    orderId: row.order_id || '',
    shipmentId: row.shipment_id || '',
    description: row.description || row.note || '',
    createdAt: row.created_at || Date.now(),
  };
}

/**
 * Maps raw PostgreSQL row from `accounts` to FinancialAccountDto.
 */
export function mapFinancialAccountRowToDto(row: any): FinancialAccountDto {
  if (!row) return {} as FinancialAccountDto;

  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});

  return {
    accountId: row.account_id || row.id || payload.accountId || '',
    accountCode: row.account_code || row.code || payload.accountCode || '',
    accountNumber: row.account_number || payload.accountNumber || '',
    accountPrefix: row.account_prefix || payload.accountPrefix || '',
    parentCode: row.parent_code || payload.parentCode || '',
    entityId: row.entity_id || payload.entityId || '',
    entityType: row.entity_type || payload.entityType || 'customer',
    entityName: row.entity_name || payload.entityName || '',
    currency: row.currency || payload.currency || 'YER',
    type: row.type || payload.type || 'Asset',
    balance: Number(row.balance ?? payload.balance ?? 0),
    debitTotal: Number(row.debit_total ?? payload.debitTotal ?? 0),
    creditTotal: Number(row.credit_total ?? payload.creditTotal ?? 0),
    isActive: Boolean(row.is_active ?? payload.isActive ?? true),
    accNameAr: row.acc_name_ar || payload.nameAr || '',
    accNameEn: row.acc_name_en || payload.nameEn || '',
    createdAt: row.created_at || payload.createdAt || Date.now(),
    updatedAt: row.updated_at || payload.updatedAt || Date.now(),
  };
}

/**
 * Maps double-entry transaction (`account_trans` + `main_entry`) to LedgerEntry client compatibility view.
 */
export function mapTransToLedgerEntry(trans: any, runningBalance: number = 0): LedgerEntry {
  const transType = trans.trans_type || trans.transType || 'debit';
  const amount = Number(trans.amount || 0);

  return {
    id: trans.account_trans_id || trans.id || String(Math.random()),
    date: trans.created_at ? new Date(trans.created_at).getTime() : Date.now(),
    description: trans.description || trans.note || 'حركة مالية في الحساب',
    refNumber: trans.main_entry_id || trans.order_id || trans.shipment_id || '',
    amount,
    currency: trans.currency || 'YER',
    type: transType,
    runningBalance,
    notes: trans.note || trans.description,
  };
}
