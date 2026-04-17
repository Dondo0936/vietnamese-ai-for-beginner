"use client";

import { useEffect, useState, useCallback } from "react";
import { markTopicRead } from "@/lib/database";

interface PearlRevealProps {
  topicSlug: string;
  onClose: () => void;
}

const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#d97706", "#92400e", "#fde68a"];

function randomConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotation: Math.random() * 360,
  }));
}

export default function PearlReveal({ topicSlug, onClose }: PearlRevealProps) {
  const [visible, setVisible] = useState(false);
  const [confetti] = useState(() => randomConfetti(24));

  useEffect(() => {
    markTopicRead(topicSlug);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [topicSlug]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Bạn đã tìm được viên ngọc!"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100">
          {confetti.map((c) => (
            <rect
              key={c.id}
              x={c.x}
              y={-10}
              width="2"
              height="3"
              fill={c.color}
              rx="0.5"
              transform={`rotate(${c.rotation} ${c.x} -10)`}
              className="animate-confetti-fall"
              style={{ animationDelay: `${c.delay}s` }}
            />
          ))}
        </svg>
        <div className="text-6xl animate-pearl-glow">🔮</div>
        <p className="text-xl font-bold text-white drop-shadow-lg">
          Tìm được viên ngọc rồi!
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-2 rounded-full bg-amber-400 px-6 py-2 text-sm font-bold text-amber-900 hover:bg-amber-300 transition-colors"
        >
          Tiếp tục phiêu lưu →
        </button>
      </div>
    </div>
  );
}
