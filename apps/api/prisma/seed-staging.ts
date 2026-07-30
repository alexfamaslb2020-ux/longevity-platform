import { PrismaClient, UserRole, LeadSource, LeadStatus, CustomerStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Staging seed — creating synthetic data only");

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Longevity Staging (Synthetic)",
    },
  });
  console.log(`  Organization: ${org.name} (${org.id})`);

  // ── Admin User ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("staging-admin-2026", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@staging.longevity.pt" },
    update: {},
    create: {
      email: "admin@staging.longevity.pt",
      name: "Staging Admin",
      passwordHash,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });
  console.log(`  Admin: ${admin.email}`);

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      name: "Staging Pipeline",
      organizationId: org.id,
    },
  });

  const stages = [
    { key: "new", name: "Novo Lead", order: 0, color: "#6B7280" },
    { key: "contacted", name: "Contactado", order: 1, color: "#3B82F6" },
    { key: "qualifying", name: "Em Qualificação", order: 2, color: "#F59E0B" },
    { key: "proposal", name: "Proposta", order: 3, color: "#8B5CF6" },
    { key: "negotiation", name: "Negociação", order: 4, color: "#EC4899" },
    { key: "closed-won", name: "Ganho", order: 5, color: "#10B981" },
    { key: "closed-lost", name: "Perdido", order: 6, color: "#EF4444" },
  ];

  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { id: `00000000-0000-0000-0000-00000000002${stage.order}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000002${stage.order}`,
        pipelineId: pipeline.id,
        name: stage.name,
        key: stage.key,
        order: stage.order,
        color: stage.color,
      },
    });
  }
  console.log(`  Pipeline: ${pipeline.name} (${stages.length} stages)`);

  // ── Synthetic Leads ───────────────────────────────────────────────────────
  const syntheticLeads = [
    { name: "Ana Silva (Synthetic)", email: "ana.silva@synthetic.longevity.pt", source: LeadSource.WEBSITE },
    { name: "Carlos Santos (Synthetic)", email: "carlos.santos@synthetic.longevity.pt", source: LeadSource.REFERRAL },
    { name: "Maria Oliveira (Synthetic)", email: "maria.oliveira@synthetic.longevity.pt", source: LeadSource.SOCIAL_MEDIA },
  ];

  for (const lead of syntheticLeads) {
    await prisma.lead.upsert({
      where: { email: lead.email },
      update: {},
      create: {
        name: lead.name,
        email: lead.email,
        source: lead.source,
        status: LeadStatus.NEW,
        score: 0,
        organizationId: org.id,
        metadata: { synthetic: true, source: "staging-seed" },
      },
    });
  }
  console.log(`  Leads: ${syntheticLeads.length} synthetic leads created`);

  // ── Synthetic Customers ───────────────────────────────────────────────────
  const leadForCustomer = await prisma.lead.findFirst({
    where: { email: "ana.silva@synthetic.longevity.pt" },
  });

  if (leadForCustomer) {
    await prisma.lead.update({
      where: { id: leadForCustomer.id },
      data: { status: "CONVERTED" as LeadStatus },
    });

    await prisma.customer.upsert({
      where: { id: "00000000-0000-0000-0000-000000000100" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000100",
        leadId: leadForCustomer.id,
        organizationId: org.id,
        status: CustomerStatus.ONBOARDING,
        metadata: { synthetic: true, source: "staging-seed" },
      },
    });
    console.log("  Customer: 1 synthetic customer created");
  }

  console.log("✅ Staging seed completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Staging seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
