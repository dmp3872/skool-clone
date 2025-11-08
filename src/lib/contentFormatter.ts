/**
 * Content Formatter Utilities
 *
 * Converts markdown-style formatting to HTML with clickable links
 * Sanitizes content to prevent XSS attacks
 */

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Convert markdown-style formatting to HTML
export function formatContent(content: string): string {
  if (!content) return '';

  let formatted = content;

  // Split by code blocks first to avoid formatting code
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];

  formatted = formatted.replace(codeBlockRegex, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Split by inline code to avoid formatting code
  const inlineCodeRegex = /`([^`]+)`/g;
  const inlineCodes: string[] = [];

  formatted = formatted.replace(inlineCodeRegex, (match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600">${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Escape remaining HTML
  formatted = escapeHtml(formatted);

  // Headers (must be at start of line)
  formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h3>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h2>');
  formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

  // Bold (must not be part of a URL)
  formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '<strong class="font-bold">$1</strong>');

  // Italic
  formatted = formatted.replace(/\*([^\*]+)\*/g, '<em class="italic">$1</em>');

  // Strikethrough
  formatted = formatted.replace(/~~([^~]+)~~/g, '<del class="line-through">$1</del>');

  // Blockquotes (must be at start of line)
  formatted = formatted.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 text-gray-700 italic bg-blue-50">$1</blockquote>');

  // Unordered lists
  formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>');
  formatted = formatted.replace(/(<li class="ml-6 list-disc">.*<\/li>\n?)+/g, '<ul class="my-4 space-y-1">$&</ul>');

  // Ordered lists
  formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal">$1</li>');
  formatted = formatted.replace(/(<li class="ml-6 list-decimal">.*<\/li>\n?)+/g, '<ol class="my-4 space-y-1">$&</ol>');

  // Horizontal rules
  formatted = formatted.replace(/^---$/gm, '<hr class="my-6 border-t-2 border-gray-200" />');

  // Links - auto-detect and make clickable
  // Match markdown links: [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

  // Match raw URLs (http, https, www)
  formatted = formatted.replace(
    /(?<!href="|">)(https?:\/\/[^\s<]+|www\.[^\s<]+)/g,
    (url) => {
      const href = url.startsWith('www.') ? `https://${url}` : url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">${url}</a>`;
    }
  );

  // Line breaks (double newline = paragraph, single newline = <br>)
  formatted = formatted.replace(/\n\n/g, '</p><p class="mb-4">');
  formatted = formatted.replace(/\n/g, '<br />');
  formatted = `<p class="mb-4">${formatted}</p>`;

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    formatted = formatted.replace(`__CODE_BLOCK_${i}__`, block);
  });

  // Restore inline code
  inlineCodes.forEach((code, i) => {
    formatted = formatted.replace(`__INLINE_CODE_${i}__`, code);
  });

  return formatted;
}

// Strip all formatting for plain text preview
export function stripFormatting(content: string): string {
  if (!content) return '';

  return content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
    .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .replace(/^[-*]\s+/gm, '') // Remove list markers
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
    .trim();
}
