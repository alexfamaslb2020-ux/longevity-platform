import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { CustomersController } from "./customers.controller";
import { LeadsService } from "./leads.service";
import { CustomersService } from "./customers.service";
import { ConversionService } from "./conversion.service";
import { PrismaService } from "../../common/prisma.service";
import { MultiTenantService } from "../../common/multi-tenant.service";
import { AuditService } from "../../common/audit.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [LeadsController, CustomersController],
  providers: [
    LeadsService,
    CustomersService,
    ConversionService,
    PrismaService,
    MultiTenantService,
    AuditService,
  ],
  exports: [LeadsService, CustomersService, ConversionService],
})
export class CrmModule {}
