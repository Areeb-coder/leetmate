import React from 'react';

// Simple markdown formatter to render bold and backticks inline in React
export const formatMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    
    while (currentIdx < line.length) {
      const boldStart = line.indexOf('**', currentIdx);
      if (boldStart === -1) {
        // Append remaining string parsed for backticks
        parts.push(...parseInlineCode(line.substring(currentIdx), `${lineIdx}-end`));
        break;
      }
      
      // Parse prefix for backticks
      parts.push(...parseInlineCode(line.substring(currentIdx, boldStart), `${lineIdx}-${boldStart}`));
      
      const boldEnd = line.indexOf('**', boldStart + 2);
      if (boldEnd === -1) {
        parts.push(...parseInlineCode(line.substring(boldStart), `${lineIdx}-unclosed`));
        break;
      }
      
      const boldText = line.substring(boldStart + 2, boldEnd);
      parts.push(
        <strong key={`${lineIdx}-${boldStart}`} className="font-bold text-white">
          {boldText}
        </strong>
      );
      
      currentIdx = boldEnd + 2;
    }
    
    return (
      <React.Fragment key={lineIdx}>
        {parts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const parseInlineCode = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentIdx = 0;
  
  while (currentIdx < text.length) {
    const codeStart = text.indexOf('`', currentIdx);
    if (codeStart === -1) {
      parts.push(text.substring(currentIdx));
      break;
    }
    
    parts.push(text.substring(currentIdx, codeStart));
    
    const codeEnd = text.indexOf('`', codeStart + 1);
    if (codeEnd === -1) {
      parts.push(text.substring(codeStart));
      break;
    }
    
    const codeText = text.substring(codeStart + 1, codeEnd);
    parts.push(
      <code key={`${keyPrefix}-${codeStart}`} className="px-1.5 py-0.5 rounded bg-surface-lowest text-primary-dim border border-outline-variant/10 font-mono text-[10px]">
        {codeText}
      </code>
    );
    
    currentIdx = codeEnd + 1;
  }
  
  return parts;
};
