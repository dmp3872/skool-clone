import { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Heading2,
  Eye,
  EyeOff,
  Minus,
} from 'lucide-react';
import { formatContent } from '../../lib/contentFormatter';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function RichTextEditor({ value, onChange, placeholder, rows = 8 }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert markdown formatting at cursor position
  function insertFormatting(before: string, after: string = '', placeholder: string = '') {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText =
      value.substring(0, start) +
      before +
      textToInsert +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  // Insert text at start of line
  function insertAtLineStart(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find line start
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);

    // Check if line already has the prefix
    if (line.trimStart().startsWith(prefix)) {
      // Remove prefix
      const newLine = line.replace(new RegExp(`^\\s*${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '');
      const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd === -1 ? value.length : lineEnd);
      onChange(newText);
    } else {
      // Add prefix
      const newText = value.substring(0, lineStart) + prefix + ' ' + line.trimStart() + value.substring(lineEnd === -1 ? value.length : lineEnd);
      onChange(newText);
    }

    setTimeout(() => textarea.focus(), 0);
  }

  // Insert link
  function insertLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const url = prompt('Enter URL:', 'https://');
    if (!url) return;

    const linkText = selectedText || prompt('Enter link text:', 'link text') || 'link';
    const markdown = `[${linkText}](${url})`;

    const newText =
      value.substring(0, start) +
      markdown +
      value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + markdown.length, start + markdown.length);
    }, 0);
  }

  const toolbarButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertFormatting('**', '**', 'bold text'),
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertFormatting('*', '*', 'italic text'),
      shortcut: 'Ctrl+I',
    },
    {
      icon: Heading2,
      label: 'Heading',
      action: () => insertAtLineStart('##'),
      shortcut: '',
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertAtLineStart('-'),
      shortcut: '',
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertAtLineStart('1.'),
      shortcut: '',
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => insertAtLineStart('>'),
      shortcut: '',
    },
    {
      icon: Code,
      label: 'Code',
      action: () => insertFormatting('`', '`', 'code'),
      shortcut: '',
    },
    {
      icon: LinkIcon,
      label: 'Link',
      action: insertLink,
      shortcut: 'Ctrl+K',
    },
    {
      icon: Minus,
      label: 'Horizontal Line',
      action: () => insertFormatting('\n---\n'),
      shortcut: '',
    },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap">
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="p-2 hover:bg-gray-200 rounded transition-colors group relative"
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            >
              <Icon size={18} className="text-gray-700" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {button.label}
              </span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`p-2 rounded transition-colors flex items-center gap-2 ${
            showPreview ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title={showPreview ? 'Hide Preview' : 'Show Preview'}
        >
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="text-sm font-medium hidden sm:inline">
            {showPreview ? 'Edit' : 'Preview'}
          </span>
        </button>
      </div>

      {/* Editor/Preview */}
      {showPreview ? (
        <div className="p-4 min-h-[200px] bg-white prose max-w-none">
          <div
            className="formatted-content"
            dangerouslySetInnerHTML={{ __html: formatContent(value) }}
          />
          {!value && (
            <p className="text-gray-400 italic">Nothing to preview yet. Start typing to see formatted content.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      )}

      {/* Help Text */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><strong>**bold**</strong></span>
          <span><em>*italic*</em></span>
          <span>[link](url)</span>
          <span>`code`</span>
          <span>## heading</span>
          <span>&gt; quote</span>
          <span>- list</span>
        </div>
      </div>
    </div>
  );
}
