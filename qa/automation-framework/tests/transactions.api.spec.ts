import { UsersApiClient, ProductsApiClient, TransactionsApiClient } from '../src/api-clients';
import { DataFactory } from '../src/fixtures/data-factory';

describe('Transactions API - Order Lifecycle & Inventory Logic', () => {
  const usersClient = new UsersApiClient();
  const productsClient = new ProductsApiClient();
  const transactionsClient = new TransactionsApiClient();

  let testUserId: number;
  let testProductId: number;

  beforeAll(async () => {
    // Bootstrap valid User and Product fixtures
    const user = await usersClient.createUser(DataFactory.createUniqueUser());
    testUserId = user.body.data.id;

    const product = await productsClient.createProduct(
      DataFactory.createUniqueProduct({ quantity: 10 }),
    );
    testProductId = product.body.data.id;
  });

  describe('POST /transactions (Create Transaction)', () => {
    it('should return 404 when user ID does not exist', async () => {
      const payload = DataFactory.createTransactionPayload(999999, testProductId, 1);
      const res = await transactionsClient.createTransaction(payload);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('User with ID 999999 not found');
    });

    it('should return 404 when product ID does not exist', async () => {
      const payload = DataFactory.createTransactionPayload(testUserId, 999999, 1);
      const res = await transactionsClient.createTransaction(payload);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Product with ID 999999 not found');
    });

    it('should reject purchase when requested quantity exceeds available stock with 409 Conflict', async () => {
      const payload = DataFactory.createTransactionPayload(testUserId, testProductId, 999);
      const res = await transactionsClient.createTransaction(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('exceeds available stock');
    });

    it('should reject non-positive transaction quantities with 400 Bad Request', async () => {
      const payload = DataFactory.createTransactionPayload(testUserId, testProductId, 0);
      const res = await transactionsClient.createTransaction(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining(['quantity must not be less than 1']),
      );
    });
  });

  describe('GET /transactions (List Transactions)', () => {
    it('should return all recorded transactions with relations', async () => {
      const res = await transactionsClient.getAllTransactions();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

