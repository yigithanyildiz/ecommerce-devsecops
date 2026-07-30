import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { StorefrontModule } from '../storefront/storefront.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AzureMonitorService } from './azure-monitor.service';
import { BackupStatusService } from './backup-status.service';
import { AppService } from '../app.service';
import { HealthScoreService } from '../common/services/health-score.service';
import { RequestMetricsService } from '../common/services/request-metrics.service';

@Module({
  imports: [PrismaModule, OrdersModule, StorefrontModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AzureMonitorService,
    BackupStatusService,
    AppService,
    HealthScoreService,
    RequestMetricsService,
  ],
})
export class AdminModule {}
