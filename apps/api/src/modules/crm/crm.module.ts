import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { CustomersController } from "./customers.controller";
import { AppointmentsController } from "./appointments.controller";
import { LeadsService } from "./leads.service";
import { CustomersService } from "./customers.service";
import { ConversionService } from "./conversion.service";
import { AppointmentsService } from "./appointments.service";
import { PrismaService } from "../../common/prisma.service";
import { MultiTenantService } from "../../common/multi-tenant.service";
import { AuditService } from "../../common/audit.service";
import { AuthModule } from "../auth/auth.module";
import { AutomationsModule } from "../automation/automations.module";

@Module({
  imports: [AuthModule, AutomationsModule],
  controllers: [LeadsController, CustomersController, AppointmentsController],
  providers: [
    LeadsService,
    CustomersService,
    ConversionService,
    AppointmentsService,
    PrismaService,
    MultiTenantService,
    AuditService,
  ],
  exports: [LeadsService, CustomersService, ConversionService],
})
export class CrmModule {}
