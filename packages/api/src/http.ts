export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiConfig {
  baseUrl: string;
  token: string;
}

export async function apiFetch<T>(
  config: ApiConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}
