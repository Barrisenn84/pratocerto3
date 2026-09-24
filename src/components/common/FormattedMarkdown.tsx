import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Enterprise-grade lightweight markdown renderer for AI responses.
 * Formats bold text (**text**), lists (- or *), headers (### or **header**),
 * inline tags, line breaks, and emojis cleanly without unparsed markdown noise.
 */
export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const isDark = className.includes('text-slate-200') || className.includes('text-white') || className.includes('dark');

  // Helper to parse inline bolding and backticks
  const renderInline = (text: string) => {
    // Split by bold (**bold**) and inline code (`code`)
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong
            key={index}
            className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {inner}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={index}
            className={`px-1.5 py-0.5 rounded font-mono text-[11px] border ${
              isDark
                ? 'bg-slate-900 text-emerald-300 border-slate-700'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {inner}
          </code>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading (### or ##)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4
              key={idx}
              className={`font-bold text-sm mt-2 mb-1 tracking-tight ${
                isDark ? 'text-emerald-300' : 'text-slate-900'
              }`}
            >
              {renderInline(headingText)}
            </h4>
          );
        }

        // Bullet item (- or * or •)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[-*•]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className={`flex-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {renderInline(bulletText)}
              </div>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={idx} className={isDark ? 'text-slate-200' : 'text-slate-700'}>
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};
