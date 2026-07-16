import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new BadRequestException(
            `Product is not active: ${item.product.name}`,
          );
        }

        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for product: ${item.product.name}`,
          );
        }
      }

      const totalAmount = cart.items.reduce(
        (total, item) =>
          total.plus(item.product.price.mul(new Prisma.Decimal(item.quantity))),
        new Prisma.Decimal(0),
      );

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: cart.items.map((item) => {
              const lineTotal = item.product.price.mul(
                new Prisma.Decimal(item.quantity),
              );

              return {
                productId: item.productId,
                productName: item.product.name,
                unitPrice: item.product.price,
                quantity: item.quantity,
                lineTotal,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
