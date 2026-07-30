import { bootstrapApp, teardownApp, TestContext } from "./helpers";

describe("Auth (E2E)", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await bootstrapApp();
  });

  afterAll(async () => {
    await teardownApp(ctx);
  });

  it("POST /api/v1/auth/login succeeds with valid credentials", async () => {
    const res = await ctx.http
      .post("/api/v1/auth/login")
      .send({ email: "admin-a@test.local", password: "test-password-123" });
    expect(res.status).toBe(200);
    const data = res.body.data || res.body;
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user.email).toBe("admin-a@test.local");
  });

  it("POST /api/v1/auth/login fails with invalid password", async () => {
    const res = await ctx.http
      .post("/api/v1/auth/login")
      .send({ email: "admin-a@test.local", password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/auth/login fails with non-existent user", async () => {
    const res = await ctx.http
      .post("/api/v1/auth/login")
      .send({ email: "nonexistent@test.local", password: "test-password-123" });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/auth/register creates new user", async () => {
    const res = await ctx.http.post("/api/v1/auth/register").send({
      email: "newuser@test.local",
      password: "test-password-123",
      name: "New User",
    });
    expect(res.status).toBe(201);
    const data = res.body.data || res.body;
    expect(data.accessToken).toBeDefined();
    expect(data.user.email).toBe("newuser@test.local");
  });

  it("POST /api/v1/auth/register rejects duplicate email", async () => {
    const res = await ctx.http.post("/api/v1/auth/register").send({
      email: "newuser@test.local",
      password: "test-password-123",
      name: "Duplicate User",
    });
    expect(res.status).toBe(409);
  });

  it("POST /api/v1/auth/refresh returns new tokens", async () => {
    const loginRes = await ctx.http
      .post("/api/v1/auth/login")
      .send({ email: "admin-a@test.local", password: "test-password-123" });

    const refreshBody = loginRes.body.data || loginRes.body;
    const res = await ctx.http
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: refreshBody.refreshToken });
    expect(res.status).toBe(200);
    const data = res.body.data || res.body;
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
  });

  it("POST /api/v1/auth/refresh rejects invalid token", async () => {
    const res = await ctx.http
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "invalid-token" });
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/auth/me returns current user", async () => {
    const res = await ctx.http
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${ctx.adminA.token}`);
    expect(res.status).toBe(200);
    const data = res.body.data || res.body;
    expect(data.email).toBe("admin-a@test.local");
  });

  it("GET /api/v1/auth/me fails without token", async () => {
    const res = await ctx.http.get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
