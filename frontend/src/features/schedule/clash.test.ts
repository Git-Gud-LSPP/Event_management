import { describe, expect, it } from "vitest";
import { clashFor, type ScheduleItem } from "./api";

const task = (id: string, owner: string, startsAt: string, endsAt?: string, status: ScheduleItem["status"] = "Pending") =>
  ({ _id: id, event: "e", name: id, owner: { _id: owner, name: owner, email: "" }, startsAt, endsAt, status }) as ScheduleItem;

const items = [
  task("a", "ann", "2026-01-01T10:00:00Z", "2026-01-01T11:00:00Z"),
  task("b", "ann", "2026-01-01T13:00:00Z", undefined, "Done"),
  task("c", "bob", "2026-01-01T14:00:00Z"),
];

describe("clashFor", () => {
  it("flags an overlapping unfinished task", () => {
    expect(clashFor(items, "ann", { startsAt: "2026-01-01T10:30:00Z", endsAt: "2026-01-01T12:00:00Z" })?._id).toBe("a");
  });
  it("allows back-to-back slots", () => {
    expect(clashFor(items, "ann", { startsAt: "2026-01-01T11:00:00Z" })).toBeUndefined();
  });
  it("ignores done tasks, other owners, and the task itself", () => {
    expect(clashFor(items, "ann", { startsAt: "2026-01-01T13:00:00Z" })).toBeUndefined();
    expect(clashFor(items, "bob", { startsAt: "2026-01-01T10:30:00Z" })).toBeUndefined();
    expect(clashFor(items, "ann", { _id: "a", startsAt: "2026-01-01T10:30:00Z" })).toBeUndefined();
  });
  it("treats an open-ended task as its start minute", () => {
    expect(clashFor(items, "bob", { startsAt: "2026-01-01T14:00:30Z" })?._id).toBe("c");
  });
});
