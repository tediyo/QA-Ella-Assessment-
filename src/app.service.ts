import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'ella-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
