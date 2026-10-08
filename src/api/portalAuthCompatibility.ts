export interface PortalAuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

export interface PortalAuthResult {
  user: PortalAuthUser | null;
  hasSession: boolean;
  error: Error | null;
}

/**
 * Compatibility boundary for legacy auth interfaces.
 */
export const portalAuthCompatibility = {
  async getSessionUser(): Promise<PortalAuthUser | null> {
    return null;
  },

  subscribe(callback: (event: string, user: PortalAuthUser | null) => void): () => void {
    callback('INITIAL', null);
    return () => {};
  },

  async signInWithPassword(_email: string, _password: string): Promise<PortalAuthResult> {
    return { user: null, hasSession: false, error: null };
  },

  async signUp(_input: {
    email: string;
    password: string;
    metadata: Record<string, unknown>;
  }): Promise<PortalAuthResult> {
    return { user: null, hasSession: false, error: null };
  },

  async signOut(): Promise<void> {},

  async getCurrentUser(): Promise<PortalAuthUser | null> {
    return null;
  },

  async updatePassword(_password: string): Promise<void> {},
};


