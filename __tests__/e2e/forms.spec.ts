import { test, expect, type Page } from "@playwright/test";

// Shared login helper
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", process.env.E2E_ADMIN_EMAIL ?? "admin@test.com");
  await page.fill("#password", process.env.E2E_ADMIN_PASSWORD ?? "TestPass@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Form Builder", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("navigates to form builder", async ({ page }) => {
    await page.goto("/forms/builder");
    await expect(page.locator("h1")).toContainText("Form Builder");
  });

  test("can add a text field to the form", async ({ page }) => {
    await page.goto("/forms/builder");

    // Click the "Text" field type in the palette
    await page.click('button:has-text("Text"):near(:text("Field Types"))');

    // Field should appear in the canvas
    await expect(page.locator("text=Text Field")).toBeVisible({ timeout: 5000 });
  });

  test("form builder shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/forms/builder");

    // Click save without filling anything
    await page.click('button:has-text("Publish Form")');

    // Should show validation errors
    await expect(page.locator("text=at least one field")).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Forms List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays forms page", async ({ page }) => {
    await page.goto("/forms");
    await expect(page.locator("h1")).toContainText("Forms");
  });

  test("shows create form button for admin", async ({ page }) => {
    await page.goto("/forms");
    await expect(page.locator('a:has-text("New Form")')).toBeVisible();
  });
});

test.describe("Submissions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays submissions page", async ({ page }) => {
    await page.goto("/submissions");
    await expect(page.locator("h1")).toContainText("Submissions");
  });
});

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("analytics page loads for admin", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.locator("h1")).toContainText("Analytics");
  });

  test("has AI insights tab", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.locator('[role="tab"]:has-text("AI Insights")')).toBeVisible();
  });
});
