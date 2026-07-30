import { bootstrapApp, teardownApp, TestContext } from "./helpers";

describe("Health (E2E)", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  it("GET /api/v1/health returns ok", async () => {
    const res = await ctx.http.get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  it("GET /api/v1/health/live returns alive", async () => {
    const res = await ctx.http.get("/api/v1/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("alive");
  });

  it("GET /api/v1/health/ready returns status with checks", async () => {
    const res = await ctx.http.get("/api/v1/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.database).toBeDefined();
  });
});
