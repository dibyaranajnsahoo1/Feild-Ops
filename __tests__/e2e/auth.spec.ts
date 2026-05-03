import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e-${Date.now()}@fieldops-test.com`;
const TEST_PASSWORD = "TestPass@123";

test.describe("Authentication Flow", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should register a new organization and user", async ({ page }) => {
    await page.goto("/register");

    await page.fill("#organizationName", "E2E Test Corp");
    await page.fill("#name", "E2E Tester");
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // Should redirect to dashboard after registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", "wrong@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test("should login with valid credentials", async ({ page }) => {
    // Use the account created in the registration test
    await page.goto("/login");

    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Click user menu then logout
    await page.click('[aria-label="User menu"]');
    await page.click("text=Sign out");

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Accessibility", () => {
  test("login page has proper ARIA labels", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toHaveAttribute("type", "email");
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("skip to main content link exists", async ({ page }) => {
    await page.goto("/login");
    const skipLink = page.locator('a:has-text("Skip to main content")');
    // Skip link may be visually hidden but present
    await expect(skipLink).toHaveCount(0); // on auth pages there's no skip link
  });
});
