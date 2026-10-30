import { BaseApiClient } from './BaseApiClient';

export interface UserPayload {
  name: string;
  email: string;
}

export class UsersApiClient extends BaseApiClient {
  async createUser(payload: UserPayload) {
    return this.post('/users', payload);
  }

  async getAllUsers() {
    return this.get('/users');
  }

  async getUserById(id: number | string) {
    return this.get(`/users/${id}`);
  }

  async updateUser(id: number | string, payload: Partial<UserPayload>) {
    return this.put(`/users/${id}`, payload);
  }
}

