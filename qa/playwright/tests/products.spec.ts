import { test, expect } from '@playwright/test';

test.describe('Products API (Playwright Suite)', () => {
  test('POST /products creates product successfully', async ({ request }) => {
    const timestamp = Date.now();
    const payload = {
      name: `Playwright Keyboard ${timestamp}`,
      price: 129.99,
      quantity: 20,
      status: 'FOR_SALE',
    };

    const res = await request.post('/products', { data: payload });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.data.name).toBe(payload.name);
    expect(json.data.quantity).toBe(payload.quantity);
  });

  test('POST /products rejects negative quantity with 400 Bad Request', async ({ request }) => {
    const res = await request.post('/products', {
      data: {
        name: `Invalid Quantity Product ${Date.now()}`,
        price: 25.0,
        quantity: -10,
      },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /products retrieves all products', async ({ request }) => {
    const res = await request.get('/products');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });
});

