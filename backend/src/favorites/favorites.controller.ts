import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import type { Request } from 'express';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { FavoritesService } from './favorites.service';
  
  type AuthenticatedRequest = Request & {
    user: {
      userId: string;
      email: string;
      role: string;
    };
  };
  
  @UseGuards(JwtAuthGuard)
  @Controller('favorites')
  export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) {}
  
    @Get()
    findAll(@Req() request: AuthenticatedRequest) {
      return this.favoritesService.findAll(request.user.userId);
    }
  
    @Post(':productId')
    add(
      @Req() request: AuthenticatedRequest,
      @Param('productId') productId: string,
    ) {
      return this.favoritesService.add(request.user.userId, productId);
    }
  
    @Delete(':productId')
    remove(
      @Req() request: AuthenticatedRequest,
      @Param('productId') productId: string,
    ) {
      return this.favoritesService.remove(request.user.userId, productId);
    }
  }