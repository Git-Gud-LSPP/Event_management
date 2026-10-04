import { expect, test } from "vitest";
import { recommendPlan } from "./catalog";
import { addModule, freeSlots, hasModule, readWorkspace, saveWorkspace, swapModule } from "./plan";

const base = { cycle: "monthly" as const, renewsAt: "2099-01-01" };

test("recommended plan follows add-on count", () => {
  expect(recommendPlan([])).toBe("free");
  expect(recommendPlan(["vendors", "incidents", "floor-plan"])).toBe("starter");
  expect(recommendPlan(Array(6).fill("x"))).toBe("growth");
  expect(recommendPlan(Array(21).fill("x"))).toBe("enterprise");
  expect(recommendPlan(["sso-saml"])).toBe("enterprise");
});

test("entitlements", () => {
  expect(hasModule({ ...base, plan: "free", addOns: [] }, "events")).toBe(true);
  expect(hasModule({ ...base, plan: "free", addOns: ["vendors"] }, "vendors")).toBe(false);
  expect(hasModule({ ...base, plan: "enterprise", addOns: [] }, "audit-log")).toBe(true);
  expect(hasModule({ ...base, plan: "growth", addOns: ["audit-log"] }, "audit-log")).toBe(false);
  // After a downgrade only the first `slots` add-ons stay active; the rest are locked, not deleted.
  const six = ["a", "b", "c", "d", "e", "vendors"];
  expect(hasModule({ ...base, plan: "starter", addOns: six }, "vendors")).toBe(false);
  expect(freeSlots({ ...base, plan: "starter", addOns: six })).toBe(0);
});

test("swap lands in an active slot; add respects the limit", () => {
  saveWorkspace({ ...base, plan: "starter", addOns: ["a", "b", "c", "d", "e", "vendors"] });
  swapModule("a", "vendors");
  expect(readWorkspace().addOns).toEqual(["vendors", "b", "c", "d", "e"]);
  expect(hasModule(readWorkspace(), "vendors")).toBe(true);
  addModule("incidents");
  expect(readWorkspace().addOns).not.toContain("incidents");
});

test("expired trial falls back to Free", () => {
  saveWorkspace({ ...base, plan: "starter", addOns: ["vendors"], trialEndsAt: "2000-01-01" });
  expect(readWorkspace().plan).toBe("free");
  expect(hasModule(readWorkspace(), "vendors")).toBe(false);
  expect(readWorkspace().addOns).toEqual(["vendors"]); // kept for when they upgrade
});
