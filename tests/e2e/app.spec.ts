import { test, expect } from "@playwright/test";
async function start(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Use this device only" }).click();
  await page.getByRole("button", { name: "Start with 4 habits" }).click();
}
test("daily check-in, undo, numeric target and reload persistence", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Complete Workout", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.getByRole("button", { name: "Log Sleep", exact: true }).click();
  await page.getByRole("textbox", { name: "hours", exact: true }).fill("9");
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
});
test("explicit failure remains separate from an unlogged day", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "No fast food details" }).click();
  await page.getByRole("button", { name: "Not met", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "No fast food details" }),
  ).toContainText("Not met today");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});
test("create a numeric habit and archive it", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Add habit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Habit name" })
    .fill("Read a few pages");
  await page.getByRole("button", { name: "Number", exact: true }).click();
  await page.getByRole("textbox", { name: "Unit", exact: true }).fill("pages");
  await page.getByRole("textbox", { name: "Target", exact: true }).fill("10");
  await page.getByRole("button", { name: "Save habit" }).click();
  await expect(
    page.getByRole("button", { name: "Read a few pages details" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Read a few pages details" }).click();
  await page.getByRole("button", { name: "Habit settings" }).click();
  await page.getByRole("button", { name: "Archive habit" }).click();
  await page.getByRole("button", { name: "Archive habit" }).click();
  await expect(
    page.getByRole("button", { name: "Read a few pages details" }),
  ).toHaveCount(0);
});
test("empty numeric input retains the sheet and shows an error", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Log Sleep" }).click();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Enter a number from 0 to 1,000,000."),
  ).toBeVisible();
});
test("production service worker allows an offline reload and check-in", async ({
  page,
  context,
}) => {
  await start(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Complete Workout", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
});
test("phone widths have no page overflow and generous check-in targets", async ({
  page,
}) => {
  await start(page);
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const button of await page.locator(".check-control").all()) {
      const bounds = await button.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
  }
});
