export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const SESSION_KEY = 'genzen.auth.session';

const getAuthUserIdFromSession = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as { auth_user_id?: unknown };
    return typeof session.auth_user_id === 'string' && session.auth_user_id.trim()
      ? session.auth_user_id.trim()
      : null;
  } catch {
    return null;
  }
};

const parseJsonSafe = async (response: Response): Promise<Record<string, unknown> | null> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const authUserId = getAuthUserIdFromSession();
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(authUserId ? { 'x-auth-user-id': authUserId } : {}),
      ...(init?.headers || {})
    },
    ...init
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : `Request failed with status ${response.status}`;
    throw new HttpError(response.status, message);
  }

  return (payload as T) ?? ({} as T);
};

export const apiClient = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { method: 'GET', ...init });
  },

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      ...init,
      body: body ? JSON.stringify(body) : undefined
    });
  },

  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      ...init,
      body: body ? JSON.stringify(body) : undefined
    });
  }
};
