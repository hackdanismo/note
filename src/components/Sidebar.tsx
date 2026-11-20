import type { Folder, Note } from "../types";
type Props = {
  notes: Note[];
  folders: Folder[];
  activeFolderId: string;
  expandedFolders?: string[];
  activeId: string;
  onSelect: (id: string) => void;
  onFolderSelect: (id: string) => void;
  onNewFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onNew: () => void;
  onRename: (note: Note) => void;
  onDelete: (id: string) => void;
  onMoveNote: (noteId: string, folderId: string) => void;
};
export default function Sidebar({
  notes,
  folders,
  activeFolderId,
  expandedFolders = [],
  activeId,
  onSelect,
  onFolderSelect,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onNew,
  onRename,
  onDelete,
  onMoveNote,
}: Props) {
  const folderTarget = (folderId: string) => ({
    onDragOver: (event: React.DragEvent) => event.preventDefault(),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      const noteId = event.dataTransfer.getData("text/note");
      if (noteId) onMoveNote(noteId, folderId);
    },
  });
  const noteList = (visibleNotes: Note[]) => (
    <div className="note-list">
      {visibleNotes.map((note) => (
        <div
          className={`note-row ${note.id === activeId ? "active" : ""}`}
          draggable
          onDragStart={(event) =>
            event.dataTransfer.setData("text/note", note.id)
          }
          key={note.id}
        >
          <button className="note-select" onClick={() => onSelect(note.id)}>
            <span className="note-dot" />
            <span className="note-name">{note.title || "Untitled note"}</span>
          </button>
          <button
            className="more-button"
            onClick={() => onRename(note)}
            aria-label={`Rename ${note.title}`}
          >
            •••
          </button>
          <button
            className="delete-button"
            onClick={() => onDelete(note.id)}
            aria-label={`Delete ${note.title}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
  const unfiledNotes = notes.filter((note) => !note.folderId);
  return (
    <aside className="sidebar">
      <div className="sidebar-heading">
        <div>
          <span className="eyebrow">Workspace</span>
          <h2>Notes</h2>
        </div>
        <div className="sidebar-actions">
          <button className="icon-button" onClick={onNew} aria-label="New note">
            +
          </button>
          <button
            className="icon-button folder-button"
            onClick={onNewFolder}
            aria-label="New folder"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 6.5h6l2 2h9v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="sidebar-content">
        {unfiledNotes.length > 0 && (
          <section className="sidebar-section unfiled-section">
            <div className="sidebar-section-label">Notes</div>
            {noteList(unfiledNotes)}
          </section>
        )}
        {folders.length > 0 && (
          <section className="sidebar-section folders-section">
            <div className="sidebar-section-label">
              Folders <span>{folders.length}</span>
            </div>
            <div className="folder-list">
              {folders.map((folder) => (
                <div key={folder.id}>
                  <div
                    className={`folder-row ${folder.id === activeFolderId ? "selected" : ""}`}
                    {...folderTarget(folder.id)}
                  >
                    <button
                      onClick={() => onFolderSelect(folder.id)}
                      aria-expanded={expandedFolders.includes(folder.id)}
                    >
                      <span
                        className={`folder-arrow ${expandedFolders.includes(folder.id) ? "open" : ""}`}
                      >
                        ▸
                      </span>
                      <svg
                        className="folder-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3.5 6.5h6l2 2h9v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" />
                      </svg>
                      <span>{folder.name}</span>
                    </button>
                    <span className="folder-actions">
                      <button
                        onClick={() => onRenameFolder(folder)}
                        aria-label={`Rename ${folder.name}`}
                      >
                        •••
                      </button>
                      <button
                        onClick={() => onDeleteFolder(folder)}
                        aria-label={`Delete ${folder.name}`}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  {expandedFolders.includes(folder.id) &&
                    noteList(
                      notes.filter((note) => note.folderId === folder.id),
                    )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <div className="sidebar-footer">
        <span className="status-dot" /> Local workspace
        <br />
        <span>Saved in your browser</span>
      </div>
    </aside>
  );
}
