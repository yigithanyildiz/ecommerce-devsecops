import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
    role: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.addressesService.findAll(request.user.userId);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.create(
      request.user.userId,
      createAddressDto,
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(
      request.user.userId,
      addressId,
      updateAddressDto,
    );
  }

  @Patch(':id/default')
  setDefault(
    @Req() request: AuthenticatedRequest,
    @Param('id') addressId: string,
  ) {
    return this.addressesService.setDefault(request.user.userId, addressId);
  }

  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') addressId: string,
  ) {
    return this.addressesService.remove(request.user.userId, addressId);
  }
}
