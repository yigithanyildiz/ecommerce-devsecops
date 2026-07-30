import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { StorefrontModule } from '../storefront/storefront.module';
import { AdminController } from './admin.controller';
import { AdminSystemController } from './admin-system.controller';
import { AdminService } from './admin.service';
import { AzureMonitorService } from './azure-monitor.service';
import { BackupStatusService } from './backup-status.service';
import { AdminMetricsJwtGuard } from './guards/admin-metrics-jwt.guard';
import { AppService } from '../app.service';
import { HealthScoreService } from '../common/services/health-score.service';
import { RequestMetricsService } from '../common/services/request-metrics.service';

@Module({
  imports: [
    PrismaModule,
    OrdersModule,
    StorefrontModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    }),
  ],
  controllers: [AdminController, AdminSystemController],
  providers: [
    AdminService,
    AdminMetricsJwtGuard,
    AzureMonitorService,
    BackupStatusService,
    AppService,
    HealthScoreService,
    RequestMetricsService,
  ],
})
export class AdminModule {}
