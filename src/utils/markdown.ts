/**
 * Short plain-text preview of Markdown content (for list views).
 * Removes code blocks, images, link targets, HTML tags and Markdown symbols.
 */
export function markdownPreview(markdown: string, maxLength = 160): string {
    const text = markdown
        .replace(/```[\s\S]*?```/g, " ")              // fenced code
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")         // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")       // links -> text
        .replace(/<[^>]+>/g, " ")                      // HTML tags
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "") // headings, quotes, list markers
        .replace(/[*_~`|]/g, "")                        // emphasis, code, table pipes
        .replace(/^\s*-{3,}\s*$/gm, " ")                // horizontal rules / table separators
        .replace(/\s+/g, " ")
        .trim();

    return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}
