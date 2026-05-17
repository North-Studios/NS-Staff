import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ZoomableImage } from '@/components/ZoomableImage';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const components: Components = {
    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    a: ({ href, children }) => (
      <a 
        href={href}
        className="hover:underline text-primary" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    code: (props) => {
      const { inline, className: codeClassName, children, ...rest } = props as any;
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground" {...rest}>
            {children}
          </code>
        );
      }
      // For code blocks, return unstyled code - the pre component will handle styling
      return <code className={codeClassName} {...rest}>{children}</code>;
    },
    pre: ({ children }) => {
      return (
        <pre className="mb-4 p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto text-foreground">
          {children}
        </pre>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-4 border-border" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
    th: ({ children }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2">{children}</td>
    ),
    img: ({ src, alt }) =>
      src ? (
        <ZoomableImage
          src={src}
          alt={alt ?? ''}
          className="my-4 h-auto max-w-full rounded-lg"
        />
      ) : null,
  };

  return (
    <div className={cn('max-w-none', className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
