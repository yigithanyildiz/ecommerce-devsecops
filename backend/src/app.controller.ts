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

  @Get('version')
  getVersion() {
    return {
      name: 'ecommerce-devsecops-api',
      environment: process.env.NODE_ENV ?? 'development',
      commitSha: process.env.APP_COMMIT_SHA ?? 'local',
      builtAt: process.env.APP_BUILD_TIME ?? 'local',
    };
  }
}
