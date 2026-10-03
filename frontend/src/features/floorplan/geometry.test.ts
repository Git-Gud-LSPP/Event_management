import { describe, expect, it } from "vitest";
import { contentBounds, initials, roomAt } from "./geometry";
import type { Room } from "./types";

const room = (id: string, x: number, y: number): Room => ({
  id, name: id, x, y, width: 100, height: 50, capacity: 4, color: "#fff",
});

describe("roomAt", () => {
  const rooms = [room("a", 0, 0), room("b", 200, 0)];

  it("finds the room under the point", () => {
    expect(roomAt(rooms, 50, 25)).toBe("a");
    expect(roomAt(rooms, 250, 25)).toBe("b");
  });

  it("returns null on empty floor space", () => {
    expect(roomAt(rooms, 150, 25)).toBeNull();
    expect(roomAt([], 0, 0)).toBeNull();
  });

  it("includes the edges", () => {
    expect(roomAt(rooms, 0, 0)).toBe("a");
    expect(roomAt(rooms, 100, 50)).toBe("a");
    expect(roomAt(rooms, 101, 50)).toBeNull();
  });

  it("prefers the room drawn on top when they overlap", () => {
    const overlapping = [room("under", 0, 0), room("over", 20, 10)];
    expect(roomAt(overlapping, 50, 25)).toBe("over");
  });
});

describe("initials", () => {
  it("takes the first two words", () => {
    expect(initials("Alice Johnson")).toBe("AJ");
    expect(initials("priya raj patel")).toBe("PR");
  });

  it("survives single names and stray spaces", () => {
    expect(initials("Zara")).toBe("Z");
    expect(initials("  Neha   Gupta ")).toBe("NG");
  });
});

describe("contentBounds", () => {
  it("is null for an empty floor", () => {
    expect(contentBounds([], [])).toBeNull();
  });

  it("wraps every room", () => {
    expect(contentBounds([room("a", 0, 0), room("b", 200, 100)])).toEqual({
      x: 0, y: 0, width: 300, height: 150,
    });
  });

  it("handles negative coordinates", () => {
    expect(contentBounds([room("a", -50, -20)])).toEqual({
      x: -50, y: -20, width: 100, height: 50,
    });
  });

  it("pads around loose staff markers", () => {
    expect(contentBounds([], [{ x: 100, y: 100 }])).toEqual({
      x: 60, y: 60, width: 80, height: 80,
    });
  });
});
