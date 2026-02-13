import { describe, expect, it } from "vitest";

import { errorResponse, jsonResponse, okResponse } from "./api-response";

describe("jsonResponse", () => {
  it("returns a Response with JSON content-type", async () => {
    const response = jsonResponse({ hello: "world" });
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ hello: "world" });
  });

  it("respects custom status code", () => {
    const response = jsonResponse({ err: true }, 400);
    expect(response.status).toBe(400);
  });

  it("merges custom headers", () => {
    const response = jsonResponse({}, 200, { "X-Custom": "test" });
    expect(response.headers.get("X-Custom")).toBe("test");
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("okResponse", () => {
  it("wraps data in success envelope", async () => {
    const response = okResponse({ columns: ["a"], rows: [[1]] });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      ok: true,
      data: { columns: ["a"], rows: [[1]] },
    });
  });

  it("includes meta when provided", async () => {
    const response = okResponse({ value: 42 }, { took: 15 });
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.meta).toEqual({ took: 15 });
  });

  it("omits meta when not provided", async () => {
    const response = okResponse("data");
    const body = await response.json();
    expect(body).not.toHaveProperty("meta");
  });

  it("respects custom status code", () => {
    const response = okResponse({}, undefined, 201);
    expect(response.status).toBe(201);
  });
});

describe("errorResponse", () => {
  it("wraps error in failure envelope", async () => {
    const response = errorResponse(400, {
      code: "BAD_REQUEST",
      message: "Invalid input",
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      error: { code: "BAD_REQUEST", message: "Invalid input" },
    });
  });

  it("returns 500 for server errors", async () => {
    const response = errorResponse(500, {
      code: "INTERNAL",
      message: "Something broke",
    });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INTERNAL");
  });
});
