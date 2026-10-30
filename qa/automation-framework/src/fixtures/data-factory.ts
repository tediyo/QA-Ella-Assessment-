import { UserPayload } from '../api-clients/UsersApiClient';
import { ProductPayload } from '../api-clients/ProductsApiClient';
import { TransactionPayload } from '../api-clients/TransactionsApiClient';

export class DataFactory {
  private static counter = 0;

  public static createUniqueUser(overrides?: Partial<UserPayload>): UserPayload {
    this.counter++;
    const timestamp = Date.now();
    return {
      name: `Automation User ${this.counter}`,
      email: `test_user_${timestamp}_${this.counter}@ella-test.internal`,
      ...overrides,
    };
  }

  public static createUniqueProduct(overrides?: Partial<ProductPayload>): ProductPayload {
    this.counter++;
    const timestamp = Date.now();
    return {
      name: `Product ${timestamp}_${this.counter}`,
      price: 29.99,
      quantity: 15,
      status: 'FOR_SALE',
      ...overrides,
    };
  }

  public static createTransactionPayload(
    userId: number,
    productId: number,
    quantity = 1,
    overrides?: Partial<TransactionPayload>,
  ): TransactionPayload {
    return {
      userId,
      productId,
      quantity,
      ...overrides,
    };
  }
}

