import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function MarkdownPreview({ content }: { content: string }) {
  return <article className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({ className, children }) { const match = /language-(\w+)/.exec(className || ''); return match ? <SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div">{String(children).replace(/\n$/, '')}</SyntaxHighlighter> : <code className="inline-code">{children}</code> } }}>{content || '*Nothing to preview yet.*'}</ReactMarkdown></article>
}
