import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'ecommerce-devsecops-api',
      status: 'ok',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}