import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { UpdateOrderFulfillmentDto } from './dto/update-order-fulfillment.dto';
import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { AzureMonitorService } from './azure-monitor.service';
import { BackupStatusService } from './backup-status.service';
import { AppService } from '../app.service';
import { HealthScoreService } from '../common/services/health-score.service';
import { RequestMetricsService } from '../common/services/request-metrics.service';

type AdminActor = {
  userId: string;
  email: string;
  role: string;
};

type AuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: unknown;
};

type AuditLogRecord = {
  id: string;
  actorId: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly azureMonitorService: AzureMonitorService,
    private readonly backupStatusService: BackupStatusService,
    private readonly appService: AppService,
    private readonly healthScoreService: HealthScoreService,
    private readonly requestMetricsService: RequestMetricsService,
  ) {}

  async getDashboard() {
    const [
      totalProducts,
      totalOrders,
      lowStockProducts,
      outOfStockProducts,
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
      this.prisma.product.count({
        where: {
          stock: {
            lte: 0,
          },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
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
      outOfStockProducts,
      totalRevenue: revenueAggregate._sum.totalAmount?.toString() ?? '0',
      recentOrders,
      lowStockItems,
    };
  }

  async getSystemMetrics() {
    const [healthDetails, azure, backups] = await Promise.all([
      this.getSafeHealthDetails(),
      this.azureMonitorService.getVmMetrics(),
      this.backupStatusService.getStatus(),
    ]);
    const healthScore = this.healthScoreService.getSummary();
    const requestMetrics = this.requestMetricsService.getSummary();

    return {
      checkedAt: new Date().toISOString(),
      overallStatus: this.getOverallStatus({
        apiScore: healthScore.api.scorePercent,
        databaseScore: healthScore.database.scorePercent,
        serverErrorRate: requestMetrics.serverErrorRate,
        backupStatus:
          backups.available && backups.freshnessStatus
            ? backups.freshnessStatus
            : 'critical',
      }),
      api: {
        ...this.appService.getVersion(),
        health: healthDetails,
        healthScore,
        requestMetrics,
      },
      azure,
      backups,
    };
  }

  private async getSafeHealthDetails() {
    try {
      return await this.appService.getHealthDetails();
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          api: 'ok',
          database: 'down',
        },
        latencyMs: {
          database: null,
        },
        error:
          error instanceof Error
            ? error.message
            : 'Database health check failed',
      };
    }
  }

  private getOverallStatus({
    apiScore,
    databaseScore,
    serverErrorRate,
    backupStatus,
  }: {
    apiScore: number;
    databaseScore: number;
    serverErrorRate: number;
    backupStatus: string;
  }) {
    if (
      apiScore < 90 ||
      databaseScore < 90 ||
      serverErrorRate >= 10 ||
      backupStatus === 'critical'
    ) {
      return {
        level: 'critical',
        label: 'Critical',
        reason: 'One or more core operational checks require attention.',
      };
    }

    if (
      apiScore < 100 ||
      databaseScore < 100 ||
      serverErrorRate > 0 ||
      backupStatus === 'warning'
    ) {
      return {
        level: 'degraded',
        label: 'Degraded',
        reason: 'The system is available with minor operational warnings.',
      };
    }

    return {
      level: 'healthy',
      label: 'Healthy',
      reason: 'All monitored checks are passing.',
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

  async getAuditLogs() {
    return this.prisma.$queryRaw<AuditLogRecord[]>`
      SELECT
        "id",
        "actorId",
        "actorEmail",
        "actorRole",
        "action",
        "entityType",
        "entityId",
        "entityLabel",
        "metadata",
        "createdAt"
      FROM "AdminAuditLog"
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;
  }

  async getAuditLog(auditLogId: string) {
    const logs = await this.prisma.$queryRaw<AuditLogRecord[]>`
      SELECT
        "id",
        "actorId",
        "actorEmail",
        "actorRole",
        "action",
        "entityType",
        "entityId",
        "entityLabel",
        "metadata",
        "createdAt"
      FROM "AdminAuditLog"
      WHERE "id" = ${auditLogId}
      LIMIT 1
    `;

    const auditLog = logs[0];

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return auditLog;
  }

  async recordAuditLog(actor: AdminActor, input: AuditLogInput) {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "AdminAuditLog" (
          "id",
          "actorId",
          "actorEmail",
          "actorRole",
          "action",
          "entityType",
          "entityId",
          "entityLabel",
          "metadata"
        )
        VALUES (
          ${randomUUID()},
          ${actor.userId},
          ${actor.email},
          ${actor.role},
          ${input.action},
          ${input.entityType},
          ${input.entityId ?? null},
          ${input.entityLabel ?? null},
          ${JSON.stringify(this.toAuditMetadata(input.metadata) ?? null)}::jsonb
        )
      `;
    } catch {
      return;
    }
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
  async updateOrderStatus(
    actor: AdminActor,
    orderId: string,
    status: OrderStatus,
  ) {
    const updatedOrder = await this.ordersService.updateStatus(
      orderId,
      status,
      {
        includeUser: true,
      },
    );

    await this.recordAuditLog(actor, {
      action: 'order.status_update',
      entityType: 'order',
      entityId: updatedOrder.id,
      entityLabel: updatedOrder.id.slice(0, 8),
      metadata: {
        status,
      },
    });

    return updatedOrder;
  }

  async updateOrderFulfillment(
    actor: AdminActor,
    orderId: string,
    data: UpdateOrderFulfillmentDto,
  ) {
    if (data.status !== undefined) {
      const updatedOrder = await this.ordersService.updateStatus(
        orderId,
        data.status,
        {
          includeUser: true,
          ...(data.trackingNumber !== undefined
            ? { trackingNumber: data.trackingNumber || null }
            : {}),
        },
      );

      await this.recordAuditLog(actor, {
        action: 'order.fulfillment_update',
        entityType: 'order',
        entityId: updatedOrder.id,
        entityLabel: updatedOrder.id.slice(0, 8),
        metadata: {
          status: data.status,
          trackingNumber: data.trackingNumber || null,
        },
      });

      return updatedOrder;
    }

    const updatedOrder = await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        trackingNumber: data.trackingNumber || null,
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

    await this.recordAuditLog(actor, {
      action: 'order.tracking_update',
      entityType: 'order',
      entityId: updatedOrder.id,
      entityLabel: updatedOrder.id.slice(0, 8),
      metadata: {
        trackingNumber: data.trackingNumber || null,
      },
    });

    return updatedOrder;
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

  async updateCustomerStatus(
    actor: AdminActor,
    customerId: string,
    isActive: boolean,
  ) {
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

    await this.recordAuditLog(actor, {
      action: 'customer.status_update',
      entityType: 'customer',
      entityId: updatedCustomer.id,
      entityLabel: updatedCustomer.email,
      metadata: {
        isActive,
      },
    });

    return this.toCustomerSummary(updatedCustomer);
  }

  async createProduct(actor: AdminActor, data: CreateAdminProductDto) {
    try {
      const product = await this.prisma.product.create({
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

      await this.recordAuditLog(actor, {
        action: 'product.create',
        entityType: 'product',
        entityId: product.id,
        entityLabel: product.name,
        metadata: {
          slug: product.slug,
          price: product.price.toString(),
          stock: product.stock,
          categoryId: product.categoryId,
        },
      });

      return product;
    } catch (error) {
      this.handleAdminWriteError(error, 'Product slug already exists');
    }
  }
  async updateProduct(
    actor: AdminActor,
    productId: string,
    data: UpdateAdminProductDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    try {
      const updatedProduct = await this.prisma.product.update({
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
          ...(data.imageUrl !== undefined
            ? { imageUrl: data.imageUrl || null }
            : {}),
          ...(data.categoryId !== undefined
            ? { categoryId: data.categoryId }
            : {}),
        },
        include: {
          category: true,
        },
      });

      await this.recordAuditLog(actor, {
        action: 'product.update',
        entityType: 'product',
        entityId: updatedProduct.id,
        entityLabel: updatedProduct.name,
        metadata: {
          changedFields: Object.keys(data),
        },
      });

      return updatedProduct;
    } catch (error) {
      this.handleAdminWriteError(error, 'Product slug already exists');
    }
  }

  async updateProductStatus(
    actor: AdminActor,
    productId: string,
    isActive: boolean,
  ) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await this.prisma.product.update({
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

    await this.recordAuditLog(actor, {
      action: 'product.status_update',
      entityType: 'product',
      entityId: updatedProduct.id,
      entityLabel: updatedProduct.name,
      metadata: {
        isActive,
      },
    });

    return updatedProduct;
  }
  async createCategory(actor: AdminActor, data: CreateAdminCategoryDto) {
    try {
      const category = await this.prisma.category.create({
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

      await this.recordAuditLog(actor, {
        action: 'category.create',
        entityType: 'category',
        entityId: category.id,
        entityLabel: category.name,
        metadata: {
          slug: category.slug,
        },
      });

      return category;
    } catch (error) {
      this.handleAdminWriteError(error, 'Category slug already exists');
    }
  }

  async updateCategory(
    actor: AdminActor,
    categoryId: string,
    data: UpdateAdminCategoryDto,
  ) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      const updatedCategory = await this.prisma.category.update({
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

      await this.recordAuditLog(actor, {
        action: 'category.update',
        entityType: 'category',
        entityId: updatedCategory.id,
        entityLabel: updatedCategory.name,
        metadata: {
          changedFields: Object.keys(data),
        },
      });

      return updatedCategory;
    } catch (error) {
      this.handleAdminWriteError(error, 'Category slug already exists');
    }
  }
  private handleAdminWriteError(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }

    throw error;
  }

  private toAuditMetadata(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
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
