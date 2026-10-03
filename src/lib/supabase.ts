import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Portal] Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'alx_portal_session',
  },
});

// ─── Helpers for Supabase Schema & Entity Primary Keys ────────────────────────

/**
 * Returns the primary key column name for a given PostgreSQL table in the system.
 */
export function getPrimaryKeyColumn(table: string): string {
  switch (table) {
    case 'orders':
      return 'order_id';
    case 'shipments':
      return 'shipment_id';
    case 'portal_users':
      return 'portal_user_id';
    case 'customers':
      return 'customer_id';
    case 'couriers':
      return 'courier_id';
    case 'sources':
      return 'source_id';
    case 'accounts':
      return 'account_id';
    case 'cust_details':
      return 'cust_detail_id';
    case 'main_entry':
      return 'main_entry_id';
    case 'account_trans':
      return 'account_trans_id';
    case 'order_items':
      return 'order_item_id';
    default:
      return 'id';
  }
}

/**
 * Extract normalized object from PostgreSQL row containing relational columns & { id, data }.
 */
export function extractRow(row: any, table?: string): any {
  if (!row) return null;
  const pkCol = table ? getPrimaryKeyColumn(table) : 'id';
  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});

  const primaryId = row[pkCol] || row.id || row.uid || payload.id || payload.uid;
  return {
    id: primaryId,
    [pkCol]: primaryId,
    ...row,
    ...payload,
  };
}

/**
 * Extract normalized objects from array of rows.
 */
export function extractRows(rows: any[], table?: string): any[] {
  return (rows || []).map(r => extractRow(r, table)).filter(Boolean);
}

/**
 * Fetch all rows from a table and extract payload.
 */
export async function getCollection(table: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`[Supabase Helper] getCollection error on ${table}: ${error.message}`);
      return [];
    }
    return extractRows(data || [], table);
  } catch (err: any) {
    console.error(`[Supabase Helper] getCollection exception on ${table}: ${err.message}`);
    return [];
  }
}

/**
 * Fetch a single document by ID from table.
 */
export async function getDocById(table: string, id: string): Promise<any | null> {
  try {
    const pkCol = getPrimaryKeyColumn(table);
    // Query by specific primary key column for table
    let { data, error } = await supabase.from(table).select('*').eq(pkCol, id).maybeSingle();
    if (error || !data) return null;
    return extractRow(data, table);
  } catch (_) {
    return null;
  }
}

/**
 * Query documents from a table where a property matches a value.
 */
export async function queryCollection(table: string, field: string, value: any): Promise<any[]> {
  const all = await getCollection(table);
  return all.filter((item: any) => item[field] === value);
}

/**
 * Server-side query on top-level column or JSONB field.
 */
export async function queryByDataField(table: string, field: string, value: any): Promise<any[]> {
  try {
    // Try top-level column match first
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(field, value);

    if (!error && data && data.length > 0) {
      return extractRows(data, table);
    }

    // Fallback to jsonb query
    const { data: jsonData, error: jsonErr } = await supabase
      .from(table)
      .select('*')
      .filter(`data->>'${field}'`, 'eq', String(value));

    if (jsonErr) {
      return await queryCollection(table, field, value);
    }
    return extractRows(jsonData || [], table);
  } catch (err: any) {
    console.warn(`[queryByDataField] Exception on ${table}.${field}:`, err.message);
    return await queryCollection(table, field, value);
  }
}

/**
 * Known valid top-level PostgreSQL column schema for tables in Supabase DB.
 * Any property in dataPayload that does not match a valid top-level column for the table
 * is safely kept inside the `data` (jsonb) column ONLY, preventing Supabase "Could not find column in schema cache" errors.
 */
const TABLE_COLUMNS: Record<string, string[]> = {
  customers: [
    'customer_id', 'account_id', 'full_name', 'name_ar', 'name_en',
    'customer_level', 'created_at', 'updated_at', 'join_by', 'referrer_id', 'data'
  ],
  couriers: [
    'courier_id', 'account_id', 'full_name', 'name_ar', 'name_en',
    'created_at', 'updated_at', 'data'
  ],
  sources: [
    'source_id', 'name', 'account_id', 'created_at', 'updated_at', 'data'
  ],
  accounts: [
    'account_id', 'account_code', 'account_number', 'account_prefix',
    'parent_code', 'type', 'balance', 'debit_total', 'credit_total',
    'created_at', 'updated_at', 'data'
  ],
  portal_users: [
    'portal_user_id', 'username', 'email', 'full_name', 'name_ar', 'name_en',
    'portal_role', 'approval_status', 'account_id', 'linked_customer_id',
    'join_by', 'referrer_id', 'password', 'disabled', 'created_at', 'updated_at', 'data'
  ],
  cust_details: [
    'cust_detail_id', 'user_uid', 'customer_id', 'join_by', 'referrer_id',
    'onboarding_completed', 'created_at', 'updated_at', 'data'
  ],
  orders: [
    'order_id', 'order_number', 'tracking_number', 'customer_id',
    'order_status1', 'order_status_id', 'order_source_id',
    'delivery_courier_id', 'shipping_courier_id', 'created_by',
    'created_by_name', 'created_at', 'updated_at', 'data'
  ],
  shipments: [
    'shipment_id', 'order_id', 'tracking_number', 'courier_id',
    'shipment_status', 'created_at', 'updated_at', 'data'
  ],
  order_items: [
    'order_item_id', 'order_id', 'product_id', 'product_price',
    'quantity', 'total_price', 'created_at', 'updated_at', 'data'
  ],
  main_entry: [
    'main_entry_id', 'entry_number', 'posting_status', 'order_id',
    'shipment_id', 'created_at', 'updated_at', 'data'
  ],
  account_trans: [
    'account_trans_id', 'main_entry_id', 'account_id', 'trans_type',
    'amount', 'order_id', 'shipment_id', 'created_at', 'updated_at', 'data'
  ],
};

export function buildCleanDbRow(table: string, id: string, dataPayload: any): Record<string, any> {
  const pkCol = getPrimaryKeyColumn(table);
  const nowIso = new Date().toISOString();
  const payload = dataPayload || {};

  // Base map containing primary key and full JSON payload
  const baseMap: Record<string, any> = {
    [pkCol]: id,
    data: { id, ...payload },
  };

  // Map known camelCase fields to top-level PostgreSQL snake_case columns
  if (payload.fullName || payload.full_name) baseMap.full_name = payload.fullName || payload.full_name;
  if (payload.name) baseMap.name = payload.name;
  if (payload.username) baseMap.username = payload.username;
  if (payload.email) baseMap.email = payload.email;
  if (payload.phone) baseMap.phone = payload.phone;
  if (payload.address) baseMap.address = payload.address;
  if (payload.password) baseMap.password = payload.password;
  if (payload.portalRole || payload.portal_role) baseMap.portal_role = payload.portalRole || payload.portal_role;
  if (payload.approvalStatus || payload.approval_status) baseMap.approval_status = payload.approvalStatus || payload.approval_status;
  if (payload.disabled !== undefined || payload.isDisabled !== undefined) baseMap.disabled = Boolean(payload.disabled ?? payload.isDisabled);

  if (payload.financialAccountId || payload.account_id || payload.accountId) {
    baseMap.account_id = payload.financialAccountId || payload.account_id || payload.accountId;
  }
  if (payload.linkedCustomerId || payload.linked_customer_id || payload.linkedAccId) {
    baseMap.linked_customer_id = payload.linkedCustomerId || payload.linked_customer_id || payload.linkedAccId;
  }
  if (payload.joinBy || payload.join_by) baseMap.join_by = payload.joinBy || payload.join_by;
  if (payload.referrerId || payload.referrer_id) baseMap.referrer_id = payload.referrerId || payload.referrer_id;
  if (payload.userUid || payload.user_uid || payload.portalUid) baseMap.user_uid = payload.userUid || payload.user_uid || payload.portalUid;
  if (payload.customerId || payload.customer_id) baseMap.customer_id = payload.customerId || payload.customer_id;
  if (payload.courierId || payload.courier_id) baseMap.courier_id = payload.courierId || payload.courier_id;
  if (payload.sourceId || payload.source_id) baseMap.source_id = payload.sourceId || payload.source_id;
  if (payload.onboardingCompleted !== undefined || payload.onboarding_completed !== undefined) {
    baseMap.onboarding_completed = Boolean(payload.onboardingCompleted ?? payload.onboarding_completed);
  }

  if (payload.accountCode || payload.account_code) baseMap.account_code = payload.accountCode || payload.account_code;
  if (payload.accountNumber || payload.account_number) baseMap.account_number = payload.accountNumber || payload.account_number;
  if (payload.accountPrefix || payload.account_prefix) baseMap.account_prefix = payload.accountPrefix || payload.account_prefix;
  if (payload.parentCode || payload.parent_code) baseMap.parent_code = payload.parentCode || payload.parent_code;
  if (payload.type) baseMap.type = payload.type;
  if (payload.balance !== undefined) baseMap.balance = Number(payload.balance || 0);
  if (payload.debitTotal !== undefined || payload.debit_total !== undefined) baseMap.debit_total = Number(payload.debitTotal ?? payload.debit_total ?? 0);
  if (payload.creditTotal !== undefined || payload.credit_total !== undefined) baseMap.credit_total = Number(payload.creditTotal ?? payload.credit_total ?? 0);

  // Timestamps
  const rawCreatedAt = payload.createdAt || payload.created_at;
  baseMap.created_at = typeof rawCreatedAt === 'string' ? rawCreatedAt : rawCreatedAt ? new Date(rawCreatedAt).toISOString() : nowIso;

  const rawUpdatedAt = payload.updatedAt || payload.updated_at;
  baseMap.updated_at = typeof rawUpdatedAt === 'string' ? rawUpdatedAt : rawUpdatedAt ? new Date(rawUpdatedAt).toISOString() : nowIso;

  // Add any direct snake_case properties passed in payload
  Object.keys(payload).forEach(key => {
    if (key.includes('_') && !baseMap[key]) {
      baseMap[key] = payload[key];
    }
  });

  // Filter keys against valid table schema columns to prevent "Could not find column in schema cache"
  const allowedColumns = TABLE_COLUMNS[table];
  if (allowedColumns && allowedColumns.length > 0) {
    const cleanRow: Record<string, any> = {};
    for (const col of allowedColumns) {
      if (baseMap[col] !== undefined) {
        cleanRow[col] = baseMap[col];
      }
    }
    return cleanRow;
  }

  // Fallback for custom/unknown tables: allow pkCol, id, data, and snake_case keys
  const cleanRow: Record<string, any> = {};
  Object.keys(baseMap).forEach(key => {
    if (key === pkCol || key === 'id' || key === 'data' || key.includes('_')) {
      cleanRow[key] = baseMap[key];
    }
  });
  return cleanRow;
}

/**
 * Insert a document using relational schema & { id, data } JSON fallback.
 */
export async function insertDoc(table: string, id: string, dataPayload: any): Promise<void> {
  try {
    const row = buildCleanDbRow(table, id, dataPayload);
    const { error } = await supabase.from(table).insert(row);
    if (error) {
      console.warn(`[Supabase Helper] insertDoc warning on ${table}: ${error.message}. Attempting upsert...`);
      const { error: upsertErr } = await supabase.from(table).upsert(row);
      if (upsertErr) throw new Error(upsertErr.message);
    }
  } catch (err: any) {
    console.error(`[Supabase Helper] insertDoc error on ${table}:`, err.message);
    throw err;
  }
}

/**
 * Upsert a document using relational schema & { id, data } JSON fallback.
 */
export async function upsertDoc(table: string, id: string, dataPayload: any): Promise<void> {
  try {
    const row = buildCleanDbRow(table, id, dataPayload);
    const { error } = await supabase.from(table).upsert(row);
    if (error) {
      console.error(`[Supabase Helper] upsertDoc error on ${table}: ${error.message}`);
      throw new Error(error.message);
    }
  } catch (err: any) {
    console.error(`[Supabase Helper] upsertDoc exception on ${table}:`, err.message);
    throw err;
  }
}

/**
 * Update a document by primary key.
 */
export async function updateDocData(table: string, id: string, dataUpdates: any): Promise<void> {
  try {
    const pkCol = getPrimaryKeyColumn(table);
    const existing = await getDocById(table, id);
    const merged = { ...(existing || {}), ...dataUpdates };
    const row = buildCleanDbRow(table, id, merged);

    const { error } = await supabase.from(table).update(row).eq(pkCol, id);
    if (error) {
      console.warn(`[Supabase Helper] updateDocData update error on ${table}: ${error.message}, trying upsert...`);
      await upsertDoc(table, id, merged);
    }
  } catch (err: any) {
    console.error(`[Supabase Helper] updateDocData exception on ${table}:`, err.message);
    throw err;
  }
}

/**
 * Delete a document by primary key.
 */
export async function deleteDocById(table: string, id: string): Promise<void> {
  const pkCol = getPrimaryKeyColumn(table);
  const { error } = await supabase.from(table).delete().eq(pkCol, id);
  if (error) {
    console.error(`[Supabase Helper] deleteDocById error on ${table}: ${error.message}`);
    throw new Error(error.message);
  }
}
