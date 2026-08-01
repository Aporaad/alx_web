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

// ─── Helpers for Supabase { id: text, data: json } Schema ────────────────────

/**
 * Extract normalized object from PostgreSQL row containing { id, data }.
 */
export function extractRow(row: any): any {
  if (!row) return null;
  const payload = typeof row.data === 'string'
    ? JSON.parse(row.data)
    : (row.data || {});
  return { id: row.id, ...payload };
}

/**
 * Extract normalized objects from array of rows.
 */
export function extractRows(rows: any[]): any[] {
  return (rows || []).map(extractRow).filter(Boolean);
}

/**
 * Fetch all rows from a table and extract payload from `data` JSON column.
 */
export async function getCollection(table: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`[Supabase Helper] getCollection error on ${table}: ${error.message}`);
      return [];
    }
    return extractRows(data || []);
  } catch (err: any) {
    console.error(`[Supabase Helper] getCollection exception on ${table}: ${err.message}`);
    return [];
  }
}

/**
 * Fetch a single document by ID from table with JSON extraction.
 */
export async function getDocById(table: string, id: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return extractRow(data);
  } catch (_) {
    return null;
  }
}

/**
 * Query documents from a table where a property in `data` matches a value.
 * Uses in-memory filter (full-table scan). Use queryByDataField for large tables.
 */
export async function queryCollection(table: string, field: string, value: any): Promise<any[]> {
  const all = await getCollection(table);
  return all.filter((item: any) => item[field] === value);
}

/**
 * Efficient server-side query on a JSONB `data` column field using Supabase PostgREST.
 * Requires an index like: CREATE INDEX ON table ((data->>'field'));
 * Falls back to in-memory filter if the query fails.
 */
export async function queryByDataField(table: string, field: string, value: any): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .filter(`data->>'${field}'`, 'eq', String(value));

    if (error) {
      console.warn(`[queryByDataField] Server filter failed on ${table}.${field}, falling back to in-memory:`, error.message);
      return await queryCollection(table, field, value);
    }
    return extractRows(data || []);
  } catch (err: any) {
    console.warn(`[queryByDataField] Exception on ${table}.${field}:`, err.message);
    return await queryCollection(table, field, value);
  }
}

/**
 * Insert a document using the system's { id, data } JSON schema.
 */
export async function insertDoc(table: string, id: string, dataPayload: any): Promise<void> {
  try {
    const { error } = await supabase.from(table).insert({ id, data: dataPayload });
    if (error) {
      console.warn(`[Supabase Helper] insertDoc warning on ${table}: ${error.message}. Attempting upsert...`);
      const { error: upsertErr } = await supabase.from(table).upsert({ id, data: dataPayload });
      if (upsertErr) throw new Error(upsertErr.message);
    }
  } catch (err: any) {
    console.error(`[Supabase Helper] insertDoc error on ${table}:`, err.message);
    throw err;
  }
}

/**
 * Upsert a document using the system's { id, data } JSON schema.
 */
export async function upsertDoc(table: string, id: string, dataPayload: any): Promise<void> {
  try {
    const { error } = await supabase.from(table).upsert({ id, data: dataPayload });
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
 * Update a document's JSON `data` column by merging updates.
 */
export async function updateDocData(table: string, id: string, dataUpdates: any): Promise<void> {
  try {
    const existing = await getDocById(table, id);
    const { id: _, ...existingData } = existing || {};
    const merged = { ...existingData, ...dataUpdates };

    const { error } = await supabase.from(table).update({ data: merged }).eq('id', id);
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
 * Delete a document by ID.
 */
export async function deleteDocById(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`[Supabase Helper] deleteDocById error on ${table}: ${error.message}`);
    throw new Error(error.message);
  }
}
