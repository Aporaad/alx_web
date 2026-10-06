import { supabase } from './legacy-portal';

export interface LegacyPortalAuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

export interface LegacyPortalAuthResult {
  user: LegacyPortalAuthUser | null;
  hasSession: boolean;
  error: Error | null;
}

/**
 * Temporary compatibility boundary for accounts created before Portal API credentials existed.
 * Keep all Supabase Auth SDK calls here; remove this adapter only after existing-account migration/reset.
 */
export const legacyPortalAuth = {
  async getSessionUser(): Promise<LegacyPortalAuthUser | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  },

  subscribe(callback: (event: string, user: LegacyPortalAuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  },

  async signInWithPassword(email: string, password: string): Promise<LegacyPortalAuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, hasSession: Boolean(data.session), error };
  },

  async signUp(input: {
    email: string;
    password: string;
    metadata: Record<string, unknown>;
  }): Promise<LegacyPortalAuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: input.metadata },
    });
    return { user: data.user, hasSession: Boolean(data.session), error };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<LegacyPortalAuthUser | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
};
