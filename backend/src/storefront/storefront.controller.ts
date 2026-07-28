import { Controller, Get } from '@nestjs/common';
import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get()
  getConfig() {
    return this.storefrontService.getConfig();
  }
}
