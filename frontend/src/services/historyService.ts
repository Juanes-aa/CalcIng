/**
 * historyService.ts
 * Servicio frontend para sincronizar historial con el backend.
 * Llama a GET /users/me/history con JWT.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoryItemRemote {
  id:         string;
  expression: string;
  result:     string;
  type:       string;
  created_at: string;
}

export interface HistoryPage {
  items:      HistoryItemRemote[];
  next_cursor: string | null;
}

export interface HistoryPageResult {
  items:      HistoryItemRemote[];
  nextCursor: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

export async function fetchHistory(
  cursor?: string,
  limit: number = 20,
): Promise<HistoryPageResult> {
  const token = localStorage.getItem('calcing_token');
  if (!token) {
    throw new Error('NO_TOKEN');
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`${BASE_URL}/users/me/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED');
    throw new Error(`HTTP_ERROR_${response.status}`);
  }

  const data: HistoryPage = await response.json();
  return {
    items: data.items,
    nextCursor: data.next_cursor,
  };
}
