import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

type EntityWithOrg = { organizationId: string | null };

type PrismaModelDelegate = {
  findUnique: (args: {
    where: { id: string };
    select: { organizationId: boolean };
  }) => Promise<{ organizationId: string | null } | null>;
};

@Injectable()
export class MultiTenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a given entity belongs to the user's organization.
   * Throws NotFoundException if not (to avoid leaking existence info).
   */
  async assertEntityOwnership(
    entityName: string,
    entityId: string,
    organizationId: string | null | undefined,
  ): Promise<void> {
    if (!organizationId) return;

    const delegate = this.prisma[
      entityName as keyof PrismaService
    ] as unknown as PrismaModelDelegate;
    const entity = await delegate.findUnique({
      where: { id: entityId },
      select: { organizationId: true },
    });

    if (!entity) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Registo não encontrado",
      });
    }

    if (entity.organizationId && entity.organizationId !== organizationId) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Registo não encontrado",
      });
    }
  }

  /**
   * Adds organizationId filter to a where clause if the user has one.
   */
  addOrgFilter<T extends Record<string, unknown>>(
    where: T,
    organizationId: string | null | undefined,
  ): T {
    if (organizationId) {
      return { ...where, organizationId } as T;
    }
    return where;
  }

  /**
   * Validates that a user's organizationId matches, or returns a safe error.
   * Use in services for write operations.
   */
  validateOwnership(
    entity: EntityWithOrg | null,
    organizationId: string | null | undefined,
    entityName = "Registo",
  ): void {
    if (!entity) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: `${entityName} não encontrado`,
      });
    }
    if (
      entity.organizationId &&
      organizationId &&
      entity.organizationId !== organizationId
    ) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: `${entityName} não encontrado`,
      });
    }
  }
}
