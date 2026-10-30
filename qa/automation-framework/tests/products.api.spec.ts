import { ProductsApiClient } from '../src/api-clients';
import { DataFactory } from '../src/fixtures/data-factory';

describe('Products API - Functional, Validation & Boundary Suite', () => {
  const productsClient = new ProductsApiClient();

  describe('POST /products (Create Product)', () => {
    it('should create product with default FOR_SALE status', async () => {
      const payload = DataFactory.createUniqueProduct();
      const res = await productsClient.createProduct(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: payload.name,
        price: payload.price.toString(),
        quantity: payload.quantity,
        status: 'FOR_SALE',
      });
    });

    it('should reject negative quantity with 400 Bad Request', async () => {
      const payload = DataFactory.createUniqueProduct({ quantity: -5 });
      const res = await productsClient.createProduct(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining(['quantity must not be less than 0']),
      );
    });

    it('should reject duplicate product names with 409 Conflict', async () => {
      const payload = DataFactory.createUniqueProduct();
      const firstRes = await productsClient.createProduct(payload);
      expect(firstRes.status).toBe(201);

      const duplicateRes = await productsClient.createProduct(payload);
      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toContain('Product name already exists');
    });
  });

  describe('GET /products (List Products)', () => {
    it('should retrieve list of products with 200 OK', async () => {
      const res = await productsClient.getAllProducts();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /products/:id (Get Single Product)', () => {
    it('should return 404 when product ID is not found', async () => {
      const nonExistentId = 888888;
      const res = await productsClient.getProductById(nonExistentId);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Product with ID ${nonExistentId} not found`);
    });
  });
});

