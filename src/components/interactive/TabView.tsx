"use client";

import React, { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
}

export default function TabView({ tabs }: TabViewProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-inset focus:ring-2 focus:ring-ring ${
              active === i
                ? "border-b-2 border-accent text-accent"
                : "border-b-2 border-transparent text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">{tabs[active]?.content}</div>
    </div>
  );
}
