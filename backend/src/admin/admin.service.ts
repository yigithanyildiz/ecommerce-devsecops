import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalProducts,
      totalOrders,
      lowStockProducts,
      revenueAggregate,
      recentOrders,
      lowStockItems,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.product.count({
        where: {
          stock: {
            lte: 5,
          },
        },
      }),
      this.prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
            },
          },
        },
      }),
      this.prisma.product.findMany({
        take: 5,
        where: {
          stock: {
            lte: 5,
          },
        },
        orderBy: {
          stock: 'asc',
        },
        include: {
          category: true,
        },
      }),
    ]);

    return {
      totalProducts,
      totalOrders,
      lowStockProducts,
      totalRevenue: revenueAggregate._sum.totalAmount?.toString() ?? '0',
      recentOrders,
      lowStockItems,
    };
  }
  async getProducts() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
      },
    });
  }
  async getOrders() {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                imageUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
  async getOrder(orderId: string) {
    return this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                imageUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });
  
    if (!order) {
      throw new NotFoundException('Order not found');
    }
  
    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status as any,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                imageUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async getCustomers() {
    const customers = await this.prisma.user.findMany({
      where: {
        role: 'USER',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            orders: true,
            favorites: true,
          },
        },
        orders: {
          select: {
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return customers.map((customer) => this.toCustomerSummary(customer));
  }

  async getCustomer(customerId: string) {
    const customer = await this.prisma.user.findFirst({
      where: {
        id: customerId,
        role: 'USER',
      },
      include: {
        _count: {
          select: {
            orders: true,
            favorites: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      ...this.toCustomerSummary(customer),
      orders: customer.orders,
    };
  }

  async updateCustomerStatus(customerId: string, isActive: boolean) {
    const customer = await this.prisma.user.findFirst({
      where: {
        id: customerId,
        role: 'USER',
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updatedCustomer = await this.prisma.user.update({
      where: {
        id: customerId,
      },
      data: {
        isActive,
      },
      include: {
        _count: {
          select: {
            orders: true,
            favorites: true,
          },
        },
        orders: {
          select: {
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return this.toCustomerSummary(updatedCustomer);
  }

  async createProduct(data: {
    name: string;
    slug: string;
    description?: string;
    price: string;
    stock: number;
    imageUrl?: string;
    categoryId: string;
  }) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl || null,
        categoryId: data.categoryId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });
  }
  async updateProduct(
    productId: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      price?: string;
      stock?: number;
      imageUrl?: string;
      categoryId?: string;
    },
  ) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      },
      include: {
        category: true,
      },
    });
  }
  
  async updateProductStatus(productId: string, isActive: boolean) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        isActive,
      },
      include: {
        category: true,
      },
    });
  }
  async createCategory(data: { name: string; slug: string }) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async updateCategory(
    categoryId: string,
    data: { name?: string; slug?: string },
  ) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  private toCustomerSummary(customer: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    _count: {
      orders: number;
      favorites: number;
    };
    orders: Array<{
      totalAmount: unknown;
      createdAt: Date;
    }>;
  }) {
    const totalSpent = customer.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      orderCount: customer._count.orders,
      favoriteCount: customer._count.favorites,
      totalSpent: totalSpent.toFixed(2),
      lastOrderAt: customer.orders[0]?.createdAt ?? null,
    };
  }
}
