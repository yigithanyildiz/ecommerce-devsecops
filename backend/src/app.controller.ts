import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getRoot();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/details')
  getHealthDetails() {
    return this.appService.getHealthDetails();
  }

  @Get('version')
  getVersion() {
    return this.appService.getVersion();
  }
}
