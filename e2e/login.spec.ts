import { expect, test } from "@playwright/test";

test("shows the private password login", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /your smartest week starts here/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /open the fantasy desk/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/master password/i)).toBeVisible();
});

test("rejects an incorrect password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/master password/i).fill("wrong-password");
  await page.getByRole("button", { name: /open the fantasy desk/i }).click();

  await expect(page.getByText("Incorrect password", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login\?error=/);
});
