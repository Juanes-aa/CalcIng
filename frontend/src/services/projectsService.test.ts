import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listProjects, createProject, updateProject, deleteProject,
  type Project,
} from './projectsService';

const FAKE_TOKEN = 'fake.jwt.token';

function mockFetch(response: { status: number; body: unknown }): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
    text: () => Promise.resolve(JSON.stringify(response.body)),
  }));
}

const SAMPLE_PROJECT: Project = {
  id: 'p1',
  name: 'Test Project',
  description: 'Desc',
  data: {},
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
};

describe('projectsService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('calcing_token', FAKE_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ─── listProjects ─────────────────────────────────────────────────────────

  describe('listProjects', () => {
    it('calls GET /projects with Bearer token', async () => {
      mockFetch({ status: 200, body: { items: [] } });
      await listProjects();
      const fetchFn = vi.mocked(fetch);
      expect(fetchFn).toHaveBeenCalledOnce();
      const [url, opts] = fetchFn.mock.calls[0]!;
      expect(String(url)).toContain('/projects');
      expect((opts as RequestInit).method).toBe('GET');
      expect((opts as RequestInit).headers).toHaveProperty('Authorization', `Bearer ${FAKE_TOKEN}`);
    });

    it('returns array of projects', async () => {
      mockFetch({ status: 200, body: { items: [SAMPLE_PROJECT] } });
      const result = await listProjects();
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Test Project');
    });

    it('returns empty array when no projects', async () => {
      mockFetch({ status: 200, body: { items: [] } });
      const result = await listProjects();
      expect(result).toEqual([]);
    });

    it('throws NO_TOKEN when no token', async () => {
      localStorage.removeItem('calcing_token');
      await expect(listProjects()).rejects.toThrow('NO_TOKEN');
    });

    it('throws UNAUTHORIZED on 401', async () => {
      mockFetch({ status: 401, body: {} });
      await expect(listProjects()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  // ─── createProject ─────────────────────────────────────────────────────────

  describe('createProject', () => {
    it('calls POST /projects with name and description', async () => {
      mockFetch({ status: 201, body: SAMPLE_PROJECT });
      await createProject('Test Project', 'Desc');
      const fetchFn = vi.mocked(fetch);
      const [url, opts] = fetchFn.mock.calls[0]!;
      expect(String(url)).toContain('/projects');
      expect((opts as RequestInit).method).toBe('POST');
      const sentBody = JSON.parse((opts as RequestInit).body as string) as Record<string, string>;
      expect(sentBody.name).toBe('Test Project');
      expect(sentBody.description).toBe('Desc');
    });

    it('returns created project', async () => {
      mockFetch({ status: 201, body: SAMPLE_PROJECT });
      const result = await createProject('Test Project', 'Desc');
      expect(result.id).toBe('p1');
      expect(result.name).toBe('Test Project');
    });

    it('throws on error status', async () => {
      mockFetch({ status: 422, body: { detail: 'Empty name' } });
      await expect(createProject('', '')).rejects.toThrow('HTTP_ERROR_422');
    });
  });

  // ─── updateProject ─────────────────────────────────────────────────────────

  describe('updateProject', () => {
    it('calls PATCH /projects/{id} with partial data', async () => {
      mockFetch({ status: 200, body: { ...SAMPLE_PROJECT, name: 'Updated' } });
      await updateProject('p1', { name: 'Updated' });
      const fetchFn = vi.mocked(fetch);
      const [url, opts] = fetchFn.mock.calls[0]!;
      expect(String(url)).toContain('/projects/p1');
      expect((opts as RequestInit).method).toBe('PATCH');
    });

    it('returns updated project', async () => {
      const updated = { ...SAMPLE_PROJECT, name: 'New Name' };
      mockFetch({ status: 200, body: updated });
      const result = await updateProject('p1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('throws on 404', async () => {
      mockFetch({ status: 404, body: { detail: 'Not found' } });
      await expect(updateProject('bad-id', { name: 'X' })).rejects.toThrow('HTTP_ERROR_404');
    });
  });

  // ─── deleteProject ─────────────────────────────────────────────────────────

  describe('deleteProject', () => {
    it('calls DELETE /projects/{id}', async () => {
      mockFetch({ status: 204, body: null });
      await deleteProject('p1');
      const fetchFn = vi.mocked(fetch);
      const [url, opts] = fetchFn.mock.calls[0]!;
      expect(String(url)).toContain('/projects/p1');
      expect((opts as RequestInit).method).toBe('DELETE');
    });

    it('resolves on 204', async () => {
      mockFetch({ status: 204, body: null });
      await expect(deleteProject('p1')).resolves.toBeUndefined();
    });

    it('throws on 404', async () => {
      mockFetch({ status: 404, body: { detail: 'Not found' } });
      await expect(deleteProject('bad-id')).rejects.toThrow('HTTP_ERROR_404');
    });
  });
});
