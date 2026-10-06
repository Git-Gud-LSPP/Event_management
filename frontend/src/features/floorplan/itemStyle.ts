import type { Room } from "./types";
import { KINDS, catOf, kindOf } from "./types";

export const PX_PER_M = 24; // one grid square reads as 1 m of venue

const MARK: Record<string, [string, string]> = {
  IN: ["#E3F1E7", "#2A6E4B"],
  EX: ["#F4DCE6", "#8A2E52"],
  "+": ["#F4DCE6", "#8A2E52"],
  WC: ["#E8EEFD", "#3A4F8A"],
  A: ["#E4F7F9", "#1F5F66"],
};

export type DropPayload = { kind: "item"; type: keyof typeof KINDS } | { kind: "staff"; userId: string };

/** Visual style for one item, shared by the canvas and the palette swatches. */
export function itemStyle(it: Room, staffHere = 0) {
  const k = kindOf(it), cat = catOf(it);
  const s = {
    radius: "6px", bg: "#FFFFFF", border: "1px solid #C4CEC6", fg: "#16231C",
    align: "center", justify: "center", pad: "0", fs: "11px", ff: "inherit", ls: "0",
    label: "", sub: "", subFg: "#5C6A62",
  };
  if (k === "room" || k === "zone") {
    Object.assign(s, {
      align: "flex-start", justify: "flex-start", pad: "10px 12px", fs: "13px", label: it.name,
      sub: `CAP ${it.capacity}${staffHere ? ` · ${staffHere} STAFF` : ""}`,
    });
    if (k === "room") s.bg = it.color;
    else Object.assign(s, { radius: "12px", bg: "rgba(63,138,100,.05)", border: "1.5px dashed #9CCBAE" });
  } else if (k === "stage") {
    Object.assign(s, { bg: "#16231C", border: "0", fg: "#F2F5F1", ff: "var(--font-mono)", ls: ".08em", label: it.name.toUpperCase() });
  } else if (k === "booth") {
    Object.assign(s, { bg: "#F3E7C8", border: "1px solid #E0CF9E", fg: "#6B4E12", fs: "10.5px", label: it.name.replace("Booth ", "B") });
  } else if (cat === "service") {
    Object.assign(s, {
      radius: "8px", bg: "#F6EFD9", border: "1px solid #E5D6A8", fg: "#5E4510", ff: "var(--font-mono)", fs: "10px", ls: ".05em",
      label: KINDS[k].code!, sub: it.width > 90 ? it.name : "", subFg: "#8A6A2A",
    });
  } else {
    const [bg, fg] = MARK[KINDS[k].code!];
    Object.assign(s, { radius: "8px", bg, border: `1.5px solid ${fg}`, fg, ff: "var(--font-mono)", fs: "10px", label: KINDS[k].code! });
  }
  return s;
}
