import { AuthAccount, AuthSession } from '../types';
import { apiClient } from './apiClient';
import { storage } from './storage';

const ACCOUNTS_KEY = 'genzen.auth.accounts';
const SESSION_KEY = 'genzen.auth.session';

const nowIso = (): string => new Date().toISOString();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return window.btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const generateSalt = (): string => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
};

const deriveHash = async (password: string, salt: string): Promise<string> => {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBuffer = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: 120000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bytesToBase64(new Uint8Array(hashBuffer));
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const deriveStableAuthUserId = async (email: string): Promise<string> => {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeEmail(email)));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `auth_${hex.slice(0, 24)}`;
};

const getAccounts = (): AuthAccount[] => storage.get<AuthAccount[]>(ACCOUNTS_KEY, []);

const saveAccounts = (accounts: AuthAccount[]): void => {
  storage.set<AuthAccount[]>(ACCOUNTS_KEY, accounts);
};

const resolvePrototypeSession = async (session: AuthSession): Promise<AuthSession> => {
  try {
    const resolved = await apiClient.post<{ auth_user_id: string; email: string; signed_in_at: string }>(
      '/api/auth/prototype-session',
      {
        email: session.email,
        auth_user_id: session.auth_user_id
      }
    );

    return {
      auth_user_id: resolved.auth_user_id,
      email: resolved.email,
      signed_in_at: resolved.signed_in_at || nowIso()
    };
  } catch {
    return session;
  }
};

export const authService = {
  getSession(): AuthSession | null {
    return storage.get<AuthSession | null>(SESSION_KEY, null);
  },

  logout(): void {
    storage.remove(SESSION_KEY);
  },

  async signUp(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = normalizeEmail(email);
    const accounts = getAccounts();

    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const password_salt = generateSalt();
    const password_hash = await deriveHash(password, password_salt);
    const auth_user_id = await deriveStableAuthUserId(normalizedEmail);

    const account: AuthAccount = {
      auth_user_id,
      email: normalizedEmail,
      password_hash,
      password_salt,
      created_at: nowIso(),
      last_login_at: nowIso()
    };

    saveAccounts([...accounts, account]);

    const session: AuthSession = {
      auth_user_id: account.auth_user_id,
      email: account.email,
      signed_in_at: nowIso()
    };

    const resolvedSession = await resolvePrototypeSession(session);
    storage.set<AuthSession>(SESSION_KEY, resolvedSession);
    return resolvedSession;
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = normalizeEmail(email);
    const accounts = getAccounts();
    const account = accounts.find((item) => item.email === normalizedEmail);

    if (!account) {
      throw new Error('No account found for this email.');
    }

    const candidateHash = await deriveHash(password, account.password_salt);
    if (candidateHash !== account.password_hash) {
      throw new Error('Incorrect password.');
    }

    const updatedAccounts = accounts.map((item) => (
      item.auth_user_id === account.auth_user_id
        ? { ...item, last_login_at: nowIso() }
        : item
    ));
    saveAccounts(updatedAccounts);

    const session: AuthSession = {
      auth_user_id: account.auth_user_id,
      email: account.email,
      signed_in_at: nowIso()
    };

    const resolvedSession = await resolvePrototypeSession(session);
    storage.set<AuthSession>(SESSION_KEY, resolvedSession);
    return resolvedSession;
  }
};
