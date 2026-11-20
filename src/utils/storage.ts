import type { Folder, Note } from "../types";

const KEY = "note:notes";
const FOLDERS_KEY = "note:folders";
const WELCOME_RESET_KEY = "note:welcome-reset-v1";
const DIRECTORY_DB = "note:filesystem";
const DIRECTORY_STORE = "handles";
const starter: Note = {
  id: "welcome",
  title: "Welcome to Note",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  content: `# Welcome to Note\n\nA focused workspace for writing developer documentation in Markdown.\n\n## Quick start\n\n- Create a note from the sidebar\n- Write Markdown in the editor\n- Watch the preview update as you type\n- Export finished notes as a Markdown file\n\n## Code blocks\n\n~~~typescript\nconst greeting = 'Ship something useful.'\nconsole.log(greeting)\n~~~\n\n> Keep your docs close to the code.\n`,
};

export function loadNotes(): Note[] {
  try {
    if (localStorage.getItem(WELCOME_RESET_KEY) !== "done") {
      localStorage.setItem(WELCOME_RESET_KEY, "done");
      localStorage.setItem(KEY, JSON.stringify([starter]));
      return [starter];
    }
    const raw = localStorage.getItem(KEY);
    if (!raw) return [starter];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [starter];
    const valid = parsed.filter(
      (n): n is Note =>
        n &&
        typeof n.id === "string" &&
        typeof n.title === "string" &&
        typeof n.content === "string",
    );
    return valid.length ? valid : [starter];
  } catch {
    return [starter];
  }
}

export function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* storage may be unavailable */
  }
}

export function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (f): f is Folder =>
            f && typeof f.id === "string" && typeof f.name === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function saveFolders(folders: Folder[]) {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    /* storage may be unavailable */
  }
}

function openDirectoryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DIRECTORY_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DIRECTORY_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getDirectoryHandle() {
  try {
    const db = await openDirectoryDatabase();
    return await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
      const request = db.transaction(DIRECTORY_STORE, "readonly").objectStore(DIRECTORY_STORE).get("root");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch { return undefined; }
}

async function rememberDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const db = await openDirectoryDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(DIRECTORY_STORE, "readwrite").objectStore(DIRECTORY_STORE).put(handle, "root");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function noteFromMarkdown(name: string, content: string): Note {
  const titleMatch = content.match(/^#\s+(.+)\s*\r?\n(?:\r?\n)?/);
  const title = titleMatch?.[1].trim() || name.replace(/\.md$/i, "") || "Untitled note";
  return { id: `file-${name}-${content.length}`, title, content: titleMatch ? content.slice(titleMatch[0].length) : content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

async function readMarkdownNotes(directory: FileSystemDirectoryHandle): Promise<Note[]> {
  const notes: Note[] = [];
  for await (const [name, entry] of (directory as any).entries()) {
    if (entry.kind !== "file" || !name.toLowerCase().endsWith(".md")) continue;
    const file = await entry.getFile();
    notes.push(noteFromMarkdown(name, await file.text()));
  }
  return notes;
}

export async function initializeNotesDirectory(): Promise<Note[] | null> {
  const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  if (!picker) return null;
  let parent = await getDirectoryHandle();
  if (!parent) { parent = await picker(); await rememberDirectoryHandle(parent); }
  else {
    const handle = parent as any;
    if (handle.queryPermission && (await handle.queryPermission({ mode: "read" })) !== "granted") await handle.requestPermission({ mode: "read" });
  }
  const notesDirectory = await parent.getDirectoryHandle("notes", { create: true });
  const notes = await readMarkdownNotes(notesDirectory);
  return notes.length ? notes : null;
}

function markdownFilename(note: Note) {
  const title = note.title.trim() || "untitled-note";
  const safeTitle = title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safeTitle || note.id}.md`;
}

export async function saveNotesAsMarkdown(notes: Note[], folders: Folder[]) {
  const picker = (
    window as Window & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker)
    throw new Error("Your browser does not support saving to a local folder.");
  const parent = (await getDirectoryHandle()) || (await picker());
  await rememberDirectoryHandle(parent);
  const notesDirectory = await parent.getDirectoryHandle("notes", {
    create: true,
  });
  const foldersById = new Map(
    folders.map((folder) => [folder.id, folder.name]),
  );

  for (const note of notes) {
    const noteDirectory =
      note.folderId && foldersById.has(note.folderId)
        ? await notesDirectory.getDirectoryHandle(
            foldersById.get(note.folderId)!,
            { create: true },
          )
        : notesDirectory;
    const file = await noteDirectory.getFileHandle(markdownFilename(note), {
      create: true,
    });
    const writable = await file.createWritable();
    await writable.write(
      `# ${note.title || "Untitled note"}\n\n${note.content}`,
    );
    await writable.close();
  }
}

export async function saveImage(file: File) {
  const picker = (
    window as Window & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker)
    throw new Error(
      "Your browser does not support saving images to a local folder.",
    );
  const parent = await picker();
  const imagesDirectory = await parent.getDirectoryHandle("images", {
    create: true,
  });
  const safeName =
    file.name
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || `image-${Date.now()}`;
  const image = await imagesDirectory.getFileHandle(safeName, { create: true });
  const writable = await image.createWritable();
  await writable.write(file);
  await writable.close();
  return `images/${safeName}`;
}
