describe("ApiClient", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("configures base URL from env", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://test.api/v1";
    const { api } = require("./api");
    expect(api).toBeDefined();
  });

  it("stores and retrieves auth token", () => {
    const { api } = require("./api");
    api.setToken("test-token");
    expect(api.getToken()).toBe("test-token");
  });

  it("persists token to localStorage", () => {
    const { api } = require("./api");
    api.setToken("test-token");
    expect(localStorage.getItem("auth_token")).toBe("test-token");
  });

  it("clears token on setToken(null)", () => {
    const { api } = require("./api");
    api.setToken("test-token");
    api.setToken(null);
    expect(api.getToken()).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("builds correct endpoint URLs", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://test.api/v1";
    const { api } = require("./api");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "1" } }),
    });

    const result = await api.get("/test");
    expect(fetch).toHaveBeenCalledWith(
      "http://test.api/v1/test",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({ id: "1" });
  });

  it("includes auth header when token is set", async () => {
    const { api } = require("./api");
    api.setToken("my-jwt");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    });

    await api.get("/secure");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-jwt" }),
      }),
    );
  });

  it("throws on non-ok response", async () => {
    const { api } = require("./api");
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
    });

    await expect(api.get("/auth")).rejects.toEqual(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("supports query parameters", async () => {
    const { api } = require("./api");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await api.get("/items", { page: "1", search: "test" });
    const calledUrl = (fetch as jest.Mock).mock.calls[0][0];
    expect(calledUrl).toContain("page=1");
    expect(calledUrl).toContain("search=test");
  });

  it("handles POST with JSON body", async () => {
    const { api } = require("./api");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "new" } }),
    });

    const body = { name: "Test" };
    await api.post("/items", body);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
  });

  it("handles PUT requests", async () => {
    const { api } = require("./api");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "updated" } }),
    });

    const result = await api.put("/items/1", { name: "Updated" });
    expect(result).toEqual({ id: "updated" });
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("handles DELETE requests", async () => {
    const { api } = require("./api");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    const result = await api.delete("/items/1");
    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("recovers token from localStorage", () => {
    localStorage.setItem("auth_token", "stored-token");
    const { api } = require("./api");
    expect(api.getToken()).toBe("stored-token");
  });
});
