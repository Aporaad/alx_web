/**
 * @deprecated Legacy compatibility stubs. Use portalAuthGateway instead.
 */
export function extractRow(row: any): any {
  if (!row) return null;
  const payload = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
  return { id: row.id, ...payload };
}

export function extractRows(rows: any[]): any[] {
  return (rows || []).map(extractRow).filter(Boolean);
}

export async function getCollection(_table: string): Promise<any[]> {
  return [];
}

export async function getDocById(_table: string, _id: string): Promise<any | null> {
  return null;
}

export async function queryCollection(_table: string, _field: string, _value: any): Promise<any[]> {
  return [];
}

export async function queryByDataField(_table: string, _field: string, _value: any): Promise<any[]> {
  return [];
}

export async function insertDoc(_table: string, _id: string, _dataPayload: any): Promise<void> {}

export async function upsertDoc(_table: string, _id: string, _dataPayload: any): Promise<void> {}

export async function updateDocData(_table: string, _id: string, _dataUpdates: any): Promise<void> {}

export async function deleteDocById(_table: string, _id: string): Promise<void> {}

