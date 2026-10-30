import { UsersApiClient, ProductsApiClient, TransactionsApiClient } from '../src/api-clients';
import { DataFactory } from '../src/fixtures/data-factory';

describe('E2E Critical Flow: User Registration -> Product Selection -> Order Placement', () => {
  const usersClient = new UsersApiClient();
  const productsClient = new ProductsApiClient();
  const transactionsClient = new TransactionsApiClient();

  it('should complete the full e-commerce purchase lifecycle successfully', async () => {
    // Step 1: Create a new customer user
    const userPayload = DataFactory.createUniqueUser();
    const userRes = await usersClient.createUser(userPayload);

    expect(userRes.status).toBe(201);
    expect(userRes.body.statusCode).toBe(201);
    expect(userRes.body.data).toHaveProperty('id');
    expect(userRes.body.data.email).toBe(userPayload.email);

    const userId = userRes.body.data.id;

    // Step 2: Create a product with available inventory
    const initialQuantity = 10;
    const productPayload = DataFactory.createUniqueProduct({
      quantity: initialQuantity,
      price: 99.5,
    });
    const productRes = await productsClient.createProduct(productPayload);

    expect(productRes.status).toBe(201);
    expect(productRes.body.data).toHaveProperty('id');
    expect(productRes.body.data.name).toBe(productPayload.name);
    expect(Number(productRes.body.data.quantity)).toBe(initialQuantity);

    const productId = productRes.body.data.id;

    // Step 3: Customer browses and selects the product
    const getProductRes = await productsClient.getProductById(productId);
    expect(getProductRes.status).toBe(200);
    expect(getProductRes.body.data.id).toBe(productId);

    // Step 4: Customer creates a purchase transaction for 3 units
    const purchaseQuantity = 3;
    const txPayload = DataFactory.createTransactionPayload(userId, productId, purchaseQuantity);
    const txRes = await transactionsClient.createTransaction(txPayload);

    expect(txRes.status).toBe(201);
    expect(txRes.body.statusCode).toBe(201);
    expect(txRes.body.data).toHaveProperty('id');
    expect(txRes.body.data.quantity).toBe(purchaseQuantity);
    expect(txRes.body.data.user.id).toBe(userId);
    expect(txRes.body.data.product.id).toBe(productId);

    const transactionId = txRes.body.data.id;

    // Step 5: Verify transaction can be queried independently
    const fetchTxRes = await transactionsClient.getTransactionById(transactionId);
    expect(fetchTxRes.status).toBe(200);
    expect(fetchTxRes.body.data.id).toBe(transactionId);
    expect(fetchTxRes.body.data.quantity).toBe(purchaseQuantity);
  });
});

