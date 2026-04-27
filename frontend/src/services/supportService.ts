/**
 * supportService.ts
 * Servicio frontend para enviar tickets de soporte al backend.
 */

export interface TicketPayload {
  full_name:   string;
  eng_id:      string;
  category:    string;
  description: string;
  critical:    boolean;
}

export interface TicketResponse {
  id:          string;
  full_name:   string;
  eng_id:      string;
  category:    string;
  description: string;
  critical:    boolean;
  status:      string;
  created_at:  string;
}

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

export async function submitTicket(payload: TicketPayload): Promise<TicketResponse> {
  const token = localStorage.getItem('calcing_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/support`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP_ERROR_${response.status}`);
  }

  return response.json() as Promise<TicketResponse>;
}
