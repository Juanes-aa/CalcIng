/**
 * projectsService.ts
 * Servicio frontend para CRUD de proyectos contra el backend.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  id:          string;
  name:        string;
  description: string;
  data:        Record<string, unknown>;
  created_at:  string;
  updated_at:  string;
}

interface ProjectListResponse {
  items: Project[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

function getToken(): string {
  const token = localStorage.getItem('calcing_token');
  if (!token) throw new Error('NO_TOKEN');
  return token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED');
    throw new Error(`HTTP_ERROR_${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/projects`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  const data = await handleResponse<ProjectListResponse>(response);
  return data.items;
}

export async function createProject(
  name: string,
  description: string = '',
): Promise<Project> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, description }),
  });
  return handleResponse<Project>(response);
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, 'name' | 'description' | 'data'>>,
): Promise<Project> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse<Project>(response);
}

export async function deleteProject(id: string): Promise<void> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED');
    throw new Error(`HTTP_ERROR_${response.status}`);
  }
}
