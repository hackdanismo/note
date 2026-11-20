import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import MarkdownPreview from './components/MarkdownPreview'
import { loadNotes, saveNotes } from './utils/storage'
import { exportMarkdown } from './utils/exportMarkdown'
import type { Note } from './types'

const now = () => new Date().toISOString()
function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [activeId, setActiveId] = useState(() => loadNotes()[0]?.id || '')
  const [saveStatus, setSaveStatus] = useState('Saved locally')
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const active = useMemo(() => notes.find(n => n.id === activeId) || notes[0], [notes, activeId])
  useEffect(() => { saveNotes(notes) }, [notes])
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); createNote() } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) })
  function update(patch: Partial<Note>) { if (!active) return; setSaveStatus('Saving…'); setNotes(items => items.map(n => n.id === active.id ? { ...n, ...patch, updatedAt: now() } : n)); window.setTimeout(() => setSaveStatus('Saved locally'), 350) }
  function createNote() { const note: Note = { id: crypto.randomUUID(), title: 'Untitled note', content: '# Untitled note\n\nStart writing your documentation here.\n', createdAt: now(), updatedAt: now() }; setNotes(items => [note, ...items]); setActiveId(note.id) }
  function rename(note: Note) { const title = window.prompt('Rename note', note.title); if (title?.trim()) setNotes(items => items.map(n => n.id === note.id ? { ...n, title: title.trim(), updatedAt: now() } : n)) }
  function remove(id: string) { if (notes.length === 1) return window.alert('Keep at least one note in your workspace.'); if (window.confirm('Delete this note? This cannot be undone.')) { const next = notes.filter(n => n.id !== id); setNotes(next); if (id === activeId) setActiveId(next[0].id) } }
  if (!active) return null
  return <div className="app-shell"><header className="app-header"><div className="brand"><div className="brand-mark">✦</div><div><h1>DevNotes</h1><p>Markdown workspace</p></div></div><div className="header-meta"><span className="keyboard-hint">⌘ K</span><span className="avatar">DJ</span></div></header><div className="workspace"><Sidebar notes={notes} activeId={active.id} onSelect={setActiveId} onNew={createNote} onRename={rename} onDelete={remove} /><main className="main-area"><Toolbar note={active} saveStatus={saveStatus} onSave={() => { saveNotes(notes); setSaveStatus('Saved locally') }} onExport={() => exportMarkdown(active)} mobileView={mobileView} setMobileView={setMobileView} /><div className="panels"><section className={`editor-panel ${mobileView === 'preview' ? 'mobile-hidden' : ''}`}><div className="panel-label"><span>Markdown</span><span className="language-label">GFM enabled</span></div><input className="title-input" value={active.title} onChange={e => update({ title: e.target.value })} aria-label="Note title" /><textarea className="editor" value={active.content} onChange={e => update({ content: e.target.value })} spellCheck={false} aria-label="Markdown editor" /></section><section className={`preview-panel ${mobileView === 'edit' ? 'mobile-hidden' : ''}`}><div className="panel-label"><span>Preview</span><span className="live-badge"><span className="live-dot" /> Live</span></div><MarkdownPreview content={active.content} /></section></div></main></div></div>
}
export default App
