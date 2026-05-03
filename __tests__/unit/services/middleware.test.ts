/**
 * Unit tests for API middleware (auth, rate limiting, sanitization)
 */
import { sanitizeMongoInput, tenantFilter } from "@/middleware/api";
import { hasRole, ROLE_HIERARCHY } from "@/lib/auth/jwt";
import type { Role } from "@/types";

describe("sanitizeMongoInput", () => {
  it("removes $ prefixed keys (MongoDB injection prevention)", () => {
    const input = { name: "test", $where: "1==1", $gt: 100 };
    const result = sanitizeMongoInput(input);
    expect(result).not.toHaveProperty("$where");
    expect(result).not.toHaveProperty("$gt");
    expect(result).toHaveProperty("name", "test");
  });

  it("strips dangerous patterns from string values", () => {
    const input = { comment: "<script>alert('xss')</script>" };
    const result = sanitizeMongoInput(input);
    expect(result.comment).toBe("");
  });

  it("recursively sanitizes nested objects", () => {
    const input = { nested: { $where: "hack", safe: "value" } };
    const result = sanitizeMongoInput(input);
    expect((result.nested as any)["$where"]).toBeUndefined();
    expect((result.nested as any).safe).toBe("value");
  });

  it("preserves valid data unchanged", () => {
    const input = { name: "John", count: 42, active: true };
    const result = sanitizeMongoInput(input);
    expect(result).toEqual(input);
  });
});

describe("RBAC - hasRole", () => {
  const roles: Role[] = ["super_admin", "admin", "manager", "staff"];

  it("should allow super_admin access to all roles", () => {
    for (const role of roles) {
      expect(hasRole("super_admin", role)).toBe(true);
    }
  });

  it("should allow admin access to manager and staff", () => {
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("admin", "manager")).toBe(true);
    expect(hasRole("admin", "staff")).toBe(true);
    expect(hasRole("admin", "super_admin")).toBe(false);
  });

  it("should restrict staff to staff level only", () => {
    expect(hasRole("staff", "staff")).toBe(true);
    expect(hasRole("staff", "manager")).toBe(false);
    expect(hasRole("staff", "admin")).toBe(false);
  });

  it("role hierarchy should be ordered correctly", () => {
    expect(ROLE_HIERARCHY["super_admin"]).toBeGreaterThan(ROLE_HIERARCHY["admin"]);
    expect(ROLE_HIERARCHY["admin"]).toBeGreaterThan(ROLE_HIERARCHY["manager"]);
    expect(ROLE_HIERARCHY["manager"]).toBeGreaterThan(ROLE_HIERARCHY["staff"]);
  });
});

describe("tenantFilter", () => {
  it("returns correct organizationId filter", () => {
    const session = {
      sub: "user-123",
      email: "test@test.com",
      name: "Test",
      role: "admin" as Role,
      organizationId: "org-456",
    };
    const filter = tenantFilter(session);
    expect(filter).toEqual({ organizationId: "org-456" });
  });
});
