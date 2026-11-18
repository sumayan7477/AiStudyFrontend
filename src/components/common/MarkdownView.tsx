import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewProps {
    content: string;
}

/**
 * Renders AI-generated Markdown (GitHub-flavoured: tables, task lists, strikethrough).
 * Security: raw HTML in the Markdown is never rendered (skipHtml), and react-markdown's default
 * URL filter removes unsafe link targets such as javascript: URLs.
 * Styling: Tailwind classes per element (the project has no typography plugin).
 */
const components: Components = {
    h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-bold first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold first:mt-0">{children}</h3>,
    h4: ({ children }) => <h4 className="mb-2 mt-4 font-semibold first:mt-0">{children}</h4>,
    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline break-words">
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-4 border-l-4 border-indigo-200 pl-4 italic text-gray-600">{children}</blockquote>
    ),
    hr: () => <hr className="my-6 border-gray-200" />,
    pre: ({ children }) => (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">{children}</pre>
    ),
    code: ({ className, children }) => {
        // Fenced blocks carry a language-* class (or contain newlines); inline code gets a chip style.
        const isBlock = /language-/.test(className ?? "") || String(children).includes("\n");
        return isBlock
            ? <code className={className}>{children}</code>
            : <code className="rounded bg-gray-100 px-1 py-0.5 text-sm text-gray-800 break-words">{children}</code>;
    },
    table: ({ children }) => (
        <div className="mb-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    th: ({ children }) => <th className="border bg-gray-50 px-3 py-2 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border px-3 py-2 align-top">{children}</td>,
    img: ({ alt }) => <span className="italic text-gray-500">[image: {alt || "not shown"}]</span>,
};

const MarkdownView = ({ content }: MarkdownViewProps) => {
    return (
        <div className="min-w-0 break-words text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownView;
