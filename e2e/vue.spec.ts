import { expect, test } from "@playwright/test";

test("visits the app root url and lands on onboarding", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("A calm, private sanctuary");
});
