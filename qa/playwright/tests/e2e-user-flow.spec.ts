import { test, expect } from '@playwright/test';

test.describe('E2E Critical Flow (Playwright API Testing)', () => {
  test('User Registration -> Product Selection -> Order Creation -> Stock Verification', async ({
    request,
  }) => {
    const timestamp = Date.now();

    // 1. Create a new user
    const userPayload = {
      name: `Playwright Customer ${timestamp}`,
      email: `pw_user_${timestamp}@ella-test.internal`,
    };

    const userRes = await request.post('/users', { data: userPayload });
    expect(userRes.status()).toBe(201);
    const userJson = await userRes.json();
    expect(userJson.statusCode).toBe(201);
    expect(userJson.data).toHaveProperty('id');
    expect(userJson.data.email).toBe(userPayload.email);

    const userId = userJson.data.id;

    // 2. Create a product with available inventory
    const initialQuantity = 15;
    const productPayload = {
      name: `Playwright Product ${timestamp}`,
      price: 89.99,
      quantity: initialQuantity,
      status: 'FOR_SALE',
    };

    const productRes = await request.post('/products', { data: productPayload });
    expect(productRes.status()).toBe(201);
    const productJson = await productRes.json();
    expect(productJson.data).toHaveProperty('id');
    expect(productJson.data.name).toBe(productPayload.name);

    const productId = productJson.data.id;

    // 3. Customer selects product from catalog
    const fetchProductRes = await request.get(`/products/${productId}`);
    expect(fetchProductRes.status()).toBe(200);
    const fetchProductJson = await fetchProductRes.json();
    expect(fetchProductJson.data.id).toBe(productId);

    // 4. Create Transaction (Order Purchase)
    const purchaseQuantity = 2;
    const txPayload = {
      userId,
      productId,
      quantity: purchaseQuantity,
    };

    const txRes = await request.post('/transactions', { data: txPayload });
    expect(txRes.status()).toBe(201);
    const txJson = await txRes.json();
    expect(txJson.statusCode).toBe(201);
    expect(txJson.data).toHaveProperty('id');
    expect(txJson.data.quantity).toBe(purchaseQuantity);
    expect(txJson.data.user.id).toBe(userId);
    expect(txJson.data.product.id).toBe(productId);

    const transactionId = txJson.data.id;

    // 5. Query transaction independently by ID
    const getTxRes = await request.get(`/transactions/${transactionId}`);
    expect(getTxRes.status()).toBe(200);
    const getTxJson = await getTxRes.json();
    expect(getTxJson.data.id).toBe(transactionId);
    expect(getTxJson.data.quantity).toBe(purchaseQuantity);
  });
});

