import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AppointmentStatus, Prisma } from "@prisma/client";

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    organizationId?: string;
    status?: AppointmentStatus;
    from?: string;
    to?: string;
    limit?: number;
  }) {
    const { organizationId, status, from, to, limit = 200 } = params;

    const where: Prisma.AppointmentWhereInput = {
      OR: [{ lead: { organizationId } }, { customer: { organizationId } }],
    };

    if (status) where.status = status;

    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from);
      if (to) where.startDate.lte = new Date(to);
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        lead: {
          select: { id: true, name: true, email: true, phone: true },
        },
        customer: {
          select: {
            id: true,
            churnRisk: true,
            lead: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
      take: limit,
    });
  }
}
