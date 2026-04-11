"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({ children, language = "python", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border code-block">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <span className="text-xs font-mono text-muted">
          {title ?? language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Đã sao chép
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Sao chép
            </>
          )}
        </button>
      </div>

      {/* Code area */}
      <div
        className="overflow-x-auto"
        style={{ backgroundColor: "#1e1e2e" }}
      >
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-[#cdd6f4] whitespace-pre">
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}
