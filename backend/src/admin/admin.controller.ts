import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { UpdateOrderFulfillmentDto } from './dto/update-order-fulfillment.dto';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { UpdateActiveStatusDto } from './dto/update-active-status.dto';
import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { StorefrontService } from '../storefront/storefront.service';
import { UpdateStorefrontConfigDto } from '../storefront/dto/update-storefront-config.dto';
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly storefrontService: StorefrontService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('system/metrics')
  systemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('storefront')
  storefront() {
    return this.storefrontService.getConfig();
  }

  @Patch('storefront')
  updateStorefront(@Body() body: UpdateStorefrontConfigDto) {
    return this.storefrontService.updateConfig(body);
  }

  @Get('products')
  products() {
    return this.adminService.getProducts();
  }

  @Post('products')
  createProduct(@Body() body: CreateAdminProductDto) {
    return this.adminService.createProduct(body);
  }

  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() body: UpdateAdminProductDto,
  ) {
    return this.adminService.updateProduct(productId, body);
  }

  @Patch('products/:productId/status')
  updateProductStatus(
    @Param('productId') productId: string,
    @Body() body: UpdateActiveStatusDto,
  ) {
    return this.adminService.updateProductStatus(productId, body.isActive);
  }

  @Get('orders')
  orders() {
    return this.adminService.getOrders();
  }

  @Get('orders/:orderId')
  order(@Param('orderId') orderId: string) {
    return this.adminService.getOrder(orderId);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(orderId, body.status);
  }

  @Patch('orders/:orderId/fulfillment')
  updateOrderFulfillment(
    @Param('orderId') orderId: string,
    @Body() body: UpdateOrderFulfillmentDto,
  ) {
    return this.adminService.updateOrderFulfillment(orderId, body);
  }

  @Get('categories')
  categories() {
    return this.adminService.getCategories();
  }

  @Get('customers')
  customers() {
    return this.adminService.getCustomers();
  }

  @Get('customers/:customerId')
  customer(@Param('customerId') customerId: string) {
    return this.adminService.getCustomer(customerId);
  }

  @Patch('customers/:customerId/status')
  updateCustomerStatus(
    @Param('customerId') customerId: string,
    @Body() body: UpdateActiveStatusDto,
  ) {
    return this.adminService.updateCustomerStatus(customerId, body.isActive);
  }

  @Post('categories')
  createCategory(@Body() body: CreateAdminCategoryDto) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateAdminCategoryDto,
  ) {
    return this.adminService.updateCategory(categoryId, body);
  }
}
