import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authDomainForHost } from "../src/data/authDomain";

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({})),
  getAuth: vi.fn(() => ({})),
  popup: vi.fn(),
  redirect: vi.fn(),
  result: vi.fn(),
}));
vi.mock("firebase/app", () => ({ initializeApp: sdk.initializeApp }));
vi.mock("firebase/auth", () => ({
  getAuth: sdk.getAuth,
  GoogleAuthProvider: class {},
  signInWithPopup: sdk.popup,
  signInWithRedirect: sdk.redirect,
  getRedirectResult: sdk.result,
  signOut: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentSingleTabManager: vi.fn(),
  terminate: vi.fn(),
  clearIndexedDbPersistence: vi.fn(),
}));

function browser(userAgent: string, standalone = false, touchPoints = 0) {
  vi.stubGlobal("navigator", { userAgent, maxTouchPoints: touchPoints });
  vi.stubGlobal("window", {
    location: { hostname: "sample.web.app" },
    matchMedia: () => ({ matches: standalone }),
  });
}
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sdk.popup.mockReset().mockResolvedValue({});
  sdk.redirect.mockReset().mockResolvedValue(undefined);
  sdk.result.mockReset().mockResolvedValue(null);
  vi.stubEnv("VITE_FIREBASE_API_KEY", "test-key");
  vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "sample.firebaseapp.com");
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "sample");
  vi.stubEnv("VITE_FIREBASE_APP_ID", "test-app");
  browser("Desktop Chrome");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Google sign-in storage boundaries", () => {
  it("keeps the auth helper on the actual Firebase Hosting origin", () => {
    expect(
      authDomainForHost("sample", "sample.firebaseapp.com", "sample.web.app"),
    ).toBe("sample.web.app");
    expect(
      authDomainForHost("sample", "sample.web.app", "sample.firebaseapp.com"),
    ).toBe("sample.firebaseapp.com");
    expect(authDomainForHost("sample", "login.example.com", "localhost")).toBe(
      "login.example.com",
    );
    expect(
      authDomainForHost("sample", "login.example.com", "other.web.app"),
    ).toBe("login.example.com");
  });
  it("initializes the SDK with the app's own auth domain even with the old environment value", async () => {
    await import("../src/data/firebase");
    expect(sdk.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ authDomain: "sample.web.app" }),
    );
  });
  it.each([
    ["Mozilla/5.0 (Linux; Android 16) Chrome/140", false, 5],
    ["Mozilla/5.0 (iPhone) CriOS/140", false, 5],
    ["Mozilla/5.0 (Macintosh) Safari/605", false, 5],
    ["Desktop Chrome", true, 0],
  ])(
    "uses one tab for %s (standalone=%s)",
    async (agent, standalone, touches) => {
      browser(agent, standalone, touches);
      const { login } = await import("../src/data/firebase");
      await login();
      expect(sdk.redirect).toHaveBeenCalledOnce();
      expect(sdk.popup).not.toHaveBeenCalled();
    },
  );
  it("retains desktop popup sign-in", async () => {
    const { login } = await import("../src/data/firebase");
    await login();
    expect(sdk.popup).toHaveBeenCalledOnce();
    expect(sdk.redirect).not.toHaveBeenCalled();
  });
  it("recovers a blocked popup with same-tab sign-in, but respects a dismissed popup", async () => {
    const { login } = await import("../src/data/firebase");
    sdk.popup.mockRejectedValueOnce({ code: "auth/popup-blocked" });
    await login();
    expect(sdk.redirect).toHaveBeenCalledOnce();
    sdk.redirect.mockClear();
    sdk.popup.mockRejectedValueOnce({ code: "auth/popup-closed-by-user" });
    await expect(login()).rejects.toMatchObject({
      code: "auth/popup-closed-by-user",
    });
    expect(sdk.redirect).not.toHaveBeenCalled();
  });
  it("consumes the redirect result once across repeated effect mounts", async () => {
    const { finishSignIn } = await import("../src/data/firebase");
    await expect(
      Promise.all([finishSignIn(), finishSignIn()]),
    ).resolves.toEqual(["", ""]);
    expect(sdk.result).toHaveBeenCalledOnce();
  });
  it("surfaces a failed return without leaking provider error details", async () => {
    sdk.result.mockRejectedValue(
      new Error("provider state with private detail"),
    );
    const { finishSignIn } = await import("../src/data/firebase");
    await expect(finishSignIn()).resolves.toContain(
      "Please try Continue with Google again",
    );
  });
});
