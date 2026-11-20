import type { Note } from "../types";

export function exportMarkdown(note: Note) {
  const filename = `${
    note.title
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "note"
  }.md`;
  const url = URL.createObjectURL(
    new Blob([note.content], { type: "text/markdown;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
