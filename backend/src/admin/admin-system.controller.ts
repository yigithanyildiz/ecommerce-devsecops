import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { AdminMetricsJwtGuard } from './guards/admin-metrics-jwt.guard';

@Controller('admin/system')
@UseGuards(AdminMetricsJwtGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSystemController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  metrics() {
    return this.adminService.getSystemMetrics();
  }
}
