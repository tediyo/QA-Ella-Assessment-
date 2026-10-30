import { BaseApiClient } from './BaseApiClient';

export interface ProductPayload {
  name: string;
  price: number;
  quantity: number;
  status?: 'FOR_SALE' | 'OUT_OF_STOCK';
}

export class ProductsApiClient extends BaseApiClient {
  async createProduct(payload: ProductPayload) {
    return this.post('/products', payload);
  }

  async getAllProducts() {
    return this.get('/products');
  }

  async getProductById(id: number | string) {
    return this.get(`/products/${id}`);
  }

  async updateProduct(id: number | string, payload: Partial<ProductPayload>) {
    return this.put(`/products/${id}`, payload);
  }
}

