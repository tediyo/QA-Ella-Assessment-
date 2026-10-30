import 'dotenv/config';

export interface TestConfig {
  baseUrl: string;
  timeoutMs: number;
  retries: number;
}

export const testConfig: TestConfig = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  timeoutMs: Number(process.env.TEST_TIMEOUT_MS) || 10000,
  retries: Number(process.env.TEST_RETRIES) || 0,
};

