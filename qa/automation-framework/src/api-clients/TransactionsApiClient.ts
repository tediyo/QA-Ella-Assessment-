import { BaseApiClient } from './BaseApiClient';

export interface TransactionPayload {
  userId: number;
  productId: number;
  quantity: number;
}

export class TransactionsApiClient extends BaseApiClient {
  async createTransaction(payload: TransactionPayload) {
    return this.post('/transactions', payload);
  }

  async getAllTransactions() {
    return this.get('/transactions');
  }

  async getTransactionById(id: number | string) {
    return this.get(`/transactions/${id}`);
  }
}

