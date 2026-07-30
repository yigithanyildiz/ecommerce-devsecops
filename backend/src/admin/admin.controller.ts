import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
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

type AdminActor = {
  userId: string;
  email: string;
  role: string;
};

type AdminRequest = Request & {
  user: AdminActor;
};

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

  @Get('storefront')
  storefront() {
    return this.storefrontService.getConfig();
  }

  @Patch('storefront')
  async updateStorefront(
    @Req() request: AdminRequest,
    @Body() body: UpdateStorefrontConfigDto,
  ) {
    const storefront = await this.storefrontService.updateConfig(body);
    await this.adminService.recordAuditLog(request.user, {
      action: 'storefront.update',
      entityType: 'storefront',
      entityId: storefront.id,
      entityLabel: storefront.heroTitle,
      metadata: body,
    });

    return storefront;
  }

  @Get('products')
  products() {
    return this.adminService.getProducts();
  }

  @Post('products')
  createProduct(
    @Req() request: AdminRequest,
    @Body() body: CreateAdminProductDto,
  ) {
    return this.adminService.createProduct(request.user, body);
  }

  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Req() request: AdminRequest,
    @Body() body: UpdateAdminProductDto,
  ) {
    return this.adminService.updateProduct(request.user, productId, body);
  }

  @Patch('products/:productId/status')
  updateProductStatus(
    @Param('productId') productId: string,
    @Req() request: AdminRequest,
    @Body() body: UpdateActiveStatusDto,
  ) {
    return this.adminService.updateProductStatus(
      request.user,
      productId,
      body.isActive,
    );
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
    @Req() request: AdminRequest,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(
      request.user,
      orderId,
      body.status,
    );
  }

  @Patch('orders/:orderId/fulfillment')
  updateOrderFulfillment(
    @Param('orderId') orderId: string,
    @Req() request: AdminRequest,
    @Body() body: UpdateOrderFulfillmentDto,
  ) {
    return this.adminService.updateOrderFulfillment(
      request.user,
      orderId,
      body,
    );
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
    @Req() request: AdminRequest,
    @Body() body: UpdateActiveStatusDto,
  ) {
    return this.adminService.updateCustomerStatus(
      request.user,
      customerId,
      body.isActive,
    );
  }

  @Post('categories')
  createCategory(
    @Req() request: AdminRequest,
    @Body() body: CreateAdminCategoryDto,
  ) {
    return this.adminService.createCategory(request.user, body);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Req() request: AdminRequest,
    @Body() body: UpdateAdminCategoryDto,
  ) {
    return this.adminService.updateCategory(request.user, categoryId, body);
  }

  @Get('audit-logs')
  auditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('audit-logs/:auditLogId')
  auditLog(@Param('auditLogId') auditLogId: string) {
    return this.adminService.getAuditLog(auditLogId);
  }
}
