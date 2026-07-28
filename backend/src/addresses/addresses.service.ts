import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, createAddressDto: CreateAddressDto) {
    const shouldSetDefault =
      createAddressDto.isDefault === true ||
      (await this.prisma.address.count({ where: { userId } })) === 0;

    return this.prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          ...this.toCreateAddressData(createAddressDto),
          isDefault: shouldSetDefault,
        },
      });
    });
  }

  async update(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    await this.ensureAddressOwner(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      if (updateAddressDto.isDefault === true) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const updatedAddress = await tx.address.update({
        where: { id: addressId },
        data: this.toUpdateAddressData(updateAddressDto),
      });

      await this.ensureUserHasDefaultAddress(tx, userId);

      return updatedAddress;
    });
  }

  async setDefault(userId: string, addressId: string) {
    await this.ensureAddressOwner(userId, addressId);

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  async remove(userId: string, addressId: string) {
    const address = await this.ensureAddressOwner(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      if (address.isDefault) {
        await this.ensureUserHasDefaultAddress(tx, userId);
      }
    });

    return {
      message: 'Address removed',
    };
  }

  private async ensureAddressOwner(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  private async ensureUserHasDefaultAddress(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const defaultAddress = await tx.address.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (defaultAddress) {
      return;
    }

    const fallbackAddress = await tx.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!fallbackAddress) {
      return;
    }

    await tx.address.update({
      where: { id: fallbackAddress.id },
      data: { isDefault: true },
    });
  }

  private toCreateAddressData(dto: CreateAddressDto) {
    return {
      title: dto.title,
      recipientName: dto.recipientName,
      phone: dto.phone,
      city: dto.city,
      addressLine: dto.addressLine,
      ...(dto.latitude !== undefined && {
        latitude: new Prisma.Decimal(dto.latitude),
      }),
      ...(dto.longitude !== undefined && {
        longitude: new Prisma.Decimal(dto.longitude),
      }),
    };
  }

  private toUpdateAddressData(dto: UpdateAddressDto) {
    return {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.recipientName !== undefined && {
        recipientName: dto.recipientName,
      }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.addressLine !== undefined && { addressLine: dto.addressLine }),
      ...(dto.latitude !== undefined && {
        latitude: new Prisma.Decimal(dto.latitude),
      }),
      ...(dto.longitude !== undefined && {
        longitude: new Prisma.Decimal(dto.longitude),
      }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
    };
  }
}
