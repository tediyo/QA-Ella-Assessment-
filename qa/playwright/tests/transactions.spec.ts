import { test, expect } from '@playwright/test';

test.describe('Transactions API (Playwright Suite)', () => {
  let userId: number;
  let productId: number;

  test.beforeAll(async ({ request }) => {
    const timestamp = Date.now();
    const userRes = await request.post('/users', {
      data: { name: 'Tx User', email: `tx_user_${timestamp}@example.com` },
    });
    const userJson = await userRes.json();
    userId = userJson.data.id;

    const productRes = await request.post('/products', {
      data: { name: `Tx Product ${timestamp}`, price: 15.0, quantity: 10 },
    });
    const productJson = await productRes.json();
    productId = productJson.data.id;
  });

  test('POST /transactions creates transaction when stock available', async ({ request }) => {
    const res = await request.post('/transactions', {
      data: { userId, productId, quantity: 2 },
    });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.data.quantity).toBe(2);
  });

  test('POST /transactions returns 409 Conflict when quantity exceeds stock', async ({ request }) => {
    const res = await request.post('/transactions', {
      data: { userId, productId, quantity: 9999 },
    });
    expect(res.status()).toBe(409);
    const json = await res.json();
    expect(json.message).toContain('exceeds available stock');
  });

  test('POST /transactions returns 404 for non-existent user', async ({ request }) => {
    const res = await request.post('/transactions', {
      data: { userId: 999999, productId, quantity: 1 },
    });
    expect(res.status()).toBe(404);
  });
});

