import { test, expect } from '@playwright/test';

test.describe('Users API (Playwright Suite)', () => {
  test('POST /users creates a user with valid data', async ({ request }) => {
    const timestamp = Date.now();
    const payload = {
      name: `Playwright Test User ${timestamp}`,
      email: `pw_user_${timestamp}@example.com`,
    };

    const res = await request.post('/users', { data: payload });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.statusCode).toBe(201);
    expect(json.data.name).toBe(payload.name);
    expect(json.data.email).toBe(payload.email);
  });

  test('POST /users rejects missing name with 400 Bad Request', async ({ request }) => {
    const res = await request.post('/users', {
      data: { email: `noname_${Date.now()}@example.com` },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('Name is required');
  });

  test('GET /users returns list of users', async ({ request }) => {
    const res = await request.get('/users');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('GET /users/:id returns 404 for non-existent ID', async ({ request }) => {
    const res = await request.get('/users/999999');
    expect(res.status()).toBe(404);
  });
});

