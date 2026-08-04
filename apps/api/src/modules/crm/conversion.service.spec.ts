import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ConversionService } from "./conversion.service";

const mockPrisma = {
  lead: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  conversation: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockMultiTenant = {
  validateOwnership: jest.fn(),
};

const mockAudit = {
  log: jest.fn(),
};

const mockAutomation = {
  publish: jest.fn(),
};

describe("ConversionService", () => {
  let service: ConversionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversionService(
      mockPrisma as any,
      mockMultiTenant as any,
      mockAudit as any,
      mockAutomation as any,
    );
  });

  const validLead = {
    id: "lead-1",
    name: "João Silva",
    email: "joao@example.com",
    phone: "+351911111111",
    status: "NEW",
    source: "WEBSITE",
    assignedToId: "user-1",
    tags: ["tag1"],
    metadata: {},
    organizationId: "org-1",
  };

  const validContext = {
    leadId: "lead-1",
    organizationId: "org-1",
    actorId: "user-admin",
    responsibleUserId: "user-1",
  };

  it("converts a valid lead to customer", async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(validLead);
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        customer: {
          create: jest.fn().mockResolvedValue({
            id: "cust-1",
            leadId: "lead-1",
            status: "ONBOARDING",
          }),
        },
        lead: {
          update: jest.fn(),
        },
        conversation: {
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn(),
        },
      });
    });

    const result = await service.convert(validContext);

    expect(result).toBeDefined();
    expect(result.id).toBe("cust-1");
    expect(mockMultiTenant.validateOwnership).toHaveBeenCalledWith(
      validLead,
      "org-1",
      "Lead",
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "lead.converted",
        resource: "customer",
      }),
    );
  });

  it("throws NotFoundException for non-existent lead", async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    await expect(service.convert(validContext)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws BadRequestException for already converted lead", async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      ...validLead,
      status: "CONVERTED",
    });

    await expect(service.convert(validContext)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("throws ConflictException for duplicate email", async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(validLead);
    mockPrisma.customer.findFirst.mockResolvedValue({ id: "existing-cust" });

    await expect(service.convert(validContext)).rejects.toThrow(
      ConflictException,
    );
  });

  it("rolls back transaction on error", async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(validLead);
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockRejectedValue(new Error("DB error"));

    await expect(service.convert(validContext)).rejects.toThrow("DB error");
  });
});
