import { BaseApiClient } from './BaseApiClient';

export class HealthApiClient extends BaseApiClient {
  async getHealth() {
    return this.get('/health');
  }

  async getRoot() {
    return this.get('/');
  }
}

