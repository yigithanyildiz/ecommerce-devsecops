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

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('products')
  products() {
    return this.adminService.getProducts();
  }

  @Post('products')
  createProduct(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      price: string;
      stock: number;
      imageUrl?: string;
      categoryId: string;
    },
  ) {
    return this.adminService.createProduct(body);
  }

  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      price?: string;
      stock?: number;
      imageUrl?: string;
      categoryId?: string;
    },
  ) {
    return this.adminService.updateProduct(productId, body);
  }

  @Patch('products/:productId/status')
  updateProductStatus(
    @Param('productId') productId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateProductStatus(productId, isActive);
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
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(orderId, status);
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
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateCustomerStatus(customerId, isActive);
  }

  @Post('categories')
  createCategory(@Body() body: { name: string; slug: string }) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.adminService.updateCategory(categoryId, body);
  }
}
