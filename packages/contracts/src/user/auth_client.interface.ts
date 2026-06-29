/**
 * AuthClient — 인증 추상화 (ADR-0002)
 *
 * 현재 구현: Supabase Auth (M2-S2)
 * 교체 가능 (Phase 4): Auth0 / Cognito / 자체 OAuth (post-MVP enterprise 진입 시)
 */

export interface User {
  id: string;
  email?: string;
  emailHash?: string;
  authProvider: "apple" | "google" | "email_magic_link";
  createdAt: Date;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthClient {
  signInWithApple(idToken: string, nonce?: string): Promise<Session>;
  signInWithGoogle(idToken: string): Promise<Session>;
  sendMagicLink(email: string): Promise<void>;
  verifyMagicLink(token: string): Promise<Session>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  refreshSession(): Promise<Session>;
}
