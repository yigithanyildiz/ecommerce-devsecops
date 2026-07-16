import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
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
  findOne(@Req() request: AuthenticatedRequest, @Param('id') orderId: string) {
    return this.ordersService.findOne(request.user.userId, orderId);
  }
}
