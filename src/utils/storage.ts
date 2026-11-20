import type { Note } from '../types'

const KEY = 'devnotes:notes'
const starter: Note = { id: 'welcome', title: 'Welcome to DevNotes', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: `# Welcome to DevNotes\n\nA focused workspace for writing developer documentation in Markdown.\n\n## Quick start\n\n- Create a note from the sidebar\n- Write Markdown in the editor\n- Watch the preview update as you type\n- Export finished notes as a Markdown file\n\n## Code blocks\n\n~~~typescript\nconst greeting = 'Ship something useful.'\nconsole.log(greeting)\n~~~\n\n> Keep your docs close to the code.\n` }

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return [starter]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [starter]
    const valid = parsed.filter((n): n is Note => n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.content === 'string')
    return valid.length ? valid : [starter]
  } catch { return [starter] }
}

export function saveNotes(notes: Note[]) { try { localStorage.setItem(KEY, JSON.stringify(notes)) } catch { /* storage may be unavailable */ } }
