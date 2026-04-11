"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXProps {
  /** Raw LaTeX string, e.g. "\\theta = \\theta - \\alpha \\nabla L" */
  children: string;
  /** Render as block (centered, larger) or inline */
  block?: boolean;
}

export default function LaTeX({ children, block = false }: LaTeXProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return children;
    }
  }, [children, block]);

  if (block) {
    return (
      <div
        className="katex-display my-4 text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className="katex-inline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
