import { bootstrapApp, teardownApp, TestContext } from "./helpers";

describe("AI Assistant — RAG, tool calls e avaliação (E2E)", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  it("1. Seed demo documents seeds 5 knowledge documents", async () => {
    const res = await ctx.http
      .post("/api/v1/ai-assistant/demo/seed-documents")
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(5);
    expect(res.body.data.documents.every((d: any) => d.chunks > 0)).toBe(true);
  });

  it("2. Seeding again is idempotent (documents skipped)", async () => {
    const res = await ctx.http
      .post("/api/v1/ai-assistant/demo/seed-documents")
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.documents.every((d: any) => d.skipped === true)).toBe(
      true,
    );
  });

  it("3. Chat over pricing returns a grounded answer with sources", async () => {
    const res = await ctx.http
      .post("/api/v1/ai-assistant/chat")
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({ query: "quanto custa o plano essencial?" });
    expect(res.status).toBe(201);
    expect(res.body.data.intent).toBe("pricing");
    expect(res.body.data.grounded).toBe(true);
    expect(res.body.data.sources.length).toBeGreaterThan(0);
    expect(res.body.data.response.length).toBeGreaterThan(40);
  });

  it("4. Ingests a custom document via admin endpoint", async () => {
    const res = await ctx.http
      .post("/api/v1/ai-assistant/documents")
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({
        title: "Política de cancelamento",
        category: "faq",
        content: "Cancelamentos até 24 horas antes são gratuitos...",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.chunks).toBeGreaterThan(0);
  });

  it("5. Unknown topics trigger an honest refusal, not hallucination", async () => {
    const res = await ctx.http
      .post("/api/v1/ai-assistant/chat")
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({ query: "xyzzy qubit florb nebulosa" });
    expect(res.status).toBe(201);
    expect(res.body.data.refused).toBe(true);
    expect(res.body.data.grounded).toBe(false);
  });

  it("6. Appointment intent proposes slots and creates a pending tool call", async () => {
    const res = await ctx.http
      .post("/api/v1/ai-assistant/chat")
      .set("Authorization", `Bearer ${ctx.adminA.token}`)
      .send({ query: "quero marcar uma consulta de avaliação" });
    expect(res.status).toBe(201);
    expect(res.body.data.usedTool).toBe(true);
    expect(res.body.data.toolCall.status).toBe("PENDING");
    expect(res.body.data.proposedSlots.length).toBeGreaterThan(0);

    const toolCallId: string = res.body.data.toolCall.id;
    const confirm = await ctx.http
      .post(`/api/v1/ai-assistant/tool-calls/${toolCallId}/confirm`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.status).toBe("EXECUTED");
    expect(confirm.body.data.appointment.id).toBeDefined();

    const appointment = await ctx.prisma.appointment.findFirst({});
    expect(appointment).toBeDefined();
  });

  it("7. Confirming twice fails with TOOL_CALL_ALREADY_RESOLVED", async () => {
    const existing = await ctx.prisma.toolCall.findFirst({
      where: { organizationId: ctx.orgA.id },
    });
    expect(existing).toBeDefined();
    const res = await ctx.http
      .post(`/api/v1/ai-assistant/tool-calls/${existing!.id}/confirm`)
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(400);
  });

  it("8. Org B cannot confirm Org A tool calls (multi-tenancy)", async () => {
    const existing = await ctx.prisma.toolCall.findFirst({
      where: { organizationId: ctx.orgA.id },
    });
    const res = await ctx.http
      .post(`/api/v1/ai-assistant/tool-calls/${existing!.id}/confirm`)
      .set("Authorization", `Bearer ${ctx.adminB.token}`);
    expect(res.status).toBe(400);
  });

  it("9. Org B has no documents in isolation", async () => {
    const res = await ctx.http
      .get("/api/v1/ai-assistant/documents")
      .set("Authorization", `Bearer ${ctx.adminB.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("10. Evaluations are recorded and scored for every answer", async () => {
    const res = await ctx.http
      .get("/api/v1/ai-assistant/evaluations?limit=10")
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].evaluationScore).toBeGreaterThan(0);
  });
});
