import request, { Test } from 'supertest';
import { testConfig } from '../config/test-config';

export interface ApiResponseWrapper<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

export class BaseApiClient {
  protected baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || testConfig.baseUrl;
  }

  public get(path: string): Test {
    return request(this.baseUrl)
      .get(path)
      .set('Accept', 'application/json');
  }

  public post(path: string, body?: any): Test {
    return request(this.baseUrl)
      .post(path)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
  }

  public put(path: string, body?: any): Test {
    return request(this.baseUrl)
      .put(path)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
  }

  public delete(path: string): Test {
    return request(this.baseUrl)
      .delete(path)
      .set('Accept', 'application/json');
  }
}

