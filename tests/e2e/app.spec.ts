import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { emptyData, starterHabits } from "../../src/domain/model";

async function signIn(page: import("@playwright/test").Page, id: string) {
  await page.waitForFunction(() => "__signInTestUser" in window);
  await page.evaluate(async (uid) => {
    await (
      window as unknown as { __signInTestUser: (id: string) => Promise<void> }
    ).__signInTestUser(uid);
  }, id);
}
async function synced(page: import("@playwright/test").Page) {
  await expect(
    page.getByText("All changes synced", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
}
async function start(page: import("@playwright/test").Page, url = "/") {
  await page.goto(url);
  await expect(
    page.getByRole("button", { name: "Use this device only" }),
  ).toHaveCount(0);
  await signIn(page, randomUUID());
  await page.getByRole("button", { name: "Start with 4 habits" }).click();
  await synced(page);
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
  await synced(page);
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

test("log yesterday for a new habit, undo its earlier start, and retain a numeric backfill on reload", async ({
  page,
}) => {
  await start(page);
  const yesterday = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return new Intl.DateTimeFormat("en-CA").format(date);
  });
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page
    .getByRole("button", {
      name: `Workout, ${yesterday}, Log earlier day`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Saving starts tracking this habit from/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Met", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: `Workout, ${yesterday}, Met`,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: `Workout, ${yesterday}, Log earlier day`,
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: `Sleep, ${yesterday}, Log earlier day`,
      exact: true,
    })
    .click();
  await page.getByRole("textbox", { name: "hours", exact: true }).fill("9");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await synced(page);
  await page.reload();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Sleep, ${yesterday}, Met`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Sleep, ${yesterday}, Met`, exact: true })
    .click();
  await page.getByRole("button", { name: "Clear entry", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: `Sleep, ${yesterday}, Not logged`,
      exact: true,
    }),
  ).toBeVisible();
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

test("choose a searchable icon and curated color, preserve them after reload, and edit them", async ({
  page,
}) => {
  await start(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole("button", { name: "Add habit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Habit name", exact: true })
    .fill("Read every day");
  await page.getByRole("button", { name: "Choose icon", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search icons", exact: true })
    .fill("doesnotexist");
  await expect(page.getByText(/No icons found/)).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search icons", exact: true })
    .fill("reading");
  await page.getByRole("button", { name: "Book icon", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Book icon", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".editor-preview .lucide-book-open")).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Choose icon", exact: true }).click();
  await page.getByRole("button", { name: "Choose color", exact: true }).click();
  await page
    .getByRole("button", { name: "Sea glass color", exact: true })
    .click();
  await expect(page.locator(".editor-preview")).toHaveClass(/teal/);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  for (const swatch of await page.locator(".curated-color-grid button").all()) {
    const box = await swatch.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole("button", { name: "Save habit", exact: true }).click();
  await synced(page);
  await page.reload();
  await page
    .getByRole("button", { name: "Read every day details", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Habit settings", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Choose icon", exact: true }),
  ).toContainText("Book");
  await expect(
    page.getByRole("button", { name: "Choose color", exact: true }),
  ).toContainText("Sea glass");
  await page.getByRole("button", { name: "Choose icon", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search icons", exact: true })
    .fill("leaf");
  await page.getByRole("button", { name: "Leaf icon", exact: true }).click();
  await page.getByRole("button", { name: "Save habit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Read every day details", exact: true }),
  ).toContainText("Not logged today");
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
}) => {
  // Stop the actual origin: WebKit's offline emulation breaks even valid
  // service-worker responses (https://github.com/microsoft/playwright/issues/42775).
  const root = resolve("dist-e2e");
  const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
  };
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    const file = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
      });
      response.end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  const listen = (port: number) =>
    new Promise<void>((done) => server.listen(port, "127.0.0.1", done));
  const stop = () =>
    new Promise<void>((done) => {
      server.close(() => done());
      server.closeAllConnections();
    });
  await listen(0);
  const port = (server.address() as import("node:net").AddressInfo).port;
  try {
    await start(page, `http://127.0.0.1:${port}/`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await synced(page);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await stop();
    await synced(page);
    await page.reload();
    await page
      .getByRole("button", { name: "Complete Workout", exact: true })
      .click();
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    await listen(port);
    await synced(page);
    await page.reload();
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  } finally {
    await stop();
  }
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

test("system theme follows the device while explicit light/dark choices survive reloads", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await start(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".habit-row").first()).toHaveCSS(
    "background-color",
    "rgb(25, 35, 28)",
  );
  await page.getByRole("button", { name: "Log Sleep", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCSS(
    "background-color",
    "rgb(25, 35, 28)",
  );
  await expect(
    page.getByRole("textbox", { name: "hours", exact: true }),
  ).toHaveCSS("color", "rgb(237, 243, 232)");
  await page.getByRole("dialog").press("Escape");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await synced(page);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await synced(page);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#101813",
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "System", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("Google sign-in is required even when an old device-only flag exists, with backup recovery", async ({
  page,
}) => {
  const previous = emptyData();
  previous.habits = starterHabits("2026-01-01");
  previous.settings.onboarded = true;
  await page.addInitScript((raw) => {
    localStorage.setItem("habit-grid.local-mode", "true");
    localStorage.setItem("habit-grid.local.v1", raw);
  }, JSON.stringify(previous));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use this device only" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add habit", exact: true }),
  ).toHaveCount(0);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download previous habits" }).click();
  const downloaded = await downloadEvent;
  expect(
    JSON.parse(await readFile((await downloaded.path())!, "utf8")),
  ).toEqual(previous);
  await signIn(page, randomUUID());
  await expect(
    page.getByRole("button", { name: "Start with 4 habits" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("habit-grid.local.v1")),
  ).toBe(JSON.stringify(previous));
});

test("habits and yesterday's chart sync between separate signed-in devices", async ({
  page,
  browser,
}) => {
  const id = randomUUID();
  await page.goto("/");
  await signIn(page, id);
  await page.getByRole("button", { name: "Start with 4 habits" }).click();
  await synced(page);
  const secondContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const phone = await secondContext.newPage();
    await phone.goto("http://127.0.0.1:4173/");
    await signIn(phone, id);
    await expect(
      phone.getByRole("button", { name: "Workout details" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add habit", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Habit name" })
      .fill("Read across devices");
    await page.getByRole("button", { name: "Save habit" }).click();
    await expect(
      phone.getByRole("button", { name: "Read across devices details" }),
    ).toBeVisible();
    await phone
      .getByRole("button", {
        name: "Complete Read across devices",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Read across devices details" }),
    ).toContainText("Goal met");
    const yesterday = await page.evaluate(() => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return new Intl.DateTimeFormat("en-CA").format(date);
    });
    await page.getByRole("button", { name: "History", exact: true }).click();
    await phone.getByRole("button", { name: "History", exact: true }).click();
    await phone
      .getByRole("button", {
        name: `Workout, ${yesterday}, Log earlier day`,
        exact: true,
      })
      .click();
    await phone.getByRole("button", { name: "Met", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: `Workout, ${yesterday}, Met`,
        exact: true,
      }),
    ).toBeVisible();
    await synced(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add habit", exact: true }),
    ).toHaveCount(0);
  } finally {
    await secondContext.close();
  }
});
