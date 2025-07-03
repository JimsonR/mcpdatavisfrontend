import 'highlight.js/styles/github.css'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling for code blocks
          code({ className, children, ...props }: any) {
            return (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            )
          },
          pre({ children }: any) {
            return (
              <pre className="bg-gray-100 rounded p-3 overflow-x-auto my-2">
                {children}
              </pre>
            )
          },
          // Custom styling for other elements
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 my-2">
                {children}
              </blockquote>
            )
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }: any) {
            return <thead className="bg-gray-50">{children}</thead>
          },
          th({ children }: any) {
            return (
              <th className="border border-gray-300 px-3 py-2 text-left font-medium">
                {children}
              </th>
            )
          },
          td({ children }: any) {
            return (
              <td className="border border-gray-300 px-3 py-2">
                {children}
              </td>
            )
          },
          ul({ children }: any) {
            return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          },
          ol({ children }: any) {
            return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          },
          h1({ children }: any) {
            return <h1 className="text-xl font-bold my-3">{children}</h1>
          },
          h2({ children }: any) {
            return <h2 className="text-lg font-bold my-2">{children}</h2>
          },
          h3({ children }: any) {
            return <h3 className="text-base font-bold my-2">{children}</h3>
          },
          p({ children }: any) {
            return <p className="my-1">{children}</p>
          },
          a({ href, children }: any) {
            return (
              <a 
                href={href} 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
