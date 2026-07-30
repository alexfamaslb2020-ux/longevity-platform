import { bootstrapApp, teardownApp, TestContext } from "./helpers";

describe("Multi-Tenant Isolation (E2E)", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  describe("Leads", () => {
    let leadAId: string;

    it("Org A creates a lead", async () => {
      const res = await ctx.http
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${ctx.adminA.token}`)
        .send({
          name: "Lead A",
          email: "leada@test.local",
          phone: "+351911111111",
        });
      expect(res.status).toBe(201);
      leadAId = res.body.data.id;
    });

    it("Org B cannot list Org A leads", async () => {
      const res = await ctx.http
        .get("/api/v1/leads")
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.data.map((l: any) => l.id);
      expect(ids).not.toContain(leadAId);
    });

    it("Org B cannot get Org A lead by ID", async () => {
      const res = await ctx.http
        .get(`/api/v1/leads/${leadAId}`)
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(404);
    });

    it("Org B cannot update Org A lead", async () => {
      const res = await ctx.http
        .patch(`/api/v1/leads/${leadAId}`)
        .set("Authorization", `Bearer ${ctx.adminB.token}`)
        .send({ name: "Hacked Name" });
      expect(res.status).toBe(404);
    });

    it("Org B cannot delete Org A lead", async () => {
      const res = await ctx.http
        .delete(`/api/v1/leads/${leadAId}`)
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(404);
    });

    it("Org B cannot inject organizationId in payload", async () => {
      const res = await ctx.http
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${ctx.adminB.token}`)
        .send({
          name: "Injected Lead",
          email: "inject@test.local",
          organizationId: ctx.orgA.id,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.organizationId).not.toBe(ctx.orgA.id);
    });
  });

  describe("Customers", () => {
    let customerAId: string;

    it("Org A creates a customer", async () => {
      const leadRes = await ctx.http
        .post("/api/v1/leads")
        .set("Authorization", `Bearer ${ctx.adminA.token}`)
        .send({ name: "Customer Lead", email: "custlead@test.local" });
      const leadId = leadRes.body.data.id;

      const res = await ctx.http
        .post(`/api/v1/leads/${leadId}/convert`)
        .set("Authorization", `Bearer ${ctx.adminA.token}`);
      expect(res.status).toBe(201);
      customerAId = res.body.data.id;
    });

    it("Org B cannot list Org A customers", async () => {
      const res = await ctx.http
        .get("/api/v1/customers")
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.data.map((c: any) => c.id);
      expect(ids).not.toContain(customerAId);
    });

    it("Org B cannot get Org A customer by ID", async () => {
      const res = await ctx.http
        .get(`/api/v1/customers/${customerAId}`)
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Cross-org search and injection", () => {
    it("Org B cannot search Org A leads by email", async () => {
      const res = await ctx.http
        .get("/api/v1/leads?search=leada@test.local")
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(200);
      const emails = res.body.data.data.map((l: any) => l.email);
      expect(emails).not.toContain("leada@test.local");
    });

    it("Org B cannot filter by Org A organizationId", async () => {
      const res = await ctx.http
        .get(`/api/v1/leads?organizationId=${ctx.orgA.id}`)
        .set("Authorization", `Bearer ${ctx.adminB.token}`);
      expect(res.status).toBe(200);
      const orgIds = res.body.data.data.map((l: any) => l.organizationId);
      expect(orgIds.every((id: string) => id === ctx.orgB.id)).toBe(true);
    });
  });
});
