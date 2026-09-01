'use client';

import React from 'react';

export interface RichTextBlockProps {
  markdown: string;
}

/**
 * Tiny safe-subset markdown renderer — headings, paragraphs, bold/italic, lists,
 * inline code. NO raw HTML is ever interpreted (Feature 010 / Constitution IV).
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    if (token.startsWith('**') && token.endsWith('**')) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith('*') && token.endsWith('*')) return <em key={key}>{token.slice(1, -1)}</em>;
    if (token.startsWith('`') && token.endsWith('`'))
      return (
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-sm">
          {token.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={key}>{token}</React.Fragment>;
  });
}

export const RichTextBlock: React.FC<RichTextBlockProps> = ({ markdown }) => {
  const lines = (markdown ?? '').split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string): void => {
    if (list.length === 0) return;
    out.push(
      <ul key={key} className="my-2 list-disc pl-6 text-slate-700">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith('- ')) {
      list.push(line.slice(2));
      return;
    }
    flushList(`ul-${i}`);
    if (line.startsWith('## ')) out.push(<h4 key={i} className="mt-3 text-lg font-bold text-slate-900">{renderInline(line.slice(3), `h-${i}`)}</h4>);
    else if (line.startsWith('# ')) out.push(<h3 key={i} className="mt-3 text-xl font-bold text-slate-900">{renderInline(line.slice(2), `h-${i}`)}</h3>);
    else if (line.trim() === '') out.push(<div key={i} className="h-2" />);
    else out.push(<p key={i} className="my-1.5 text-slate-700">{renderInline(line, `p-${i}`)}</p>);
  });
  flushList('ul-end');

  return <div>{out}</div>;
};
