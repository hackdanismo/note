import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import MarkdownPreview from "./components/MarkdownPreview";
import {
  loadFolders,
  loadNotes,
  initializeNotesDirectory,
  saveFolders,
  saveNotes,
  saveNotesAsMarkdown,
  saveImage,
} from "./utils/storage";
import { exportMarkdown } from "./utils/exportMarkdown";
import type { Folder, Note } from "./types";

const now = () => new Date().toISOString();
function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [folders, setFolders] = useState<Folder[]>(loadFolders);
  const [activeFolderId, setActiveFolderId] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [activeId, setActiveId] = useState(
    () =>
      notes.find((note) => note.id === "welcome")?.id ||
      notes[0]?.id ||
      "",
  );
  const [saveStatus, setSaveStatus] = useState("Saved locally");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const active = useMemo(
    () => notes.find((n) => n.id === activeId) || notes[0],
    [notes, activeId],
  );
  useEffect(() => {
    initializeNotesDirectory()
      .then((imported) => { if (imported) setNotes(imported); })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);
  useEffect(() => {
    saveFolders(folders);
  }, [folders]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  function update(patch: Partial<Note>) {
    if (!active) return;
    setSaveStatus("Saving…");
    setNotes((items) =>
      items.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: now() } : n,
      ),
    );
    window.setTimeout(() => setSaveStatus("Saved locally"), 350);
  }
  function createNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled note",
      content: "# Untitled note\n\nStart writing your documentation here.\n",
      createdAt: now(),
      updatedAt: now(),
    };
    setNotes((items) => [note, ...items]);
    setActiveId(note.id);
  }
  function createFolder() {
    const name = window.prompt("New folder name");
    if (name?.trim()) {
      const folder = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: now(),
      };
      setFolders((items) => [...items, folder]);
      setActiveFolderId(folder.id);
      setExpandedFolders((items) => [...items, folder.id]);
    }
  }
  function renameFolder(folder: Folder) {
    const name = window.prompt("Rename folder", folder.name);
    if (name?.trim())
      setFolders((items) =>
        items.map((f) =>
          f.id === folder.id ? { ...f, name: name.trim() } : f,
        ),
      );
  }
  function removeFolder(folder: Folder) {
    if (
      !window.confirm(
        `Delete folder “${folder.name}”? Notes inside will move to Notes.`,
      )
    )
      return;
    setNotes((items) =>
      items.map((note) =>
        note.folderId === folder.id ? { ...note, folderId: undefined } : note,
      ),
    );
    setFolders((items) => items.filter((f) => f.id !== folder.id));
    if (activeFolderId === folder.id) setActiveFolderId("");
  }
  function selectFolder(id: string) {
    setActiveFolderId(id);
    if (id)
      setExpandedFolders((items) =>
        items.includes(id)
          ? items.filter((folderId) => folderId !== id)
          : [...items, id],
      );
    const first = notes
      .filter((note) => (note.folderId || "") === id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (first) setActiveId(first.id);
  }
  function moveNote(noteId: string, folderId: string) {
    setNotes((items) =>
      items.map((note) =>
        note.id === noteId
          ? { ...note, folderId: folderId || undefined, updatedAt: now() }
          : note,
      ),
    );
    setActiveFolderId(folderId);
    if (folderId)
      setExpandedFolders((items) =>
        items.includes(folderId) ? items : [...items, folderId],
      );
  }
  async function addImage(file: File) {
    setSaveStatus("Saving image…");
    try {
      const path = await saveImage(file);
      update({
        content: `${active.content}${active.content.endsWith("\n") ? "" : "\n"}\n![${file.name}](${path})\n`,
      });
      setSaveStatus("Saved locally");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        setSaveStatus(
          error instanceof Error ? error.message : "Image save failed",
        );
    }
  }
  function rename(note: Note) {
    const title = window.prompt("Rename note", note.title);
    if (title?.trim())
      setNotes((items) =>
        items.map((n) =>
          n.id === note.id
            ? { ...n, title: title.trim(), updatedAt: now() }
            : n,
        ),
      );
  }
  function remove(id: string) {
    if (window.confirm("Delete this note? This cannot be undone.")) {
      const next = notes.filter((n) => n.id !== id);
      setNotes(next);
      if (!next.length) setFolders([]);
      if (id === activeId) setActiveId(next[0]?.id || "");
    }
  }
  if (!active) return null;
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            <h1>Note</h1>
            <p>Markdown workspace</p>
          </div>
        </div>
        <div className="header-meta">
          <span className="keyboard-hint">⌘ K</span>
          <span className="avatar">DJ</span>
        </div>
      </header>
      <div className="workspace">
        <Sidebar
          notes={notes}
          folders={folders}
          activeFolderId={activeFolderId}
          expandedFolders={expandedFolders}
          activeId={active.id}
          onSelect={setActiveId}
          onFolderSelect={selectFolder}
          onNewFolder={createFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={removeFolder}
          onNew={createNote}
          onRename={rename}
          onDelete={remove}
          onMoveNote={moveNote}
        />
        <main className="main-area">
          <Toolbar
            note={active}
            saveStatus={saveStatus}
            onAddImage={addImage}
            onSave={async () => {
              saveNotes(notes);
              setSaveStatus("Saving…");
              try {
                await saveNotesAsMarkdown(notes, folders);
                setSaveStatus("Saved to notes");
              } catch (error) {
                if ((error as DOMException).name !== "AbortError")
                  setSaveStatus(
                    error instanceof Error ? error.message : "Save failed",
                  );
              }
            }}
            onExport={() => exportMarkdown(active)}
            mobileView={mobileView}
            setMobileView={setMobileView}
          />
          <div className="panels">
            <section
              className={`editor-panel ${mobileView === "preview" ? "mobile-hidden" : ""}`}
            >
              <div className="panel-label">
                <span>Markdown</span>
                <span className="language-label">GFM enabled</span>
              </div>
              <input
                className="title-input"
                value={active.title}
                onChange={(e) => update({ title: e.target.value })}
                aria-label="Note title"
              />
              <textarea
                className="editor"
                value={active.content}
                onChange={(e) => update({ content: e.target.value })}
                spellCheck={false}
                aria-label="Markdown editor"
              />
            </section>
            <section
              className={`preview-panel ${mobileView === "edit" ? "mobile-hidden" : ""}`}
            >
              <div className="panel-label">
                <span>Preview</span>
                <span className="live-badge">
                  <span className="live-dot" /> Live
                </span>
              </div>
              <MarkdownPreview content={active.content} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
export default App;
