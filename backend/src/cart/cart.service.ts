import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    return this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async addItem(userId: string, addCartItemDto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const product = await this.prisma.product.findFirst({
      where: {
        id: addCartItemDto.productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      update: {
        quantity: {
          increment: addCartItemDto.quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: product.id,
        quantity: addCartItemDto.quantity,
      },
      include: {
        product: true,
      },
    });
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: updateCartItemDto.quantity,
      },
      include: {
        product: true,
      },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return {
      message: 'Cart item removed',
    };
  }

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}
