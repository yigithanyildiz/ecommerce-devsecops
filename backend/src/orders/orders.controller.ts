import { 
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards, } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() request: AuthenticatedRequest) {
    return this.ordersService.checkout(request.user.userId);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.ordersService.findAll(request.user.userId);
  }

  @Get(':id')
  @Patch(':id/status')
@Roles('ADMIN')
updateStatus(
  @Param('id') orderId: string,
  @Body() updateOrderStatusDto: UpdateOrderStatusDto,
) {
  return this.ordersService.updateStatus(
    orderId,
    updateOrderStatusDto.status,
  );
}
  findOne(@Req() request: AuthenticatedRequest, @Param('id') orderId: string) {
    return this.ordersService.findOne(request.user.userId, orderId);
  }
  
}
