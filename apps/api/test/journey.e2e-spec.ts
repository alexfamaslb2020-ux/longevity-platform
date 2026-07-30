import { bootstrapApp, teardownApp, TestContext } from "./helpers";

describe("Main Journey (E2E)", () => {
  let ctx: TestContext;
  let leadId: string;
  let customerId: string;
  let checkinId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  it("1. Create organization and admin (via helpers)", () => {
    expect(ctx.orgA.id).toBeDefined();
    expect(ctx.adminA.token).toBeDefined();
  });

  it("2. Create a lead", async () => {
    const res = await ctx.http
      .post("/api/v1/leads")
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({
        name: "João Silva",
        email: "joao.jornada@test.local",
        phone: "+351911111199",
        source: "WEBSITE",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("João Silva");
    expect(res.body.data.status).toBe("NEW");
    leadId = res.body.data.id;
  });

  it("3. List leads shows the created lead", async () => {
    const res = await ctx.http
      .get("/api/v1/leads")
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(200);
    const lead = res.body.data.data.find((l: any) => l.id === leadId);
    expect(lead).toBeDefined();
  });

  it("4. Update lead stage", async () => {
    const res = await ctx.http
      .patch(`/api/v1/leads/${leadId}`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({ status: "QUALIFYING" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("QUALIFYING");
  });

  it("5. Convert lead to customer", async () => {
    const res = await ctx.http
      .post(`/api/v1/leads/${leadId}/convert`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(201);
    customerId = res.body.data.id;
  });

  it("6. Converted lead returns BAD_REQUEST on second conversion", async () => {
    const res = await ctx.http
      .post(`/api/v1/leads/${leadId}/convert`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(400);
  });

  it("7. Get customer details", async () => {
    const res = await ctx.http
      .get(`/api/v1/customers/${customerId}`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(customerId);
  });

  it("8. Create a check-in for the customer", async () => {
    const res = await ctx.http
      .post("/api/v1/checkins")
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({
        customerId,
        type: "daily",
        channel: "WHATSAPP",
        scheduledAt: new Date().toISOString(),
      });
    expect(res.status).toBe(201);
    checkinId = res.body.data.id;
  });

  it("9. Complete the check-in", async () => {
    const res = await ctx.http
      .post(`/api/v1/checkins/${checkinId}/complete`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({
        responses: {
          energy: 3,
          sleep: 4,
          stress: 2,
          mood: 4,
          adherence: 5,
          satisfaction: 4,
          dropout_intention: false,
          request_contact: false,
        },
      });
    expect(res.status).toBe(201);
  });

  it("10. Customer belongs to correct organization", async () => {
    const res = await ctx.http
      .get(`/api/v1/customers/${customerId}`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.body.data.organizationId).toBe(ctx.orgA.id);
  });

  it("11. Org B cannot access Org A customer", async () => {
    const res = await ctx.http
      .get(`/api/v1/customers/${customerId}`)
      .set("Authorization", `Bearer ${ctx.adminB.token}`);
    expect(res.status).toBe(404);
  });

  it("12. Org B cannot access Org A lead", async () => {
    const res = await ctx.http
      .get(`/api/v1/leads/${leadId}`)
      .set("Authorization", `Bearer ${ctx.adminB.token}`);
    expect(res.status).toBe(404);
  });
});
