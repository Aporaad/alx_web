export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: Error };

export const asyncState = {
  loading<T>(): AsyncState<T> { return { status: 'loading' }; },
};

export async function runQuery<T>(
  load: () => Promise<T>,
  onState: (state: AsyncState<T>) => void,
  isEmpty: (data: T) => boolean,
): Promise<AsyncState<T>> {
  onState(asyncState.loading());
  try {
    const data = await load();
    const state: AsyncState<T> = isEmpty(data) ? { status: 'empty' } : { status: 'success', data };
    onState(state);
    return state;
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error('PORTAL_QUERY_FAILED');
    const state: AsyncState<T> = { status: 'error', error };
    onState(state);
    return state;
  }
}
